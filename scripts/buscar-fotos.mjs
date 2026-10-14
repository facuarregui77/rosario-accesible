// Busca fotos de uso libre de cada lugar en Wikimedia Commons (el banco de fotos de Wikipedia)
// y las guarda en src/fotos.json con su autor y licencia, para mostrarlas en la ficha.
//
// Cómo encuentra el lugar correcto (para no mostrar fotos equivocadas):
//   1. Si el lugar viene de OpenStreetMap, mira si ahí está enlazado a Wikidata.
//   2. Si no, busca el nombre en Wikidata y acepta el resultado solo si sus coordenadas
//      quedan a menos de 400 m del lugar en el mapa.
// De la entrada de Wikidata toma la foto principal y algunas de su categoría en Commons.
//
// Uso: node scripts/buscar-fotos.mjs        (tarda unos minutos; después revisar las fotos)
import fs from "node:fs";
import { PLACES } from "../src/data/places-base.js"; // solo los lugares relevados a mano

const UA = { "User-Agent": "rosario-accesible/1.0 (https://github.com/facuarregui77/rosario-accesible)" };
const OUT = new URL("../src/fotos.json", import.meta.url);
const MAX_FOTOS = 4;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) return await r.json();
    } catch (e) { /* reintenta */ }
    await espera(1500);
  }
  return null;
}

const distM = (a, b) => {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const s = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// Nombre para buscar: sin prefijos como "UNR · " y sin aclaraciones entre paréntesis
const nombresDe = (p) => {
  const base = p.name.replace(/\(.*?\)/g, "").trim();
  const sinPrefijo = base.includes("·") ? base.split("·").pop().trim() : base;
  return [...new Set([base, sinPrefijo, base.replace(/·/g, " ").replace(/\s+/g, " ")])];
};

async function wikidataDeOSM(p) {
  if (!p.src) return null;
  const m = p.src.match(/openstreetmap\.org\/(node|way|relation)\/(\d+)/);
  if (!m) return null;
  const d = await json(`https://api.openstreetmap.org/api/0.6/${m[1]}/${m[2]}.json`);
  const tags = d && d.elements && d.elements[0] && d.elements[0].tags;
  return (tags && tags.wikidata) || null;
}

async function entidades(ids) {
  const d = await json(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=claims|labels&languages=es&format=json`);
  return (d && d.entities) || {};
}

const claim = (e, prop) => {
  const c = e.claims && e.claims[prop] && e.claims[prop][0];
  return c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value;
};

async function wikidataPorNombre(p) {
  for (const nombre of nombresDe(p)) {
    for (const q of [`${nombre} Rosario`, nombre]) {
      const d = await json(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=es&uselang=es&type=item&limit=7&format=json`);
      const ids = ((d && d.search) || []).map((x) => x.id);
      if (!ids.length) continue;
      const ents = await entidades(ids);
      for (const id of ids) {
        const c = claim(ents[id] || {}, "P625");
        if (c && distM(p, { lat: c.latitude, lng: c.longitude }) < 400) return id;
      }
    }
  }
  return null;
}

// Fotos revisadas a mano que NO corresponden (eventos, objetos, recortes, grafitis…). Si aparece otra mala, sumarla acá.
const EXCLUIR = new Set(["Vitrina trofeos canob.jpg", "Estadio Cubierto \"Dr. Claudio. L. Newell\".jpg", "Extracto del libro 'Anales del Fútbol Rosarino' de Cipriano Roldán, 1959. 02.jpg", "Roberto Fontanarrosa escultura C.C.R.F detalle.jpg", "Consejo Municipal de Rosario.jpg", "Generación.jpg", "Graffiti anti-Bush Rosario 2.jpg", "Cristian Segura.jpg", "25 años del CCPE 3.jpg", "25 años del CCPE 4.jpg", "Plaza 25 de Mayo, Rosario.jpg"]);
const esFotoUtil = (f) => !EXCLUIR.has(f) && /\.(jpe?g|png|webp)$/i.test(f) && !/(logo|mapa|map|plano|escudo|coat|flag|bandera_de|firma|signature|diagram)/i.test(f);

async function archivosDeCategoria(cat) {
  const d = await json(`https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent("Category:" + cat)}&cmtype=file&cmlimit=25&format=json`);
  return ((d && d.query && d.query.categorymembers) || []).map((m) => m.title.replace(/^File:/, ""));
}

async function infoDeArchivos(nombres) {
  if (!nombres.length) return [];
  const titles = nombres.map((n) => "File:" + n).join("|");
  const d = await json(`https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=800&titles=${encodeURIComponent(titles)}&format=json`);
  const pages = Object.values((d && d.query && d.query.pages) || {});
  const limpiar = (s) => (s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return pages.filter((pg) => pg.imageinfo && pg.imageinfo[0]).map((pg) => {
    const ii = pg.imageinfo[0], md = ii.extmetadata || {};
    return {
      url: ii.thumburl || ii.url,
      ancho: ii.thumbwidth || ii.width, alto: ii.thumbheight || ii.height,
      autor: (limpiar(md.Artist && md.Artist.value).replace(/^.*No machine-readable author provided\.\s*(.+?)\s+assumed.*$/, "$1").replace(/^(User|Usuario):/, "").replace(/^(Unknown author)+$/, "").trim().slice(0, 80)) || "Autor desconocido",
      licencia: limpiar(md.LicenseShortName && md.LicenseShortName.value) || "Licencia libre",
      pagina: ii.descriptionurl,
      archivo: pg.title.replace(/^File:/, ""),
    };
  }).filter((x) => x.ancho >= 400 && x.alto >= 250);
}

// Lugares sin entrada en Wikidata con fotos elegidas a mano en Commons (sacadas al lado del lugar, revisadas)
const EXTRA = {"rockfellers": ["Hotel Esplendor Savoy Rosario.jpg", "Opensavoy2.jpg"], "casa_che": ["Casa Che Guevara Rosario Mapfre.jpg", "Edificio donde vivió el Che Guevara.jpg"]};

const resultado = {};
let conFoto = 0;
for (const p of PLACES) {
  if (EXTRA[p.id]) {
    const fotos = await infoDeArchivos(EXTRA[p.id]);
    if (fotos.length) { resultado[p.id] = { wikidata: null, fotos }; conFoto++; console.log(`  ${fotos.length}  ${p.name}  (elegidas a mano)`); }
    continue;
  }
  let qid = await wikidataDeOSM(p);
  if (!qid) qid = await wikidataPorNombre(p);
  if (!qid) { console.log("  —  " + p.name); continue; }
  const e = (await entidades([qid]))[qid] || {};
  const principal = claim(e, "P18");
  const cat = claim(e, "P373");
  let nombres = [];
  if (principal) nombres.push(principal);
  if (cat) nombres.push(...(await archivosDeCategoria(cat)));
  nombres = [...new Set(nombres)].filter(esFotoUtil).slice(0, 12);
  const fotos = (await infoDeArchivos(nombres)).slice(0, MAX_FOTOS);
  // la foto principal de Wikidata va primero
  fotos.sort((a, b) => (b.archivo === principal) - (a.archivo === principal));
  if (fotos.length) {
    resultado[p.id] = { wikidata: qid, fotos };
    conFoto++;
    console.log(`  ${fotos.length}  ${p.name}  (${qid})`);
  } else console.log(`  0  ${p.name}  (${qid}, sin fotos)`);
  await espera(300);
}
fs.writeFileSync(OUT, JSON.stringify(resultado, null, 1), "utf8");
console.log(`\nListo: ${conFoto} de ${PLACES.length} lugares con fotos. Archivo: src/fotos.json`);
