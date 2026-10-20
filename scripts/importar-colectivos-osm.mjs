// IMPORTAR COLECTIVOS DE ROSARIO (OpenStreetMap)
// Baja los recorridos de las líneas de colectivo de Rosario cargados en OpenStreetMap (con sus paradas, en
// orden) y arma src/data/colectivos.json, que usa "Cómo llego → Colectivo" para calcular qué línea tomar,
// dónde subir y bajar y cuánto tarda el viaje. No hay horarios: el tiempo es una estimación.
//
// Uso:  node scripts/importar-colectivos-osm.mjs
// Cuándo correrlo: cada tanto (cambian recorridos o se agregan líneas en OpenStreetMap).
import fs from "fs";

const BBOX = "-33.06,-60.82,-32.83,-60.55"; // un poco más que la ciudad (incluye accesos a Funes y Pérez)
const SERVIDORES = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];
// Redes que se dejan afuera: el bus turístico y los micros de larga distancia
const EXCLUIR_RED = ["City Tour", "Nacional"];

// Con la variable CACHE=<carpeta> guarda las respuestas y las reutiliza (para probar sin volver a bajar todo)
const CACHE = process.env.CACHE;
let nConsulta = 0;
async function overpass(q) {
  const archivo = CACHE && `${CACHE}/overpass-${++nConsulta}.json`;
  if (archivo && fs.existsSync(archivo)) return JSON.parse(fs.readFileSync(archivo, "utf8"));
  const r = await overpassRed(q);
  if (archivo) { fs.mkdirSync(CACHE, { recursive: true }); fs.writeFileSync(archivo, JSON.stringify(r)); }
  return r;
}
async function overpassRed(q) {
  let espera = 5000;
  for (let vuelta = 0; vuelta < 5; vuelta++) {
    for (const s of SERVIDORES) {
      try {
        const r = await fetch(s, { method: "POST", body: "data=" + encodeURIComponent(q), headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "rosario-accesible/1.0" } });
        const t = await r.text();
        if (t.startsWith("{")) return JSON.parse(t);
      } catch (e) { /* probamos el siguiente servidor */ }
    }
    console.log(`  servidores ocupados, reintento en ${espera / 1000} s…`);
    await new Promise((ok) => setTimeout(ok, espera)); espera *= 2;
  }
  throw new Error("No respondió ningún servidor de OpenStreetMap. Probá más tarde.");
}

const R = 6371000, rad = Math.PI / 180;
const dist = (a, b) => { const x = (b[1] - a[1]) * rad * Math.cos(((a[0] + b[0]) / 2) * rad), y = (b[0] - a[0]) * rad; return Math.sqrt(x * x + y * y) * R; };
const [S, W, N, E] = BBOX.split(",").map(Number);
const adentro = (p) => p[0] >= S && p[0] <= N && p[1] >= W && p[1] <= E;
const r5 = (v) => Math.round(v * 1e5) / 1e5;

// Simplificación Douglas-Peucker (en metros, aproximado) para que el archivo pese poco
function simplificar(pts, tol) {
  if (pts.length < 3) return pts.map((_, i) => i);
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const pila = [[0, pts.length - 1]];
  while (pila.length) {
    const [i, j] = pila.pop(); let max = 0, k = -1;
    const A = pts[i], B = pts[j], dAB = dist(A, B);
    // a metros sobre un plano local (alcanza para distancias de una ciudad)
    const kx = rad * R * Math.cos(A[0] * rad), ky = rad * R;
    const bx = (B[1] - A[1]) * kx, by = (B[0] - A[0]) * ky;
    for (let m = i + 1; m < j; m++) {
      const px = (pts[m][1] - A[1]) * kx, py = (pts[m][0] - A[0]) * ky;
      const d = dAB < 1 ? Math.hypot(px, py) : Math.abs(bx * py - by * px) / dAB;
      if (d > max) { max = d; k = m; }
    }
    if (max > tol && k > 0) { keep[k] = 1; pila.push([i, k], [k, j]); }
  }
  return [...keep.keys()].filter((i) => keep[i]);
}

console.log("Bajando recorridos de colectivos de OpenStreetMap…");
const geo = await overpass(`[out:json][timeout:180];rel["route"="bus"](${BBOX})->.r;.r out body;.r >;out skel qt;`);
console.log("Bajando nombres de las paradas…");
const conNombre = await overpass(`[out:json][timeout:180];rel["route"="bus"](${BBOX})->.r;node(r.r);out body qt;`);
console.log("Bajando nombres de las calles…");
const calles = await overpass(`[out:json][timeout:180];rel["route"="bus"](${BBOX})->.r;way(r.r);out tags qt;`);

const nodos = new Map(), vias = new Map(), nombres = new Map();
for (const e of geo.elements) {
  if (e.type === "node") nodos.set(e.id, [e.lat, e.lon]);
  else if (e.type === "way") vias.set(e.id, e.nodes);
}
for (const e of conNombre.elements) if (e.tags && e.tags.name) nombres.set(e.id, e.tags.name.trim());
const nombreCalle = new Map();
for (const e of calles.elements) if (e.tags && e.tags.name) nombreCalle.set(e.id, e.tags.name.trim());

const lineas = [];
let descartadas = 0;
for (const rel of geo.elements.filter((e) => e.type === "relation")) {
  const t = rel.tags || {};
  if (EXCLUIR_RED.includes(t.network)) { descartadas++; continue; }
  // 1) Recorrido: las calles (ways) en orden, encadenadas y dadas vuelta cuando hace falta
  let ids = [], deCalle = [], tramos = 0;   // deCalle[i] = nombre de la calle del punto i
  for (const m of rel.members.filter((m) => m.type === "way" && (m.role === "" || m.role === "forward" || m.role === "backward"))) {
    const w = vias.get(m.ref); if (!w || !w.length) continue;
    tramos++;
    const calle = nombreCalle.get(m.ref) || "";
    if (!ids.length) { ids = w.slice(); deCalle = w.map(() => calle); continue; }
    // el primer tramo puede estar cargado al revés: se nota recién al ver el segundo
    if (tramos === 2 && w[0] !== ids[ids.length - 1] && w[w.length - 1] !== ids[ids.length - 1] && (w[0] === ids[0] || w[w.length - 1] === ids[0])) ids.reverse();
    const ult = ids[ids.length - 1];
    const antes = ids.length;
    if (w[0] === ult) ids.push(...w.slice(1));
    else if (w[w.length - 1] === ult) ids.push(...w.slice(0, -1).reverse());
    else ids.push(...w); // hueco en el mapa: seguimos igual
    for (let i = antes; i < ids.length; i++) deCalle.push(calle);
  }
  const validos = ids.map((id, i) => i).filter((i) => nodos.get(ids[i]));
  const forma = validos.map((i) => nodos.get(ids[i])), calleDe = validos.map((i) => deCalle[i]);
  if (forma.length < 2) { descartadas++; continue; }
  const acum = [0];
  for (let i = 1; i < forma.length; i++) acum.push(acum[i - 1] + dist(forma[i - 1], forma[i]));

  // 2) Paradas en orden (andén si está; si no, el punto de parada), ubicadas a lo largo del recorrido
  const rolesAnden = rel.members.filter((m) => m.type === "node" && m.role.startsWith("platform"));
  const miembros = rolesAnden.length ? rolesAnden : rel.members.filter((m) => m.type === "node" && m.role.startsWith("stop"));
  const paradas = [];
  let desde = 0;
  for (const m of miembros) {
    const p = nodos.get(m.ref); if (!p || !adentro(p)) continue;
    // el punto del recorrido más cercano, buscando hacia adelante (los recorridos que vuelven por la misma calle)
    let mejor = -1, dmin = Infinity;
    for (let i = desde; i < forma.length; i++) {
      const d = dist(p, forma[i]);
      if (d < dmin) { dmin = d; mejor = i; }
      if (dmin < 40 && d > 400) break;
    }
    if (mejor < 0 || dmin > 250) continue;
    desde = mejor;
    const ant = paradas[paradas.length - 1];
    if (ant && Math.abs(ant[3] - acum[mejor]) < 30) continue; // parada repetida (andén y poste)
    paradas.push([r5(p[0]), r5(p[1]), nombres.get(m.ref) || "", Math.round(acum[mejor]), calleDe[mejor] || ""]);
  }
  if (paradas.length < 2) { descartadas++; continue; }

  // 3) Recorrido simplificado (para dibujarlo), con la distancia acumulada de cada punto
  const dentro = forma.map((p, i) => i).filter((i) => adentro(forma[i]));
  if (!dentro.length) { descartadas++; continue; }
  const sub = forma.slice(dentro[0], dentro[dentro.length - 1] + 1), subAc = acum.slice(dentro[0], dentro[dentro.length - 1] + 1);
  const quedan = simplificar(sub, 6);
  lineas.push({
    ref: t.ref || "?", nombre: (t.name || "").replace(/^Línea\s+/i, ""), desde: t.from || "", hasta: t.to || "",
    color: t.colour || null,
    forma: quedan.map((i) => [r5(sub[i][0]), r5(sub[i][1]), Math.round(subAc[i])]),
    paradas,
  });
}

lineas.sort((a, b) => a.ref.localeCompare(b.ref, "es", { numeric: true }));
const salida = { fuente: "OpenStreetMap (ODbL), relaciones route=bus", generado: new Date().toISOString().slice(0, 10), lineas };
fs.writeFileSync(new URL("../src/data/colectivos.json", import.meta.url), JSON.stringify(salida));
const kb = Math.round(fs.statSync(new URL("../src/data/colectivos.json", import.meta.url)).size / 1024);
console.log(`Listo: ${lineas.length} recorridos de ${new Set(lineas.map((l) => l.ref)).size} líneas, ${lineas.reduce((s, l) => s + l.paradas.length, 0)} paradas (${kb} KB). Descartados: ${descartadas}.`);
