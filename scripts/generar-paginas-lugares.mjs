// Arma una página ya escrita para cada lugar (dist/lugar/<id>/index.html) con su nombre, accesibilidad y dirección
// a la vista. Google la lee sin tener que esperar a que cargue la app, y eso ayuda a que muestre cada lugar en sus
// resultados. Al abrirla, la app arranca igual que siempre con la ficha del lugar abierta.
// Corre solo después de cada publicación (npm run build), sobre lo que dejó Vite en dist/.
import fs from "node:fs";
import { PLACES } from "../src/data/places.js";
import { CRITERIA, TYPE_LABELS, WHEELCHAIR_LABELS } from "../src/data/constants.js";
import { SITE_URL, placeMeta, placePath } from "../src/lib/seo.js";

const CONTACTOS = JSON.parse(fs.readFileSync(new URL("../src/contactos.json", import.meta.url), "utf8"));
const dist = new URL("../dist/", import.meta.url);
const plantilla = fs.readFileSync(new URL("index.html", dist), "utf8");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ESTADO = { si: "sí", no: "no", null: "sin datos todavía" };

// Cambia el atributo content de la etiqueta meta que tenga ese name/property.
const meta = (html, key, value) =>
  html.replace(new RegExp(`(<meta (?:name|property)="${key}" content=")[^"]*(")`), `$1${esc(value)}$2`);

for (const p of PLACES) {
  const { title, desc, url } = placeMeta(p);
  const contacto = p.contacto || CONTACTOS[p.id] || {};
  const tipo = TYPE_LABELS[p.type] || "Lugar";

  const datos = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: p.name,
    url,
    description: desc,
    geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng },
    address: { "@type": "PostalAddress", ...(contacto.direccion && { streetAddress: contacto.direccion }), addressLocality: "Rosario", addressRegion: "Santa Fe", addressCountry: "AR" },
    ...(p.wheelchair && { amenityFeature: [{ "@type": "LocationFeatureSpecification", name: "Acceso en silla de ruedas", value: p.wheelchair !== "no" }] }),
  };

  const cuerpo = `<div id="root">
      <main style="font-family:sans-serif;max-width:640px;margin:0 auto;padding:16px">
        <h1>${esc(p.name)}: accesibilidad</h1>
        <p>${esc(tipo)} en Rosario${contacto.direccion ? ` · ${esc(contacto.direccion)}` : ""}</p>
        <p>${esc(p.wheelchair ? WHEELCHAIR_LABELS[p.wheelchair] : "Todavía sin datos de acceso en silla de ruedas")}.</p>
        <ul>${CRITERIA.map((c) => `<li>${esc(c.label)}: ${ESTADO[p.a?.[c.key] ?? null]}</li>`).join("")}</ul>
        <p><a href="${esc(placePath(p))}">Ver ${esc(p.name)} en el mapa accesible de Rosario</a> · <a href="/">Rosario Accesible</a></p>
      </main>
    </div>`;

  let html = plantilla.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  html = meta(html, "description", desc);
  html = meta(html, "og:title", title);
  html = meta(html, "og:description", desc);
  html = meta(html, "og:url", url);
  html = meta(html, "twitter:title", title);
  html = meta(html, "twitter:description", desc);
  html = html.replace("</head>", `  <link rel="canonical" href="${esc(url)}" />\n    <script type="application/ld+json">${JSON.stringify(datos).replace(/</g, "\\u003c")}</script>\n  </head>`);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/, cuerpo);

  const carpeta = new URL(`lugar/${encodeURIComponent(p.id)}/`, dist);
  fs.mkdirSync(carpeta, { recursive: true });
  fs.writeFileSync(new URL("index.html", carpeta), html, "utf8");
}
console.log(`páginas por lugar: ${PLACES.length} (en ${SITE_URL}/lugar/…)`);
