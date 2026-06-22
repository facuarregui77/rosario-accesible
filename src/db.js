// Capa de datos: usa Supabase (nube, colaborativo) si hay claves configuradas;
// si no, cae automáticamente a localStorage (datos solo en este navegador).
//
// Variables de entorno necesarias para el modo nube (ver .env.example):
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ¿Está configurada la nube?
export const cloud = Boolean(url && key);
const supabase = cloud ? createClient(url, key) : null;

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
};

// ---- Modo nube (Supabase) ----
async function cloudLoadAll() {
  const overrides = {}, reviews = {};
  const [acc, rev] = await Promise.all([
    supabase.from("place_access").select("*"),
    supabase.from("reviews").select("*").order("created_at", { ascending: true }),
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
    const { error } = await supabase.from("place_access").upsert(row, { onConflict: "place_id" });
    if (error) console.error("Supabase saveAccess:", error.message);
  } else {
    await local.saveAccess(nextOverrides);
  }
}

// Agregar una reseña. `nextReviews` es el objeto completo (modo local).
export async function addReview(placeId, review, nextReviews) {
  if (cloud) {
    const { error } = await supabase.from("reviews").insert({
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

// ---- Autenticación (modo nube) ----
// Login del admin. Devuelve { error } si falla.
export async function signIn(email, password) {
  if (!cloud) return { error: { message: "Supabase no está configurado." } };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error };
}
export async function signOut() {
  if (cloud) await supabase.auth.signOut();
}
// Sesión actual (o null).
export async function getSession() {
  if (!cloud) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}
// Suscribirse a cambios de login/logout. Devuelve una función para desuscribir.
export function onAuthChange(cb) {
  if (!cloud) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
