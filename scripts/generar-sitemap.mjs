// Genera public/sitemap.xml con la portada y una dirección por cada lugar (…/?lugar=<id>),
// para que Google pueda mostrar cada lugar en sus resultados. Corre solo antes de cada publicación (npm run build).
import fs from "node:fs";
import { PLACES } from "../src/data/places.js";

const SITE = "https://access-app-rosario.vercel.app";
const hoy = new Date().toISOString().slice(0, 10);
const url = (loc, prio, freq) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[url(SITE + "/", "1.0", "weekly"), ...PLACES.map((p) => url(`${SITE}/?lugar=${encodeURIComponent(p.id)}`, "0.7", "monthly"))].join("\n")}
</urlset>
`;
fs.writeFileSync(new URL("../public/sitemap.xml", import.meta.url), xml, "utf8");
console.log(`sitemap.xml: ${PLACES.length + 1} direcciones`);
