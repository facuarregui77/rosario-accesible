// Importa de OpenStreetMap las empresas, comercios y servicios de Rosario que tienen DATO REAL de acceso
// en silla de ruedas (wheelchair=yes/limited/no). Los que no tienen dato no se importan: llenarían el mapa
// de pines grises sin información útil.
// Escribe src/data/empresas-osm.js. Uso: node scripts/importar-empresas-osm.mjs (y después subir el cambio).
import fs from "node:fs";
import { PLACES } from "../src/data/places-base.js";

const B = "-33.06,-60.82,-32.83,-60.55";
const Q = `[out:json][timeout:180];(
nwr["office"]["name"]["wheelchair"](${B});
nwr["shop"]["name"]["wheelchair"](${B});
nwr["amenity"~"^(bank|travel_agency|pharmacy|cafe|fast_food|ice_cream|cinema|theatre|library|post_office|townhall|courthouse|clinic|dentist|doctors|restaurant|bar|pub)$"]["name"]["wheelchair"](${B});
nwr["tourism"~"^(hotel|hostel|motel|museum|gallery)$"]["name"]["wheelchair"](${B});
);out tags center;`;

const tipo = (t) => {
  const a = t.amenity, s = t.shop, o = t.office, tu = t.tourism;
  if (["restaurant"].includes(a)) return "restaurant";
  if (["bar", "pub"].includes(a)) return "bar";
  if (["cafe", "fast_food", "ice_cream"].includes(a)) return "gastronomia";
  if (["pharmacy", "clinic", "dentist", "doctors"].includes(a) || ["chemist", "optician", "medical_supply", "hearing_aids"].includes(s)) return "salud";
  if (["townhall", "courthouse", "post_office"].includes(a) || o === "government") return "gobierno";
  if (["cinema", "theatre", "library"].includes(a) || ["museum", "gallery"].includes(tu)) return "cultural";
  if (["hotel", "hostel", "motel"].includes(tu)) return "alojamiento";
  if (o || ["bank", "travel_agency"].includes(a)) return "servicio";
  if (s) return "comercio";
  return null;
};
const W = { yes: "si", limited: "parcial", no: "no" };
const rad = (d) => (d * Math.PI) / 180;
const distM = (a, b) => { const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2; return 2 * 6371000 * Math.asin(Math.sqrt(x)); };
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");

// Prueba varios servidores de OpenStreetMap (a veces alguno está saturado)
const SERVIDORES = ["https://overpass-api.de/api/interpreter", "https://overpass.private.coffee/api/interpreter", "https://overpass.kumi.systems/api/interpreter"];
let r = null;
for (let intento = 0; intento < 2 && !(r && r.ok); intento++) {
  for (const url of SERVIDORES) {
    try {
      r = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(Q),
        headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rosario-accesible/1.0 (github.com/facuarregui77/rosario-accesible)" } });
      if (r.ok) break;
      console.log("  " + url + " respondió " + r.status + ", pruebo otro…");
    } catch (e) { console.log("  " + url + " no respondió, pruebo otro…"); }
  }
}
if (!r || !r.ok) { console.error("OpenStreetMap no respondió. Probá de nuevo en unos minutos."); process.exit(1); }
const els = (await r.json()).elements;

const out = [], vistos = new Set();
let repetidos = 0;
for (const e of els) {
  const t = e.tags || {};
  const w = W[t.wheelchair], ty = tipo(t);
  const lat = e.lat ?? (e.center && e.center.lat), lng = e.lon ?? (e.center && e.center.lon);
  if (!w || !ty || lat == null) continue;
  const p = { lat, lng };
  // no duplicar los lugares que ya están cargados a mano
  if (PLACES.some((b) => distM(b, p) < 120 && (norm(b.name).includes(norm(t.name)) || norm(t.name).includes(norm(b.name))))) { repetidos++; continue; }
  const clave = norm(t.name) + Math.round(lat * 2000) + Math.round(lng * 2000);
  if (vistos.has(clave)) continue;
  vistos.add(clave);
  const calle = t["addr:street"] ? t["addr:street"] + (t["addr:housenumber"] ? " " + t["addr:housenumber"] : "") : null;
  const ig = t["contact:instagram"] || t.instagram;
  const fila = {
    id: `osm_${e.type[0]}${e.id}`, name: t.name.trim(), type: ty,
    lat: +lat.toFixed(6), lng: +lng.toFixed(6), wheelchair: w,
    src: `https://www.openstreetmap.org/${e.type}/${e.id}`,
  };
  if (t["toilets:wheelchair"] === "yes") fila.bano = "si";
  if (t["toilets:wheelchair"] === "no") fila.bano = "no";
  const c = {};
  if (calle) c.direccion = calle;
  if (t.phone || t["contact:phone"]) c.telefono = t.phone || t["contact:phone"];
  if (t.website || t["contact:website"]) c.web = t.website || t["contact:website"];
  if (ig) c.instagram = ig.startsWith("http") ? ig : "https://instagram.com/" + ig.replace(/^@/, "");
  if (Object.keys(c).length) fila.c = c;
  out.push(fila);
}
out.sort((a, b) => a.name.localeCompare(b.name, "es"));
const js = `// GENERADO por scripts/importar-empresas-osm.mjs — no editar a mano.
// Empresas, comercios y servicios de Rosario con dato real de acceso en silla de ruedas (OpenStreetMap, ODbL).
// Actualizado: ${new Date().toISOString().slice(0, 10)} · ${out.length} lugares.
export const EMPRESAS_OSM = ${JSON.stringify(out)};
`;
fs.writeFileSync(new URL("../src/data/empresas-osm.js", import.meta.url), js, "utf8");
const porTipo = out.reduce((m, x) => ((m[x.type] = (m[x.type] || 0) + 1), m), {});
console.log(`Listo: ${out.length} lugares (se saltearon ${repetidos} que ya estaban cargados).`, porTipo);
