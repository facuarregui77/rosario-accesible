// Reverse-geocoding (coordenadas → dirección aproximada) con OpenStreetMap/Nominatim. Gratis, sin clave.
// Cachea resultados para no repetir consultas al tocar la misma rampa.
const geoCache = new Map();
export const escapeH = (s) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export async function reverseGeocode(lat, lng) {
  const key = lat.toFixed(5) + "," + lng.toFixed(5);
  if (geoCache.has(key)) return geoCache.get(key);
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=es`);
    const d = await res.json();
    const a = d.address || {};
    const parts = [];
    const street = a.road || a.pedestrian || a.footway || a.path || a.cycleway;
    if (street) parts.push(street + (a.house_number ? " " + a.house_number : ""));
    const area = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.residential;
    if (area) parts.push(area);
    const text = parts.join(" · ") || d.display_name || "Dirección no disponible";
    geoCache.set(key, text);
    return text;
  } catch (e) { return "No se pudo obtener la dirección."; }
}

// Distancia en metros entre dos puntos (fórmula de Haversine)
export const distanceM = (a, b) => {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
export const fmtDist = (d) => (d == null ? "" : d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`);
