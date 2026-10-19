// Pines del mapa al estilo Google Maps: gota del color del tipo de lugar con un dibujito blanco adentro
// y, en la esquina, un circulito con el semáforo de accesibilidad (verde, ámbar, rojo o gris).
import { TYPE_COLORS, accessColor } from "../data/constants";
import { TYPE_ICONS } from "../data/typeIcons";

const GOTA = "M16 1C7.7 1 1 7.6 1 15.8c0 10.6 13.3 22.4 14.3 23.3a1 1 0 0 0 1.4 0C17.7 38.2 31 26.4 31 15.8 31 7.6 24.3 1 16 1z";
export const PIN_W = 32, PIN_H = 40; // proporción del dibujo (el ancho real se elige al usarlo)

// Un tono más oscuro del mismo color (para el borde del pin y el nombre, como en Google Maps)
export function oscuro(hex, f = 0.72) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.round(v * f).toString(16).padStart(2, "0");
  return "#" + c((n >> 16) & 255) + c((n >> 8) & 255) + c(n & 255);
}

// SVG del pin. `seleccionado`: más grande, con borde casi negro (el lugar abierto).
export function pinSvg(type, wheelchair, ancho, seleccionado = false, sombra = true) {
  const color = TYPE_COLORS[type] || "#5F6368";
  const icono = TYPE_ICONS[type] || "";
  const alto = Math.round((ancho * PIN_H) / PIN_W);
  const borde = seleccionado ? "#202124" : oscuro(color);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="-1 -1 34 42" aria-hidden="true">` +
    (sombra ? `<ellipse cx="16" cy="39.4" rx="4.5" ry="1.4" fill="rgba(0,0,0,.3)"/>` : "") +
    `<path d="${GOTA}" fill="${color}" stroke="${borde}" stroke-width="${seleccionado ? 2.6 : 1.4}"/>` +
    `<g transform="translate(8.8 8.6) scale(0.6)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${icono}</g>` +
    (wheelchair === "__sin__" ? "" : `<circle cx="26.5" cy="5.5" r="5.2" fill="${accessColor(wheelchair)}" stroke="#ffffff" stroke-width="1.8"/>`) +
    `</svg>`;
}

// Nombre al costado del pin (aparece al acercar el mapa, como en Google Maps)
export const ESTILO_NOMBRE = "font:600 12px/1.15 'Plus Jakarta Sans',system-ui,sans-serif;text-shadow:0 0 2px #fff,0 0 2px #fff,0 0 3px #fff,0 0 4px #fff;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis;pointer-events:none;";

// Imágenes ya armadas para dibujar en el canvas del mapa (pines livianos de las empresas importadas)
const cache = new Map();
export function pinImage(type, wheelchair, ancho, onLoad) {
  const k = `${type}|${wheelchair}|${ancho}`;
  let img = cache.get(k);
  if (!img) {
    img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(pinSvg(type, wheelchair, ancho * 2, false, true));
    cache.set(k, img);
  }
  if (!img.complete && onLoad) img.addEventListener("load", onLoad, { once: true });
  return img;
}
