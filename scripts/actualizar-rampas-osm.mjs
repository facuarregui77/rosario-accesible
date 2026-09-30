// Actualiza src/rampas-rosario.json con los rebajes de cordón, rampas y cruces accesibles
// de OpenStreetMap (Overpass). Correr con:  node scripts/actualizar-rampas-osm.mjs
// Es la misma consulta que se usó para el archivo original, con algunos tags más:
//   kerb=lowered|flush, ramp=yes, ramp:wheelchair=yes, highway=elevator, wheelchair=yes en cruces,
//   tactile_paving=yes en cruces (baldosas podotáctiles) y crossing con kerb lowered/flush.
import fs from "node:fs";

const OUT = new URL("../src/rampas-rosario.json", import.meta.url);
// Caja que abarca Rosario (sur, oeste, norte, este)
const BBOX = "-33.06,-60.82,-32.83,-60.55";
const QUERY = `
[out:json][timeout:120];
(
  node["kerb"="lowered"](${BBOX});
  node["kerb"="flush"](${BBOX});
  node["ramp"="yes"](${BBOX});
  node["ramp:wheelchair"="yes"](${BBOX});
  node["highway"="elevator"](${BBOX});
  node["highway"="crossing"]["wheelchair"="yes"](${BBOX});
  node["highway"="crossing"]["tactile_paving"="yes"](${BBOX});
  node["highway"="crossing"]["kerb"~"lowered|flush"](${BBOX});
  node["entrance"]["wheelchair"="yes"](${BBOX});
);
out body;`;

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

async function run() {
  let json = null, lastErr = null;
  for (const url of MIRRORS) {
    try {
      console.log("Consultando", url, "…");
      const res = await fetch(url, { method: "POST", body: "data=" + encodeURIComponent(QUERY), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rosario-accesible/1.0 (github.com/facuarregui77/rosario-accesible)" } });
      if (!res.ok) throw new Error("HTTP " + res.status);
      json = await res.json();
      break;
    } catch (e) { lastErr = e; console.log("  falló:", e.message); }
  }
  if (!json) { console.error("No se pudo consultar OpenStreetMap:", lastErr && lastErr.message); process.exit(1); }

  const seen = new Set();
  const points = [];
  for (const el of json.elements || []) {
    if (el.type !== "node" || el.lat == null) continue;
    const lat = +el.lat.toFixed(6), lng = +el.lon.toFixed(6);
    const k = lat + "," + lng;
    if (seen.has(k)) continue;
    seen.add(k);
    points.push([lat, lng]);
  }
  points.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  let prev = 0;
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")).count || 0; } catch (e) {}
  const out = {
    source: "OpenStreetMap (ODbL)",
    note: "Rebajes de cordon, rampas, ascensores, entradas accesibles y cruces accesibles/podotactiles en Rosario (kerb=lowered|flush, ramp=yes, ramp:wheelchair=yes, highway=elevator, entrance+wheelchair=yes, crossings con wheelchair=yes / tactile_paving=yes / kerb lowered)",
    fetched: new Date().toISOString().slice(0, 10),
    count: points.length,
    points,
  };
  fs.writeFileSync(OUT, JSON.stringify(out), "utf8");
  console.log(`Listo: ${prev} → ${points.length} puntos. Archivo: src/rampas-rosario.json`);
}
run();
