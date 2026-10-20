// ---- "Cómo llego": rutas en silla de ruedas, a pie, en bici y en auto (OpenRouteService) ----
// Sanitizamos la clave: dejamos solo ASCII imprimible (saca BOM/espacios invisibles que rompen
// el header de fetch con "String contains non ISO-8859-1 code point").
const ORS_KEY = (import.meta.env.VITE_ORS_API_KEY || "").replace(/[^\x21-\x7E]/g, "");
export const ROUTING_ON = Boolean(ORS_KEY);

// Medios de transporte. `perfil` = cómo calcula OpenRouteService; `google` = el mismo medio en Google Maps.
// El colectivo no tiene perfil: los recorridos de las líneas de Rosario no están en datos abiertos, así que
// ese viaje lo arma Google Maps (líneas, paradas y horarios).
export const MODOS = [
  { id: "silla", nombre: "Silla de ruedas", corto: "Silla", perfil: "wheelchair", google: "walking", color: "#1D4F94" },
  { id: "pie", nombre: "A pie", corto: "A pie", perfil: "foot-walking", google: "walking", color: "#007DAE", punteado: true },
  { id: "bici", nombre: "En bici", corto: "Bici", perfil: "cycling-regular", google: "bicycling", color: "#0B8043" },
  { id: "auto", nombre: "En auto", corto: "Auto", perfil: "driving-car", google: "driving", color: "#33A0FF" },
  { id: "colectivo", nombre: "En colectivo", corto: "Colectivo", perfil: null, google: "transit", color: "#06153D" },
];

// Pide una ruta entre dos puntos [lng,lat] para un perfil. Devuelve { coords:[[lat,lng]], distance, duration, pasos }.
export async function fetchRoute(start, end, perfil = "wheelchair") {
  if (!ORS_KEY) throw new Error("El ruteo todavía no está configurado.");
  const res = await fetch(`https://api.openrouteservice.org/v2/directions/${perfil}/geojson`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: ORS_KEY },
    body: JSON.stringify({ coordinates: [start, end], language: "es", instructions: true, units: "m" }),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("No hay un camino posible para este medio.");
    if (res.status === 403 || res.status === 401) throw new Error("La clave de ruteo no es válida.");
    if (res.status === 429) throw new Error("Demasiadas consultas: probá de nuevo en un minuto.");
    throw new Error("No se pudo calcular la ruta.");
  }
  const data = await res.json();
  const f = data.features && data.features[0];
  if (!f) throw new Error("No se encontró una ruta.");
  const coords = f.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const sum = f.properties.summary || {};
  const pasos = (f.properties.segments || []).flatMap((s) => s.steps || [])
    .map((p) => ({ texto: p.instruction, distancia: p.distance || 0, tipo: p.type }))
    .filter((p) => p.texto);
  return { coords, distance: sum.distance || 0, duration: sum.duration || 0, pasos };
}

// Enlace oficial y gratuito de Google Maps con el mismo viaje (sirve para colectivo y para seguirlo con GPS).
export function enlaceGoogle(origen, destino, modo) {
  const m = MODOS.find((x) => x.id === modo) || MODOS[0];
  const p = new URLSearchParams({ api: "1", destination: `${destino.lat},${destino.lng}`, travelmode: m.google });
  if (origen) p.set("origin", `${origen[0]},${origen[1]}`);
  return "https://www.google.com/maps/dir/?" + p.toString();
}

export const fmtMin = (seg) => {
  const m = Math.max(1, Math.round(seg / 60));
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? " " + (m % 60) + " min" : ""}`;
};
export const fmtKm = (m) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);
