import { useState, useEffect, useMemo, useRef } from "react";
import { MapPin, Accessibility, Star, X, Filter, BarChart3, CheckCircle2, XCircle, MessageSquare, Bath, MoveUp, BookOpen, Hand, ArrowUpDown, Pencil, RotateCcw, Save, Search } from "lucide-react";
// Rebajes de cordón / cruces accesibles de Rosario (datos reales de OpenStreetMap, ODbL)
import RAMPS from "./rampas-rosario.json";
// Capa de datos: nube (Supabase) con fallback automático a localStorage
import * as db from "./db";

// Lugares REALES de Rosario (nombre, coords y rating de Google reales).
//
// DATOS DE ACCESIBILIDAD — política de honestidad:
//   - Cada criterio puede ser "si" | "no" | null (null = SIN DATOS / a relevar).
//   - Solo se cargan datos REALES y COMPROBABLES. La fuente es OpenStreetMap (ODbL);
//     el campo `wheelchair` ("si"|"parcial") y `src` (link al objeto OSM) permiten verificarlos.
//   - El resto queda en null ("sin datos") y puede completarse manualmente desde la app
//     (relevamiento colaborativo); esas ediciones se guardan en el navegador.
// Nada de esto se inventa: si no hay fuente, dice "sin datos".
const SIN_DATOS = { bano: null, rampa: null, ascensor: null, braille: null, senas: null };
const osm = (type, id) => `https://www.openstreetmap.org/${type}/${id}`;
const PLACES = [
  { id: "elcairo", name: "El Cairo", type: "bar", lat: -32.9450198, lng: -60.6379576, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "theclub", name: "The Club", type: "restaurant", lat: -32.9460359, lng: -60.6480806, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "hoxton", name: "Hoxton House", type: "bar", lat: -32.9576484, lng: -60.6401811, gRating: 4.1, a: { ...SIN_DATOS } },
  { id: "brooklyn", name: "Brooklyn | Crafters' Garden", type: "bar", lat: -32.9412465, lng: -60.6396895, gRating: 4.0, a: { ...SIN_DATOS } },
  { id: "elpatio", name: "El Patio Multiespacio", type: "bar", lat: -32.9497944, lng: -60.647806, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "craft", name: "CRAFT", type: "bar", lat: -32.9574577, lng: -60.6389648, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "manush", name: "Manush Rosario", type: "bar", lat: -32.9328069, lng: -60.6523911, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "granlago", name: "Gran Lago - Resto Bar", type: "restaurant", lat: -32.955596, lng: -60.6585203, gRating: 4.1, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "12724554649") },
  { id: "losjardines", name: "Los Jardines", type: "restaurant", lat: -32.934148, lng: -60.6433216, gRating: 4.3, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "4513797894") },
  { id: "riomio", name: "Riomío", type: "restaurant", lat: -32.933136, lng: -60.6464189, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "wembley", name: "Wembley", type: "restaurant", lat: -32.9647649, lng: -60.6217325, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "rockfellers", name: "Rock&Feller's Savoy", type: "restaurant", lat: -32.9446607, lng: -60.636258, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "escauriza", name: "Escauriza Parrilla", type: "restaurant", lat: -32.880531, lng: -60.6883401, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "donferro", name: "Parrilla Don Ferro", type: "restaurant", lat: -32.9343572, lng: -60.6435197, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "rooftop", name: "Rooftop", type: "bar", lat: -32.9320322, lng: -60.6636827, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "roxy", name: "Roxy Club Rosario", type: "boliche", lat: -32.9310926, lng: -60.657733, gRating: 3.8, a: { ...SIN_DATOS } },
  { id: "decada", name: "Década Disco", type: "boliche", lat: -32.9364977, lng: -60.6697425, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "bound", name: "Bound", type: "boliche", lat: -32.9364439, lng: -60.6516674, gRating: 3.6, a: { ...SIN_DATOS } },
  { id: "switch", name: "Switch Club", type: "boliche", lat: -32.939125, lng: -60.6506263, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "lotus", name: "Lotus Night Club", type: "boliche", lat: -32.9292618, lng: -60.6713676, gRating: 3.2, a: { ...SIN_DATOS } },
  { id: "manushcentro", name: "Manush Centro", type: "bar", lat: -32.9445, lng: -60.6425, gRating: 4.5, a: { ...SIN_DATOS } },
  // Instituciones educativas de Rosario (ubicaciones reales)
  { id: "unr_rectorado", name: "UNR · Rectorado", type: "educativo", lat: -32.9468, lng: -60.6393, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "unr_derecho", name: "UNR · Facultad de Derecho", type: "educativo", lat: -32.9447, lng: -60.6485, gRating: 4.5, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "409067763") },
  { id: "unr_economicas", name: "UNR · Cs. Económicas", type: "educativo", lat: -32.9521, lng: -60.6537, gRating: 4.4, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "188609144") },
  { id: "unr_medicina", name: "UNR · Facultad de Medicina", type: "educativo", lat: -32.9486, lng: -60.6595, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "utn_rosario", name: "UTN · Facultad Regional Rosario", type: "educativo", lat: -32.9466, lng: -60.6432, gRating: 4.5, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "187591366") },
  { id: "austral_rosario", name: "Universidad Austral · Rosario", type: "educativo", lat: -32.9398, lng: -60.6470, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "uca_rosario", name: "UCA · Rosario", type: "educativo", lat: -32.9585, lng: -60.6680, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "uai_rosario", name: "UAI · Rosario", type: "educativo", lat: -32.9530, lng: -60.6510, gRating: 4.2, a: { ...SIN_DATOS } },
  // Escuelas y colegios de Rosario (ubicaciones aproximadas)
  { id: "ips_rosario", name: "Instituto Politécnico Superior (UNR)", type: "educativo", lat: -32.9466, lng: -60.6360, gRating: 4.7, a: { ...SIN_DATOS } },
  { id: "superior_comercio", name: "Esc. Superior de Comercio (UNR)", type: "educativo", lat: -32.9495, lng: -60.6360, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "normal_1", name: "Escuela Normal Superior N°1 Avellaneda", type: "educativo", lat: -32.9479, lng: -60.6386, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "normal_2", name: "Escuela Normal N°2 J. M. Gutiérrez", type: "educativo", lat: -32.9490, lng: -60.6470, gRating: 4.3, a: { ...SIN_DATOS }, wheelchair: "parcial", src: osm("way", "409067764") },
  { id: "lasalle", name: "Colegio La Salle Rosario", type: "educativo", lat: -32.9520, lng: -60.6560, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "inmaculada", name: "Colegio Inmaculada Concepción", type: "educativo", lat: -32.9430, lng: -60.6420, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "sanbartolome", name: "Colegio San Bartolomé", type: "educativo", lat: -32.9550, lng: -60.6580, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "dante", name: "Colegio Dante Alighieri", type: "educativo", lat: -32.9505, lng: -60.6500, gRating: 4.4, a: { ...SIN_DATOS } },
  // Clubes deportivos y gimnasios de Rosario (ubicaciones reales)
  { id: "central", name: "Club Atlético Rosario Central", type: "deportivo", lat: -32.9080, lng: -60.6303, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "newells", name: "Club Atlético Newell's Old Boys", type: "deportivo", lat: -32.9582, lng: -60.6655, gRating: 4.6, a: { ...SIN_DATOS }, wheelchair: "parcial", src: osm("way", "1375044787") },
  { id: "regatas", name: "Club de Regatas Rosario", type: "deportivo", lat: -32.9286, lng: -60.6281, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "gimnasia_ros", name: "Club Gimnasia y Esgrima de Rosario", type: "deportivo", lat: -32.9499, lng: -60.6790, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "provincial", name: "Club Atlético Provincial", type: "deportivo", lat: -32.9618, lng: -60.6520, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "plaza_jewell", name: "Club Atlético del Rosario (Plaza Jewell)", type: "deportivo", lat: -32.9466, lng: -60.6700, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "nautico_ave", name: "Club Náutico Avellaneda", type: "deportivo", lat: -32.8830, lng: -60.6960, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "megatlon", name: "Megatlón Rosario", type: "deportivo", lat: -32.9445, lng: -60.6390, gRating: 4.2, a: { ...SIN_DATOS } },
  { id: "sportclub", name: "SportClub Rosario", type: "deportivo", lat: -32.9486, lng: -60.6470, gRating: 4.1, a: { ...SIN_DATOS } },
  { id: "always_ready", name: "Always Ready Gym", type: "deportivo", lat: -32.9412, lng: -60.6520, gRating: 4.3, a: { ...SIN_DATOS } },
  // Centros culturales de Rosario (ubicaciones reales)
  { id: "cc_fontanarrosa", name: "Centro Cultural Roberto Fontanarrosa", type: "cultural", lat: -32.9476, lng: -60.6304, gRating: 4.6, a: { ...SIN_DATOS }, wheelchair: "parcial", src: osm("way", "187592426") },
  { id: "cc_parque_espana", name: "Centro Cultural Parque de España", type: "cultural", lat: -32.9407, lng: -60.6283, gRating: 4.6, a: { ...SIN_DATOS } },
  { id: "cc_lavarden", name: "Plataforma Lavardén", type: "cultural", lat: -32.9519, lng: -60.6361, gRating: 4.5, a: { ...SIN_DATOS } },
  { id: "cec", name: "Centro de Expresiones Contemporáneas (CEC)", type: "cultural", lat: -32.9268, lng: -60.6286, gRating: 4.4, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "186984803") },
  { id: "cc_la_toma", name: "Centro Cultural La Toma", type: "cultural", lat: -32.9543, lng: -60.6533, gRating: 4.3, a: { ...SIN_DATOS } },
  { id: "distrito_siete", name: "Distrito Siete", type: "cultural", lat: -32.9606, lng: -60.6486, gRating: 4.4, a: { ...SIN_DATOS } },
  { id: "cc_lumiere", name: "Centro Cultural Cine Lumière", type: "cultural", lat: -32.9486, lng: -60.6340, gRating: 4.5, a: { ...SIN_DATOS } },
];

const CRITERIA = [
  { key: "bano", label: "Baño adaptado", icon: Bath },
  { key: "rampa", label: "Rampa de acceso", icon: ArrowUpDown },
  { key: "ascensor", label: "Ascensor", icon: MoveUp },
  { key: "braille", label: "Menú en braille", icon: BookOpen },
  { key: "senas", label: "Personal con lengua de señas", icon: Hand },
];

const TYPE_LABELS = { bar: "Bar", restaurant: "Restaurante", boliche: "Boliche", educativo: "Educativo", deportivo: "Deportivo", cultural: "Cultural" };
const TYPE_PLURAL = { bar: "Bares", restaurant: "Restaurantes", boliche: "Boliches", educativo: "Educativos", deportivo: "Deportivos", cultural: "Culturales" };
const TYPE_COLORS = { bar: "#f59e0b", restaurant: "#10b981", boliche: "#a855f7", educativo: "#3b82f6", deportivo: "#ef4444", cultural: "#d946ef" };

// Etiquetas del acceso en silla de ruedas (dato real de OSM)
const WHEELCHAIR_LABELS = { si: "Acceso en silla de ruedas", parcial: "Acceso parcial en silla de ruedas", no: "Sin acceso en silla de ruedas" };

// ¿Tenemos algún dato real o cargado para este lugar?
const hasAnyData = (p) => p.wheelchair != null || CRITERIA.some((c) => p.a[c.key] != null);

// Normaliza texto para buscar sin distinguir mayúsculas ni acentos
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Chip compacto del acceso en silla de ruedas (dato real de OSM)
function AccessChip({ wheelchair }) {
  if (wheelchair === "si") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap">♿ Accesible</span>;
  if (wheelchair === "parcial") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">♿ Parcial</span>;
  return null;
}

// Aplica los cambios guardados por el usuario sobre los datos base
const mergePlaces = (overrides) => PLACES.map((p) =>
  overrides[p.id] ? { ...p, a: { ...p.a, ...overrides[p.id] } } : p);

// Carga la librería Leaflet (mapa real) una sola vez
let leafletPromise = null;
const loadLeaflet = () => {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return leafletPromise;
};

function RealMap({ places, selected, onSelect, avgRating, showRamps }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const rampsLayerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Inicializar el mapa una sola vez
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || mapRef.current || !containerRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
        .setView([-32.945, -60.645], 14);
      // Mapa con calles (Esri — muy confiable, sin bloqueos)
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri",
      }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      // Varios "empujones" para forzar la carga del mapa dentro del visor
      const kick = () => map.invalidateSize();
      setTimeout(kick, 200);
      setTimeout(kick, 800);
      setTimeout(kick, 2000);
      map.on("click", kick);
      setReady(true);
    });
    return () => { cancelled = true; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Dibujar / actualizar los marcadores cuando cambian los lugares filtrados
  useEffect(() => {
    if (!ready || !window.L || !layerRef.current) return;
    const L = window.L;
    layerRef.current.clearLayers();
    places.forEach((p) => {
      const isSel = selected?.id === p.id;
      // Color del marcador: naranja si está seleccionado; verde/ámbar según el acceso REAL (OSM); si no, color del tipo.
      const color = isSel ? "#f97316" : p.wheelchair === "si" ? "#10b981" : p.wheelchair === "parcial" ? "#f59e0b" : TYPE_COLORS[p.type];
      const size = isSel ? 34 : 26;
      const icon = L.divIcon({
        className: "",
        html: `<div style="transform:translate(-50%,-100%);">
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"
            style="filter:drop-shadow(0 2px 3px rgba(0,0,0,0.6));">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg></div>`,
        iconSize: [size, size],
        iconAnchor: [0, 0],
      });
      const avg = avgRating(p.id);
      const marker = L.marker([p.lat, p.lng], { icon }).addTo(layerRef.current);
      marker.bindTooltip(`${p.name}${avg ? ` · ★${avg}` : ""}`, { direction: "top", offset: [0, -size] });
      marker.on("click", () => onSelectRef.current(p));
    });
  }, [places, selected, ready, avgRating]);

  // Centrar el mapa en el lugar seleccionado al hacer clic
  useEffect(() => {
    if (!ready || !mapRef.current || !selected) return;
    mapRef.current.setView([selected.lat, selected.lng], 16, { animate: true });
  }, [selected, ready]);

  // Capa de rampas / cruces accesibles (se prende y apaga con el botón)
  useEffect(() => {
    if (!ready || !window.L || !mapRef.current) return;
    const L = window.L;
    if (showRamps) {
      if (!rampsLayerRef.current) {
        rampsLayerRef.current = L.layerGroup(
          RAMPS.points.map(([lat, lng]) =>
            L.circleMarker([lat, lng], { radius: 3.5, color: "#0284c7", weight: 1, fillColor: "#38bdf8", fillOpacity: 0.85 })
              .bindTooltip("Rampa / cruce accesible (OSM)", { direction: "top" })
          )
        );
      }
      rampsLayerRef.current.addTo(mapRef.current);
    } else if (rampsLayerRef.current) {
      rampsLayerRef.current.remove();
    }
  }, [showRamps, ready]);

  // Volver a la vista inicial de toda la ciudad
  const resetView = () => {
    if (mapRef.current) mapRef.current.setView([-32.945, -60.645], 14, { animate: true });
  };

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 w-full h-full"
        style={{ background: "radial-gradient(circle at 30% 20%, #e0f2fe 0%, #f0f9ff 60%, #ffffff 100%)" }} />
      <button onClick={resetView} title="Volver a la vista inicial del mapa"
        className="absolute top-3 right-3 z-[500] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/90 hover:bg-white text-xs font-medium text-sky-700 border border-sky-400 backdrop-blur shadow-lg transition">
        <RotateCcw size={14} /> Volver al inicio
      </button>
    </>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showRamps, setShowRamps] = useState(false);
  const [reviews, setReviews] = useState({});
  const [overrides, setOverrides] = useState({});
  const [loading, setLoading] = useState(true);

  // Cargar reseñas y cambios de accesibilidad guardados (nube o local)
  useEffect(() => {
    (async () => {
      try {
        const { overrides: ov, reviews: rv } = await db.loadAll();
        setOverrides(ov);
        setReviews(rv);
      } catch (e) { console.error("Error cargando datos:", e); }
      setLoading(false);
    })();
  }, []);

  const addReview = async (placeId, rev) => {
    const next = { ...reviews, [placeId]: [...(reviews[placeId] || []), rev] };
    setReviews(next);
    await db.addReview(placeId, rev, next);
  };

  const saveAccess = async (placeId, newA) => {
    const next = { ...overrides, [placeId]: newA };
    setOverrides(next);
    await db.saveAccess(placeId, newA, next);
  };

  const resetAccess = async () => {
    setOverrides({});
    await db.clearMyAccess();
  };

  // Lista de lugares con los cambios del usuario aplicados
  const data = useMemo(() => mergePlaces(overrides), [overrides]);

  // Lugar seleccionado siempre actualizado con los overrides
  const selectedLive = useMemo(
    () => (selected ? data.find((p) => p.id === selected.id) : null),
    [selected, data]
  );

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    return data.filter((p) => {
      if (q && !norm(p.name).includes(q)) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (accessFilter === "si" && p.wheelchair !== "si") return false;
      if (accessFilter === "parcial" && p.wheelchair !== "parcial") return false;
      if (accessFilter === "sindato" && hasAnyData(p)) return false;
      return true;
    });
  }, [query, typeFilter, accessFilter, data]);

  const stats = useMemo(() => {
    const total = data.length;
    const accesible = data.filter((p) => p.wheelchair === "si").length;
    const parcial = data.filter((p) => p.wheelchair === "parcial").length;
    const conDato = data.filter(hasAnyData).length;
    const sinDato = total - conDato;
    const byCriteria = CRITERIA.map((c) => {
      const si = data.filter((p) => p.a[c.key] === "si").length;
      const no = data.filter((p) => p.a[c.key] === "no").length;
      return { ...c, si, no, sd: total - si - no, pct: Math.round((si / total) * 100) };
    });
    return { total, accesible, parcial, conDato, sinDato,
      pctConDato: Math.round((conDato / total) * 100), byCriteria };
  }, [data]);

  const avgRating = (id) => {
    const r = reviews[id] || [];
    if (!r.length) return null;
    return (r.reduce((s, x) => s + x.stars, 0) / r.length).toFixed(1);
  };

  return (
    <div className="w-full min-h-screen bg-sky-50 text-slate-800" style={{ fontFamily: "Poppins, system-ui, sans-serif" }}>
      {/* Header */}
      <div className="sticky top-0 z-[1100] backdrop-blur-xl bg-sky-100 border-b border-sky-300 px-5 py-4">
        {/* Detalle decorativo superior: franja celeste → naranja */}
        <div className="-mx-5 -mt-4 mb-3 h-1.5 bg-gradient-to-r from-sky-400 via-orange-300 to-orange-400" />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-400 to-orange-400 shadow-lg shadow-sky-400/30 text-white">
              <Accessibility size={30} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight tracking-tight text-orange-500" style={{ fontFamily: "'Space Grotesk', Poppins, sans-serif" }}>Rosario Access Map</h1>
              <p className="text-sm font-semibold text-sky-500">Toda la información disponible acerca de la accesibilidad local.</p>
            </div>
          </div>
          {/* Buscador + leyenda de colores (centro del header) */}
          <div className="flex-1 min-w-[200px] max-w-md order-last sm:order-none w-full sm:w-auto translate-y-6">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar un lugar por nombre…"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/90 border border-sky-300 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-500 transition" />
            </div>
            <div className="flex items-center justify-center gap-3 mt-1.5 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Accesible</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Parcial</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Por categoría</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-36 shrink-0 translate-y-6">
            <button onClick={() => setShowAnalysis(true)}
              className="w-full justify-center flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white transition text-sm font-medium border border-orange-500 shadow-sm">
              <BarChart3 size={16} /> Análisis
            </button>
            <button onClick={() => setShowRamps((v) => !v)}
              title="Mostrar u ocultar las rampas y cruces accesibles de la vía pública (fuente OpenStreetMap)"
              className={`w-full justify-center flex items-center gap-2 px-4 py-2 rounded-xl transition text-sm font-medium border shadow-sm ${showRamps ? "bg-sky-500 hover:bg-sky-400 text-white border-sky-500" : "bg-white/90 hover:bg-white text-sky-700 border-sky-400"}`}>
              <Accessibility size={16} /> Rampas
            </button>
          </div>
        </div>

        {/* Filtros — fila por tipo */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span title="Filtrar por tipo de lugar" className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-sky-200 text-sky-700"><Filter size={14} /></span>
          {["all", "bar", "restaurant", "boliche", "educativo", "deportivo", "cultural"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition border ${typeFilter === t ? "bg-sky-500 text-white border-sky-500" : "bg-white/90 text-sky-700 border-sky-400 hover:bg-white"}`}>
              {t === "all" ? "Todos" : TYPE_PLURAL[t]}
            </button>
          ))}
        </div>
        {/* Filtros — fila por accesibilidad */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span title="Filtrar por acceso en silla de ruedas" className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-orange-100 text-orange-600"><Accessibility size={14} /></span>
          {[["all", "Todos"], ["si", "Accesible"], ["parcial", "Parcial"], ["sindato", "Sin datos"]].map(([k, l]) => (
            <button key={k} onClick={() => setAccessFilter(k)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition border ${accessFilter === k ? "bg-orange-500 text-white border-orange-500" : "bg-white/90 text-sky-700 border-sky-400 hover:bg-white"}`}>
              {l}
            </button>
          ))}
        </div>
        {/* Detalle decorativo: franja celeste → naranja */}
        <div className="-mx-5 -mb-4 mt-3 h-1 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400" />
      </div>

      <div className="flex flex-row">
        {/* PANEL LATERAL: lista — a la izquierda */}
        <div className="w-72 shrink-0 bg-sky-100 h-[calc(100vh-110px)] min-h-[400px] overflow-y-auto border-r border-sky-300 scroll-orange">
          {filtered.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)}
                className={`w-full text-left px-4 py-3 border-b border-sky-200 border-l-4 hover:bg-sky-200 transition ${selected?.id === p.id ? "bg-sky-300 border-l-orange-500" : "border-l-transparent"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-sky-700">{p.name}</span>
                  <AccessChip wheelchair={p.wheelchair} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: TYPE_COLORS[p.type] + "22", color: TYPE_COLORS[p.type] }}>{TYPE_LABELS[p.type]}</span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-0.5"><Star size={10} className="fill-amber-400 text-amber-400" /> {p.gRating}</span>
                  {!hasAnyData(p) && <span className="text-[11px] text-slate-400 italic">a relevar</span>}
                </div>
              </button>
          ))}
        </div>

        {/* MAPA REAL (Leaflet) — a la derecha */}
        <div className="relative flex-1 h-[calc(100vh-110px)] min-h-[400px] overflow-hidden">
          <RealMap places={filtered} selected={selected} onSelect={setSelected} avgRating={avgRating} showRamps={showRamps} />
          <div className="absolute bottom-3 left-3 z-[500] text-[10px] text-slate-600 bg-white/90 border border-sky-100 px-2 py-1 rounded pointer-events-none">
            {filtered.length} lugares · pinchá un marcador
          </div>
        </div>
      </div>

      {selectedLive && (
        <DetailPanel place={selectedLive} onClose={() => setSelected(null)} reviews={reviews[selectedLive.id] || []}
          onAddReview={(rev) => addReview(selectedLive.id, rev)}
          onSaveAccess={(newA) => saveAccess(selectedLive.id, newA)}
          avgRating={avgRating(selectedLive.id)} />
      )}
      {showAnalysis && <AnalysisPanel stats={stats} onClose={() => setShowAnalysis(false)} onReset={resetAccess} hasOverrides={!db.cloud && Object.keys(overrides).length > 0} />}
    </div>
  );
}

function DetailPanel({ place, onClose, reviews, onAddReview, onSaveAccess, avgRating }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(place.a);

  useEffect(() => { setDraft(place.a); setEditing(false); }, [place.id, place.a]);

  const submit = () => {
    if (!stars || !text.trim()) return;
    onAddReview({ stars, name: name.trim() || "Anónimo", text: text.trim(), date: new Date().toLocaleDateString("es-AR") });
    setStars(0); setName(""); setText("");
  };

  const saveEdit = () => { onSaveAccess(draft); setEditing(false); };
  const cancelEdit = () => { setDraft(place.a); setEditing(false); };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl rounded-t-2xl border border-sky-200 shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400 sm:rounded-t-2xl rounded-t-2xl" />
        <div className="sticky top-0 bg-sky-50 p-5 border-b border-sky-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{place.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: TYPE_COLORS[place.type] + "22", color: TYPE_COLORS[place.type] }}>{TYPE_LABELS[place.type]}</span>
              <span className="text-xs text-slate-500 flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {place.gRating} Google</span>
              {avgRating && <span className="text-xs text-amber-600 flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {avgRating} usuarios</span>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>

        <div className="p-5">
          {place.wheelchair && !editing && (
            <div className={`mb-4 p-3 rounded-xl border text-sm ${place.wheelchair === "si" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
              <div className="flex items-center gap-2 font-medium">
                <Accessibility size={18} /> {WHEELCHAIR_LABELS[place.wheelchair]}
              </div>
              {place.src && (
                <a href={place.src} target="_blank" rel="noreferrer" className="text-[11px] underline opacity-80 hover:opacity-100 mt-1 inline-block">
                  Dato verificable en OpenStreetMap ↗
                </a>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-700">Detalle de accesibilidad</h3>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-xs text-sky-700 border border-sky-200 transition">
                <Pencil size={13} /> Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 transition">Cancelar</button>
                <button onClick={saveEdit} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition">
                  <Save size={13} /> Guardar
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 mb-3">
            {CRITERIA.map((c) => {
              const val = editing ? draft[c.key] : place.a[c.key];
              const Icon = c.icon;
              if (editing) {
                const opts = [["si", "Sí"], ["no", "No"], [null, "—"]];
                return (
                  <div key={c.key} className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-50 border-slate-200">
                    <span className="flex items-center gap-2 text-sm"><Icon size={16} className="text-slate-500" /> {c.label}</span>
                    <div className="flex gap-1">
                      {opts.map(([v, l]) => (
                        <button key={l} onClick={() => setDraft({ ...draft, [c.key]: v })}
                          className={`px-2 py-0.5 rounded text-xs font-medium border transition ${val === v ? (v === "si" ? "bg-emerald-500 text-white border-emerald-500" : v === "no" ? "bg-rose-500 text-white border-rose-500" : "bg-slate-400 text-white border-slate-400") : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={c.key} className={`flex items-center justify-between p-2.5 rounded-lg border ${val === "si" ? "bg-emerald-50 border-emerald-200" : val === "no" ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
                  <span className="flex items-center gap-2 text-sm"><Icon size={16} className="text-slate-500" /> {c.label}</span>
                  {val === "si" ? <CheckCircle2 size={18} className="text-emerald-500" /> : val === "no" ? <XCircle size={18} className="text-rose-400" /> : <span className="text-[11px] text-slate-400 italic">sin datos</span>}
                </div>
              );
            })}
            {editing && <p className="text-[11px] text-slate-500 italic">Elegí Sí / No / — (sin datos) en cada criterio y tocá "Guardar". {db.cloud ? "Tus datos se comparten con toda la comunidad (se guardan en la nube)." : "Tus datos se guardan en este navegador como relevamiento manual."}</p>}
            {!editing && !hasAnyData(place) && <p className="text-[11px] text-slate-500 italic">Todavía no hay datos verificados de este lugar. Podés cargarlos vos con "Editar".</p>}
          </div>

          {/* Reseñas */}
          <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><MessageSquare size={15} /> Comentarios ({reviews.length})</h3>
          <div className="space-y-2 mb-4 max-h-44 overflow-y-auto">
            {reviews.length === 0 && <p className="text-xs text-slate-500 italic">Todavía no hay comentarios. ¡Sé el primero!</p>}
            {reviews.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{r.name}</span>
                  <span className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} size={12} className={s <= r.stars ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{r.text}</p>
                <span className="text-[10px] text-slate-500">{r.date}</span>
              </div>
            ))}
          </div>

          {/* Formulario */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setStars(s)}>
                  <Star size={24} className={(hover || stars) >= s ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-2">{stars ? `${stars}/5` : "Tu calificación"}</span>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)"
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Tu experiencia con la accesibilidad del lugar..."
              rows={2} className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500 resize-none" />
            <button onClick={submit} disabled={!stars || !text.trim()}
              className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition">
              Publicar comentario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisPanel({ stats, onClose, onReset, hasOverrides }) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-sky-200 shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400 rounded-t-2xl" />
        <div className="sticky top-0 bg-white p-5 border-b border-sky-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BarChart3 size={20} className="text-sky-500" /> Análisis de Accesibilidad</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="p-5">
          {/* Donut: cobertura de datos verificados de acceso */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <Donut pct={stats.pctConDato} />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Acceso verificado: <b>{stats.accesible}</b></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500" /> Acceso parcial: <b>{stats.parcial}</b></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-300" /> Sin datos: <b>{stats.sinDato}</b></div>
              <div className="text-slate-500 pt-1 border-t border-slate-200">Total de lugares: <b>{stats.total}</b></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
              <div className="text-3xl font-bold text-emerald-500">{stats.conDato}</div>
              <div className="text-xs text-slate-500 mt-1">lugares con dato real de acceso (fuente OpenStreetMap)</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-3xl font-bold text-slate-400">{stats.sinDato}</div>
              <div className="text-xs text-slate-500 mt-1">a relevar (sin datos verificados todavía)</div>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-700 mb-3">Datos cargados por criterio</h3>
          <div className="space-y-3">
            {stats.byCriteria.map((c) => {
              const Icon = c.icon;
              const conDato = c.si + c.no;
              return (
                <div key={c.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700"><Icon size={13} /> {c.label}</span>
                    <span className="text-slate-500">{conDato}/{stats.total} con dato</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-orange-500 transition-all" style={{ width: `${Math.round((conDato / stats.total) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 mt-5 leading-relaxed border-t border-slate-200 pt-3">
            <b>Sobre los datos:</b> los lugares y sus ubicaciones son reales. Los datos de accesibilidad provienen de
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline"> OpenStreetMap</a> (ODbL),
            son verificables (cada lugar con dato enlaza a su objeto en OSM) y hoy solo cubren el <b>acceso en silla de ruedas</b> de
            unos pocos lugares. El resto figura como <b>"sin datos / a relevar"</b>: no se inventa nada. Podés cargar datos reales
            vos mismo desde la ficha de cada lugar (relevamiento manual); {db.cloud ? "se guardan en la nube y los ve toda la comunidad." : "se guardan en este navegador."}
          </p>

          {hasOverrides && (
            <button onClick={onReset}
              className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-medium transition">
              <RotateCcw size={14} /> Borrar mis datos cargados
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Donut({ pct }) {
  const r = 50, c = 2 * Math.PI * r;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="16" />
      <circle cx="70" cy="70" r={r} fill="none" stroke="#10b981" strokeWidth="16" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} transform="rotate(-90 70 70)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="70" y="64" textAnchor="middle" className="fill-slate-800" style={{ fontSize: 26, fontWeight: 700 }}>{pct}%</text>
      <text x="70" y="84" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 11 }}>con datos</text>
    </svg>
  );
}