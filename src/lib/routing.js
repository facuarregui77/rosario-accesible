// ---- Ruteo accesible (OpenRouteService, perfil "wheelchair") ----
// Sanitizamos la clave: dejamos solo ASCII imprimible (saca BOM/espacios invisibles que rompen
// el header de fetch con "String contains non ISO-8859-1 code point").
const ORS_KEY = (import.meta.env.VITE_ORS_API_KEY || "").replace(/[^\x21-\x7E]/g, "");
export const ROUTING_ON = Boolean(ORS_KEY);

// Pide a ORS una ruta en silla de ruedas entre dos puntos [lng,lat]. Devuelve { coords:[[lat,lng]], distance, duration }.
export async function fetchRoute(start, end) {
  if (!ORS_KEY) throw new Error("El ruteo todavía no está configurado.");
  const res = await fetch("https://api.openrouteservice.org/v2/directions/wheelchair/geojson", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: ORS_KEY },
    body: JSON.stringify({ coordinates: [start, end] }),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error("No se encontró una ruta accesible para este tramo.");
    if (res.status === 403 || res.status === 401) throw new Error("La clave de ruteo no es válida.");
    throw new Error("No se pudo calcular la ruta (servicio de ruteo).");
  }
  const data = await res.json();
  const f = data.features && data.features[0];
  if (!f) throw new Error("No se encontró una ruta.");
  const coords = f.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const sum = f.properties.summary || {};
  return { coords, distance: sum.distance || 0, duration: sum.duration || 0 };
}
