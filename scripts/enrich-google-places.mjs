// Enriquecimiento de accesibilidad con Google Places API (New).
//
// Qué hace: para cada lugar de places.json, le pregunta a Google si tiene
// entrada / baño accesibles en silla de ruedas, y crea SUGERENCIAS PENDIENTES
// en Supabase (las mismas que después aprobás desde el panel "Sugerencias" de la app).
//
// Filosofía: NO toca el mapa directamente. Google entra como un "sugeridor" más,
// y vos validás cada dato desde la app. Así mantenemos la integridad ("no se publica
// nada sin tu OK") reutilizando el circuito de moderación que ya existe.
//
// Uso:
//   1) node scripts/enrich-google-places.mjs            (modo prueba: solo genera un informe)
//   2) node scripts/enrich-google-places.mjs --push     (sube las sugerencias a Supabase)
//
// Variables de entorno necesarias (podés ponerlas en .env.local):
//   GOOGLE_MAPS_API_KEY=...        (clave de Google Maps Platform con "Places API (New)" activada)
//   VITE_SUPABASE_URL=...          (ya la tenés)
//   VITE_SUPABASE_ANON_KEY=...     (ya la tenés)

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PUSH = process.argv.includes("--push");

// --- Cargar variables de entorno desde .env.local (simple) + process.env ---
async function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = await readFile(join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    }
  } catch { /* no hay .env.local, usamos process.env */ }
  return env;
}

// --- Mapear la respuesta de Google a nuestro esquema (si / no / null) ---
const yn = (v) => (v === true ? "si" : v === false ? "no" : null);

async function queryGoogle(place, apiKey) {
  const body = {
    textQuery: `${place.name}, Rosario, Santa Fe, Argentina`,
    languageCode: "es",
    maxResultCount: 1,
    locationBias: { circle: { center: { latitude: place.lat, longitude: place.lng }, radius: 400 } },
  };
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      // Pedimos SOLO los campos que usamos → mantiene el costo en el tier mínimo.
      "X-Goog-FieldMask": "places.id,places.displayName,places.accessibilityOptions",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.places && data.places[0]) || null;
}

function buildSuggestion(place, gplace) {
  const acc = gplace?.accessibilityOptions || {};
  const wheelchair = yn(acc.wheelchairAccessibleEntrance);
  const bano = yn(acc.wheelchairAccessibleRestroom);

  // Contexto extra (estacionamiento / asientos) que Google sí informa pero no es
  // un criterio nuestro: lo dejamos en el comentario para que lo veas al moderar.
  const extra = [];
  if (acc.wheelchairAccessibleParking != null) extra.push(`estacionamiento accesible: ${acc.wheelchairAccessibleParking ? "sí" : "no"}`);
  if (acc.wheelchairAccessibleSeating != null) extra.push(`asientos accesibles: ${acc.wheelchairAccessibleSeating ? "sí" : "no"}`);

  const hasSomething = wheelchair != null || bano != null || extra.length > 0;
  if (!hasSomething) return null;

  return {
    place_id: place.id,
    wheelchair,
    bano,
    rampa: null, ascensor: null, braille: null, senas: null,
    comment: `Datos de Google Maps (verificar)${extra.length ? " · " + extra.join(" · ") : ""}.`,
    name: "Google Places (automático)",
    status: "pending",
  };
}

async function pushSuggestions(rows, env) {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/access_suggestions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.VITE_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function main() {
  const env = await loadEnv();
  if (!env.GOOGLE_MAPS_API_KEY) { console.error("❌ Falta GOOGLE_MAPS_API_KEY"); process.exit(1); }
  if (PUSH && (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY)) {
    console.error("❌ Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY para --push"); process.exit(1);
  }

  const places = JSON.parse(await readFile(join(__dirname, "places.json"), "utf8"));
  console.log(`🔎 Consultando Google para ${places.length} lugares (${PUSH ? "MODO PUSH" : "modo prueba"})…\n`);

  const suggestions = [];
  const report = [];
  for (const place of places) {
    try {
      const gplace = await queryGoogle(place, env.GOOGLE_MAPS_API_KEY);
      const sug = buildSuggestion(place, gplace);
      if (sug) {
        suggestions.push(sug);
        console.log(`✅ ${place.name} → silla:${sug.wheelchair ?? "—"} baño:${sug.bano ?? "—"}`);
        report.push({ ...place, found: !!gplace, ...sug });
      } else {
        console.log(`➖ ${place.name} → Google no informa accesibilidad`);
        report.push({ ...place, found: !!gplace, note: "sin datos de accesibilidad" });
      }
    } catch (e) {
      console.log(`⚠️  ${place.name} → ${e.message}`);
      report.push({ ...place, error: e.message });
    }
    await new Promise((r) => setTimeout(r, 200)); // pausa cortita entre llamadas
  }

  await writeFile(join(__dirname, "enrich-report.json"), JSON.stringify(report, null, 2));
  console.log(`\n📄 Informe guardado en scripts/enrich-report.json`);
  console.log(`📊 ${suggestions.length} lugares con algún dato de accesibilidad.`);

  if (!PUSH) {
    console.log(`\nℹ️  Modo prueba: NO se subió nada. Revisá el informe y, si te convence,`);
    console.log(`   corré:  node scripts/enrich-google-places.mjs --push`);
    return;
  }
  if (suggestions.length === 0) { console.log("Nada para subir."); return; }

  // Subimos en lotes de 50 para no mandar un body gigante.
  for (let i = 0; i < suggestions.length; i += 50) {
    await pushSuggestions(suggestions.slice(i, i + 50), env);
  }
  console.log(`\n🚀 Subidas ${suggestions.length} sugerencias PENDIENTES.`);
  console.log(`   Entrá a la app como admin → botón "Sugerencias" → revisá y aprobá las que correspondan.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
