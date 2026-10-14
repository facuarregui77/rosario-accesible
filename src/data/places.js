// Todos los lugares del mapa:
//   - los relevados y cargados a mano (places-base.js);
//   - empresas, comercios y servicios con dato real de acceso tomados de OpenStreetMap
//     (empresas-osm.js, lo genera scripts/importar-empresas-osm.mjs). Llevan `osm: true`.
import { PLACES as BASE } from "./places-base.js";
import { EMPRESAS_OSM } from "./empresas-osm.js";

const SIN_DATOS = { bano: null, rampa: null, ascensor: null, braille: null, senas: null };

export const PLACES_BASE = BASE;
export const PLACES = [
  ...BASE,
  ...EMPRESAS_OSM.map(({ bano, c, f, ...p }) => ({ ...p, a: { ...SIN_DATOS, bano: bano || null }, contacto: c || null, osm: true })),
];
