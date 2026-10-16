// Pines del mapa al estilo Google Maps: gota del color del tipo de lugar con un dibujito blanco adentro
// y, en la esquina, un circulito con el semáforo de accesibilidad (verde, ámbar, rojo o gris).
import { TYPE_COLORS, accessColor } from "../data/constants";
import { TYPE_ICONS } from "../data/typeIcons";

const GOTA = "M16 1C7.7 1 1 7.6 1 15.8c0 10.6 13.3 22.4 14.3 23.3a1 1 0 0 0 1.4 0C17.7 38.2 31 26.4 31 15.8 31 7.6 24.3 1 16 1z";
export const PIN_W = 32, PIN_H = 40; // proporción del dibujo (el ancho real se elige al usarlo)

// SVG del pin. `seleccionado`: borde oscuro (el lugar abierto).
export function pinSvg(type, wheelchair, ancho, seleccionado = false, sombra = true) {
  const color = TYPE_COLORS[type] || "#64748b";
  const icono = TYPE_ICONS[type] || "";
  const alto = Math.round((ancho * PIN_H) / PIN_W);
  const borde = seleccionado ? "#0f172a" : "#ffffff";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="-1 -1 34 42" aria-hidden="true">` +
    (sombra ? `<ellipse cx="16" cy="39.3" rx="5" ry="1.6" fill="rgba(0,0,0,.28)"/>` : "") +
    `<path d="${GOTA}" fill="${color}" stroke="${borde}" stroke-width="${seleccionado ? 2.4 : 1.6}"/>` +
    `<g transform="translate(8.8 8.6) scale(0.6)" fill="none" stroke="#ffffff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${icono}</g>` +
    (wheelchair === "__sin__" ? "" : `<circle cx="26.5" cy="5.5" r="5.2" fill="${accessColor(wheelchair)}" stroke="#ffffff" stroke-width="1.8"/>`) +
    `</svg>`;
}

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
