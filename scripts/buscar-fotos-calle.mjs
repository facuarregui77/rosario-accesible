// Fotos de calle de Mapillary (licencia libre CC BY-SA 4.0) para los lugares que no tienen fotos de Wikimedia.
// Necesita MAPILLARY_TOKEN en .env.local (clave de solo lectura de una cuenta gratuita de mapillary.com).
//
// Paso 1 — buscar candidatas:   node scripts/buscar-fotos-calle.mjs
//   Para cada lugar sin fotos busca fotos sacadas a 8–60 m y con la cámara apuntando hacia el lugar,
//   y baja las 3 mejores a la carpeta temporal "revision-fotos-calle" para mirarlas.
// Paso 2 — revisar a ojo y anotar las correctas en scripts/fotos-calle-aprobadas.json  { "idDelLugar": ["idDeFoto"] }
// Paso 3 — guardar:             node scripts/buscar-fotos-calle.mjs --guardar
//   Baja las aprobadas a public/fotos-calle/ (las URL de Mapillary vencen, por eso se guardan) y las suma a src/fotos.json.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { PLACES } from "../src/data/places-base.js"; // solo los lugares relevados a mano

const RAIZ = new URL("..", import.meta.url);
const env = fs.readFileSync(new URL(".env.local", RAIZ), "utf8");
const TOKEN = (env.match(/^MAPILLARY_TOKEN=(.+)$/m) || [])[1]?.trim();
if (!TOKEN) { console.error("Falta MAPILLARY_TOKEN en .env.local"); process.exit(1); }
const FOTOS = new URL("src/fotos.json", RAIZ);
const APROBADAS = new URL("scripts/fotos-calle-aprobadas.json", RAIZ);
const CARPETA = new URL("public/fotos-calle/", RAIZ);
const REVISION = path.join(os.tmpdir(), "revision-fotos-calle");

const j = async (u) => { for (let i = 0; i < 3; i++) { try { const r = await fetch(u); if (r.ok) return r.json(); } catch {} await new Promise((r) => setTimeout(r, 1500)); } return null; };
const rad = (d) => (d * Math.PI) / 180;
const distM = (a, b) => { const s = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2; return 2 * 6371000 * Math.asin(Math.sqrt(s)); };
const rumbo = (a, b) => { const y = Math.sin(rad(b.lng - a.lng)) * Math.cos(rad(b.lat)); const x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lng - a.lng)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; };
const difAng = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };
const CAMPOS = "id,thumb_1024_url,captured_at,compass_angle,computed_compass_angle,computed_geometry,geometry,is_pano,creator";

async function candidatas(p) {
  const dLat = 0.00055, dLng = 0.00065; // ~60 m
  const u = `https://graph.mapillary.com/images?access_token=${encodeURIComponent(TOKEN)}&bbox=${p.lng - dLng},${p.lat - dLat},${p.lng + dLng},${p.lat + dLat}&fields=${CAMPOS}&limit=500`;
  const d = await j(u);
  return ((d && d.data) || []).filter((im) => !im.is_pano && im.thumb_1024_url).map((im) => {
    const g = (im.computed_geometry || im.geometry).coordinates;
    const desde = { lat: g[1], lng: g[0] };
    const dist = distM(desde, p);
    const giro = difAng(im.computed_compass_angle ?? im.compass_angle, rumbo(desde, p));
    const anios = (Date.now() - im.captured_at) / 3.15e10;
    // mejor: apunta al lugar, a unos 20 m, y es reciente
    const puntaje = giro / 45 + Math.abs(dist - 20) / 30 + anios / 8;
    return { ...im, dist, giro, anios, puntaje };
  }).filter((c) => c.dist >= 8 && c.dist <= 60 && c.giro <= 50).sort((a, b) => a.puntaje - b.puntaje);
}

async function bajar(url, destino) {
  const r = await fetch(url);
  if (!r.ok) throw new Error("No se pudo bajar " + url);
  fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
}

if (process.argv.includes("--guardar")) {
  const aprobadas = JSON.parse(fs.readFileSync(APROBADAS, "utf8"));
  const fotos = JSON.parse(fs.readFileSync(FOTOS, "utf8"));
  fs.mkdirSync(CARPETA, { recursive: true });
  let n = 0;
  for (const [lugar, ids] of Object.entries(aprobadas)) {
    if (lugar.startsWith("_")) continue;
    const lista = [];
    for (const id of ids) {
      const im = await j(`https://graph.mapillary.com/${id}?access_token=${encodeURIComponent(TOKEN)}&fields=id,thumb_1024_url,creator,captured_at`);
      if (!im || !im.thumb_1024_url) { console.log("  no se encontró la foto " + id); continue; }
      await bajar(im.thumb_1024_url, new URL(`${id}.jpg`, CARPETA));
      lista.push({ url: `/fotos-calle/${id}.jpg`, autor: (im.creator && im.creator.username) || "Autor desconocido", licencia: "CC BY-SA 4.0",
        pagina: `https://www.mapillary.com/app/?pKey=${id}`, archivo: `mapillary-${id}`, fuente: "Mapillary", anio: new Date(im.captured_at).getFullYear() });
      n++;
    }
    if (lista.length) {
      const previas = (fotos[lugar] && fotos[lugar].fotos || []).filter((f) => f.fuente !== "Mapillary");
      fotos[lugar] = { ...(fotos[lugar] || { wikidata: null }), fotos: [...previas, ...lista] };
    }
  }
  fs.writeFileSync(FOTOS, JSON.stringify(fotos, null, 1), "utf8");
  console.log(`Listo: ${n} fotos de calle guardadas en public/fotos-calle y sumadas a src/fotos.json`);
} else {
  const ya = JSON.parse(fs.readFileSync(FOTOS, "utf8"));
  fs.rmSync(REVISION, { recursive: true, force: true });
  fs.mkdirSync(REVISION, { recursive: true });
  const resumen = {};
  for (const p of PLACES) {
    if (ya[p.id] && ya[p.id].fotos.some((f) => f.fuente !== "Mapillary")) continue;
    const c = (await candidatas(p)).slice(0, 3);
    resumen[p.id] = c.map((x) => ({ id: x.id, dist: Math.round(x.dist), giro: Math.round(x.giro), anio: new Date(x.captured_at).getFullYear() }));
    for (const [i, x] of c.entries()) await bajar(x.thumb_1024_url, path.join(REVISION, `${p.id}__${i}__${x.id}.jpg`));
    console.log(`  ${c.length}  ${p.name}`);
  }
  fs.writeFileSync(path.join(REVISION, "candidatas.json"), JSON.stringify(resumen, null, 1));
  console.log(`\nCandidatas en: ${REVISION}`);
}
