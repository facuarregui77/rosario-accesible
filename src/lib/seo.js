// Posicionamiento en Google y medición de campañas.
import { CRITERIA, TYPE_LABELS, WHEELCHAIR_LABELS } from "../data/constants.js";

export const SITE_URL = "https://access-app-rosario.vercel.app";
const HOME_TITLE = "Rosario Accesible — Mapa de accesibilidad de Rosario";
const HOME_DESC = "Mapa colaborativo de accesibilidad de Rosario: encontrá rampas, baños accesibles, comercios y lugares con accesibilidad para personas con movilidad reducida. Sumá y consultá reseñas.";

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    const m = selector.match(/\[(\w+(?::\w+)?)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

// Dirección propia de cada lugar. scripts/generar-paginas-lugares.mjs arma una página ya escrita para cada una
// (así Google lee el lugar sin esperar a la app); los enlaces viejos …/?lugar=<id> siguen andando.
export const placePath = (place) => `/lugar/${encodeURIComponent(place.id)}`;

// Título y descripción de la ficha de un lugar (los usa la app y también el script de páginas por lugar).
export function placeMeta(place) {
  const acceso = place.wheelchair ? WHEELCHAIR_LABELS[place.wheelchair] : "todavía sin datos de acceso en silla de ruedas";
  const tiene = CRITERIA.filter((c) => place.a && place.a[c.key] === "si").map((c) => c.label.toLowerCase());
  return {
    title: `${place.name}: accesibilidad | Rosario Access Map`,
    desc: `${place.name} (${(TYPE_LABELS[place.type] || "lugar").toLowerCase()}, Rosario): ${acceso.charAt(0).toLowerCase() + acceso.slice(1)}` +
      (tiene.length ? `. Tiene ${tiene.join(", ")}` : "") +
      ". Mirá su accesibilidad y cómo llegar en el mapa colaborativo de Rosario.",
    url: SITE_URL + placePath(place),
  };
}

// Título, descripción y dirección "oficial" (canonical) de la página: los de la portada o los del lugar abierto.
export function updateHead(place) {
  let title = HOME_TITLE, desc = HOME_DESC, url = SITE_URL + "/";
  if (place) ({ title, desc, url } = placeMeta(place));
  document.title = title;
  setMeta('meta[name="description"]', "content", desc);
  setMeta('link[rel="canonical"]', "href", url);
  setMeta('meta[property="og:url"]', "content", url);
  setMeta('meta[property="og:title"]', "content", title);
  setMeta('meta[property="og:description"]', "content", desc);
}

// Enlaces por canal: /ig, /fb, /wa, /li, /tt, /qr, /mail muestran la app normal, pero quedan registrados
// con esa dirección en Vercel Analytics (así se sabe de qué red llegó cada visita, sin pagar el plan de UTM).
// A los pocos segundos la dirección vuelve a "/" para que, si la persona comparte un lugar, no arrastre el canal.
export const CHANNEL_PATHS = ["/ig", "/fb", "/wa", "/li", "/tt", "/qr", "/mail"];
export function cleanChannelPath() {
  if (typeof window === "undefined" || !CHANNEL_PATHS.includes(window.location.pathname)) return;
  setTimeout(() => {
    try { window.history.replaceState(window.history.state, "", "/" + window.location.search + window.location.hash); } catch (e) { /* ignorar */ }
  }, 4000);
}
