// Capa de datos: usa Supabase (nube, colaborativo) si hay claves configuradas;
// si no, cae automáticamente a localStorage (datos solo en este navegador).
//
// Variables de entorno necesarias para el modo nube (ver .env.example):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ¿Está configurada la nube?
export const cloud = Boolean(url && key);

// Cliente de Supabase cargado de forma diferida (lazy): la librería NO entra al bundle
// inicial, así la app (mapa + header) aparece más rápido. Se importa al primer uso.
let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) => createClient(url, key));
  }
  return clientPromise;
}

const ACCESS_KEYS = ["bano", "rampa", "ascensor", "braille", "senas"];

// ---- Modo local (localStorage, vía window.storage) ----
const local = {
  async loadAll() {
    const out = { overrides: {}, reviews: {} };
    try {
      const ov = await window.storage.get("access_overrides");
      if (ov && ov.value) out.overrides = JSON.parse(ov.value);
    } catch (e) { /* sin datos */ }
    try {
      const rv = await window.storage.get("reviews_all");
      if (rv && rv.value) out.reviews = JSON.parse(rv.value);
    } catch (e) { /* sin datos */ }
    return out;
  },
  async saveAccess(overrides) {
    try { await window.storage.set("access_overrides", JSON.stringify(overrides)); } catch (e) {}
  },
  async saveReviews(reviews) {
    try { await window.storage.set("reviews_all", JSON.stringify(reviews)); } catch (e) {}
  },
  async clearMyAccess() {
    try { await window.storage.delete("access_overrides"); } catch (e) {}
  },
  async loadSuggestions() {
    try { const r = await window.storage.get("suggestions_pending"); return r && r.value ? JSON.parse(r.value) : []; } catch (e) { return []; }
  },
  async saveSuggestions(arr) {
    try { await window.storage.set("suggestions_pending", JSON.stringify(arr || [])); } catch (e) {}
  },
};

// ---- Modo nube (Supabase) ----
async function cloudLoadAll() {
  const overrides = {}, reviews = {};
  const sb = await getClient();
  const [acc, rev] = await Promise.all([
    sb.from("place_access").select("*"),
    sb.from("reviews").select("*").order("created_at", { ascending: true }),
  ]);
  (acc.data || []).forEach((r) => {
    overrides[r.place_id] = {
      ...Object.fromEntries(ACCESS_KEYS.map((k) => [k, r[k] ?? null])),
      wheelchair: r.wheelchair ?? null, // estado general (semáforo); null = sin dato → se mantiene el de OSM
    };
  });
  (rev.data || []).forEach((r) => {
    (reviews[r.place_id] ||= []).push({ stars: r.stars, kind: r.kind || "experiencia", name: r.name, text: r.text, date: r.date });
  });
  return { overrides, reviews };
}

// ---- API pública (la app usa esto, sin saber qué modo está activo) ----
export async function loadAll() {
  return cloud ? cloudLoadAll() : local.loadAll();
}

// Guardar/actualizar el detalle de accesibilidad de un lugar.
// `data` incluye los 5 criterios y (opcional) `wheelchair` (estado general).
// `nextOverrides` es el objeto completo (para el modo local); `placeId`/`data` para la nube.
export async function saveAccess(placeId, data, nextOverrides) {
  if (cloud) {
    const row = {
      place_id: placeId,
      ...Object.fromEntries(ACCESS_KEYS.map((k) => [k, data[k] ?? null])),
      wheelchair: data.wheelchair ?? null,
      updated_at: new Date().toISOString(),
    };
    const sb = await getClient();
    const { error } = await sb.from("place_access").upsert(row, { onConflict: "place_id" });
    if (error) console.error("Supabase saveAccess:", error.message);
  } else {
    await local.saveAccess(nextOverrides);
  }
}

// Agregar una reseña. `nextReviews` es el objeto completo (modo local).
export async function addReview(placeId, review, nextReviews) {
  if (cloud) {
    const sb = await getClient();
    const { error } = await sb.from("reviews").insert({
      place_id: placeId, stars: review.stars || null, kind: review.kind || "experiencia", name: review.name, text: review.text, date: review.date,
    });
    if (error) console.error("Supabase addReview:", error.message);
  } else {
    await local.saveReviews(nextReviews);
  }
}

// Borrar los datos cargados (solo tiene sentido en modo local).
export async function clearMyAccess() {
  if (!cloud) await local.clearMyAccess();
}

// ---- Sugerencias de accesibilidad del público (capa 2) ----
// Crear una sugerencia (queda 'pending'). `nextLocal` es la cola completa (modo local).
export async function addSuggestion(placeId, s, nextLocal) {
  if (cloud) {
    const sb = await getClient();
    const { error } = await sb.from("access_suggestions").insert({
      place_id: placeId,
      wheelchair: s.wheelchair ?? null,
      bano: s.bano ?? null, rampa: s.rampa ?? null, ascensor: s.ascensor ?? null, braille: s.braille ?? null, senas: s.senas ?? null,
      comment: s.comment || null, name: s.name || null, status: "pending",
    });
    if (error) console.error("Supabase addSuggestion:", error.message);
    return { error };
  }
  await local.saveSuggestions(nextLocal);
  return { error: null };
}

// Cargar las sugerencias pendientes (solo admin las puede leer en la nube por RLS).
export async function loadPendingSuggestions() {
  if (!cloud) return local.loadSuggestions();
  const sb = await getClient();
  const { data, error } = await sb.from("access_suggestions").select("*").eq("status", "pending").order("created_at", { ascending: true });
  if (error) { console.error("Supabase loadPendingSuggestions:", error.message); return []; }
  return data || [];
}

// Aprobar / rechazar una sugerencia. `nextLocal` es la cola restante (modo local).
export async function setSuggestionStatus(id, status, nextLocal) {
  if (!cloud) { await local.saveSuggestions(nextLocal || []); return; }
  const sb = await getClient();
  const { error } = await sb.from("access_suggestions").update({ status }).eq("id", id);
  if (error) console.error("Supabase setSuggestionStatus:", error.message);
}

// ---- Autenticación (modo nube) ----
// Login del admin. Devuelve { error } si falla.
export async function signIn(email, password) {
  if (!cloud) return { error: { message: "Supabase no está configurado." } };
  const sb = await getClient();
  const { error } = await sb.auth.signInWithPassword({ email, password });
  return { error };
}
export async function signOut() {
  if (cloud) { const sb = await getClient(); await sb.auth.signOut(); }
}
// Sesión actual (o null).
export async function getSession() {
  if (!cloud) return null;
  const sb = await getClient();
  const { data } = await sb.auth.getSession();
  return data.session;
}
// Suscribirse a cambios de login/logout. Devuelve una función para desuscribir.
// El cliente se carga de forma diferida; la suscripción se engancha cuando está listo.
export function onAuthChange(cb) {
  if (!cloud) return () => {};
  let cancelled = false;
  let unsub = () => {};
  getClient().then((sb) => {
    if (cancelled) return;
    const { data } = sb.auth.onAuthStateChange((_event, session) => cb(session));
    unsub = () => data.subscription.unsubscribe();
  });
  return () => { cancelled = true; unsub(); };
}
