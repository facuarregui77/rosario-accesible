import { useState, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { MapPin, Accessibility, Star, X, Filter, BarChart3, CheckCircle2, XCircle, MessageSquare, Bath, MoveUp, BookOpen, Hand, ArrowUpDown, Pencil, RotateCcw, Save, Search, ChevronLeft, List, Lock, Unlock, Lightbulb, ClipboardList, LocateFixed, ChevronRight } from "lucide-react";
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
  // Salud (ubicaciones y dato de accesibilidad reales de OpenStreetMap)
  { id: "hosp_centenario", name: "Hospital Provincial del Centenario", type: "salud", lat: -32.938543, lng: -60.664759, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "190050427") },
  { id: "heca", name: "Hospital de Emergencias Dr. Clemente Álvarez (HECA)", type: "salud", lat: -32.952783, lng: -60.670521, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "304102717") },
  { id: "hosp_provincial", name: "Hospital Provincial de Rosario", type: "salud", lat: -32.956172, lng: -60.63106, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "383917122") },
  { id: "hosp_italiano", name: "Hospital Italiano Garibaldi", type: "salud", lat: -32.970095, lng: -60.646303, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "414243785") },
  { id: "hosp_espanol", name: "Hospital Español", type: "salud", lat: -32.973801, lng: -60.645766, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("way", "475554302") },
  { id: "sanatorio_parque", name: "Sanatorio Parque", type: "salud", lat: -32.944263, lng: -60.653745, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "4030806363") },
  { id: "sanatorio_ninos", name: "Sanatorio de Niños", type: "salud", lat: -32.944224, lng: -60.654669, a: { ...SIN_DATOS }, wheelchair: "si", src: osm("node", "4030806362") },
  // Transporte (ubicaciones reales; accesibilidad a relevar)
  { id: "terminal", name: "Terminal de Ómnibus Mariano Moreno", type: "transporte", lat: -32.9606, lng: -60.6790, a: { ...SIN_DATOS } },
  { id: "est_rosario_norte", name: "Estación Rosario Norte", type: "transporte", lat: -32.930733, lng: -60.657531, a: { ...SIN_DATOS } },
  { id: "aeropuerto", name: "Aeropuerto Internacional de Rosario (Islas Malvinas)", type: "transporte", lat: -32.9036, lng: -60.7846, a: { ...SIN_DATOS } },
  // Gobierno / trámites
  { id: "palacio_leones", name: "Municipalidad de Rosario (Palacio de los Leones)", type: "gobierno", lat: -32.947129, lng: -60.632202, a: { ...SIN_DATOS }, wheelchair: "no", src: osm("way", "187197923") },
  { id: "concejo", name: "Concejo Municipal de Rosario", type: "gobierno", lat: -32.9483, lng: -60.63011, a: { ...SIN_DATOS } },
  // Espacios verdes
  { id: "parque_independencia", name: "Parque Independencia", type: "verde", lat: -32.9636, lng: -60.6755, a: { ...SIN_DATOS } },
  { id: "parque_urquiza", name: "Parque Urquiza", type: "verde", lat: -32.957749, lng: -60.623346, a: { ...SIN_DATOS } },
  { id: "parque_italia", name: "Parque Italia", type: "verde", lat: -32.97208, lng: -60.624632, a: { ...SIN_DATOS } },
  { id: "plaza_montenegro", name: "Plaza Montenegro", type: "verde", lat: -32.9476, lng: -60.6386, a: { ...SIN_DATOS } },
];

const CRITERIA = [
  { key: "bano", label: "Baño adaptado", icon: Bath },
  { key: "rampa", label: "Rampa de acceso", icon: ArrowUpDown },
  { key: "ascensor", label: "Ascensor", icon: MoveUp },
  { key: "braille", label: "Menú en braille", icon: BookOpen },
  { key: "senas", label: "Personal con lengua de señas", icon: Hand },
];

const TYPE_LABELS = { bar: "Bar", restaurant: "Restaurante", boliche: "Boliche", educativo: "Educativo", deportivo: "Deportivo", cultural: "Cultural", salud: "Salud", transporte: "Transporte", gobierno: "Gobierno", verde: "Espacio verde" };
const TYPE_PLURAL = { bar: "Bares", restaurant: "Restaurantes", boliche: "Boliches", educativo: "Educativos", deportivo: "Deportivos", cultural: "Culturales", salud: "Salud", transporte: "Transporte", gobierno: "Gobierno", verde: "Espacios verdes" };
const TYPE_COLORS = { bar: "#f59e0b", restaurant: "#10b981", boliche: "#a855f7", educativo: "#3b82f6", deportivo: "#ef4444", cultural: "#d946ef", salud: "#14b8a6", transporte: "#64748b", gobierno: "#6366f1", verde: "#84cc16" };
// Ícono (emoji) por categoría — usado en los marcadores y en las etiquetas
const TYPE_EMOJI = { bar: "🍺", restaurant: "🍽️", boliche: "🎶", educativo: "🎓", deportivo: "⚽", cultural: "🎭", salud: "🏥", transporte: "🚌", gobierno: "🏛️", verde: "🌳" };

// Etiquetas del acceso en silla de ruedas (dato real de OSM)
const WHEELCHAIR_LABELS = { si: "Acceso en silla de ruedas", parcial: "Acceso parcial en silla de ruedas", no: "Sin acceso en silla de ruedas" };

// Código para desbloquear el "modo edición" (admin). Cambialo por el que quieras.
// (Candado blando del lado del cliente; la seguridad real llega con login de Supabase.)
const ADMIN_CODE = "rosario-2026";

// ¿Tenemos algún dato real o cargado para este lugar?
const hasAnyData = (p) => p.wheelchair != null || CRITERIA.some((c) => p.a[c.key] != null);

// Normaliza texto para buscar sin distinguir mayúsculas ni acentos
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Chip compacto del acceso en silla de ruedas (dato real de OSM)
function AccessChip({ wheelchair }) {
  if (wheelchair === "si") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap">♿ Accesible</span>;
  if (wheelchair === "parcial") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">♿ Parcial</span>;
  if (wheelchair === "no") return <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">♿ Sin acceso</span>;
  return null;
}

// Aplica los cambios guardados por el usuario sobre los datos base
const mergePlaces = (overrides) => PLACES.map((p) => {
  const o = overrides[p.id];
  if (!o) return p;
  const { wheelchair, ...a } = o; // separamos el estado general de los 5 criterios
  return {
    ...p,
    a: { ...p.a, ...a },
    wheelchair: wheelchair != null ? wheelchair : p.wheelchair, // null = sin dato → se mantiene el de OSM
  };
});

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

function RealMap({ places, selected, onSelect, avgRating, showRamps, searchTerm }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const rampsLayerRef = useRef(null);
  const isMobileRef = useRef(false);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Inicializar el mapa una sola vez
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || mapRef.current || !containerRef.current) return;
      // ¿Es un celular/tablet (pantalla táctil)? Aplicamos ajustes más livianos para que vaya fluido.
      const isMobile = (L.Browser && L.Browser.mobile) || window.matchMedia("(pointer: coarse)").matches;
      isMobileRef.current = isMobile;
      // Límites de la ciudad de Rosario: el mapa no se puede alejar ni desplazar fuera de la ciudad.
      const ROSARIO_BOUNDS = [[-33.06, -60.82], [-32.83, -60.55]];
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true,          // dibuja las rampas en canvas (no cientos de nodos SVG) → paneo mucho más ágil
        minZoom: 12,                 // no permite alejarse hasta ver toda la provincia
        maxBounds: ROSARIO_BOUNDS,   // no permite salir de Rosario
        maxBoundsViscosity: 0.5,     // borde menos "pegajoso" → se arrastra más libre
        inertiaDeceleration: 2200,   // glide natural al soltar el dedo
        wheelPxPerZoomLevel: 40,     // zoom con la rueda más rápido
        zoomDelta: 1,
        zoomSnap: isMobile ? 0.5 : 1,// zoom más suave al pellizcar en celular
        keyboardPanDelta: 120,       // flechas del teclado mueven más
        fadeAnimation: !isMobile,    // sin fundido de tiles en celular → menos trabajo de pintado
        markerZoomAnimation: !isMobile, // celular: los pines no se animan al pellizcar → menos repintado por frame
        tap: false,                  // mejor respuesta táctil en celulares modernos
      }).setView([-32.945, -60.66], 13);
      // Mapa con calles (Esri — muy confiable, sin bloqueos)
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri",
        keepBuffer: isMobile ? 2 : 6,   // celular: menos tiles en memoria → arrastre mucho más liviano
        updateWhenIdle: isMobile,       // celular: carga tiles al SOLTAR (arrastre fluido); escritorio: mientras se mueve
        updateWhenZooming: false,
      }).addTo(map);
      mapRef.current = map;
      map.zoomControl.setPosition("bottomright"); // abajo-derecha: no choca con el panel ni el header
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
      // Color = ACCESIBILIDAD (semáforo: verde/ámbar/rojo/gris). El ÍCONO indica el tipo de lugar.
      const color = p.wheelchair === "si" ? "#10b981" : p.wheelchair === "parcial" ? "#f59e0b" : p.wheelchair === "no" ? "#ef4444" : "#94a3b8";
      const size = isSel ? 38 : 28;
      const stroke = isSel ? "#0284c7" : "white";   // selección: anillo celeste + más grande
      const strokeW = isSel ? 3 : 1.5;
      const emoji = TYPE_EMOJI[p.type] || "📍";
      const F = Math.round(size * 0.4);
      // En celular evitamos `filter:drop-shadow` (repinta cada frame al panear/zoom → laguea).
      // Usamos una sombra "barata": un óvalo gris dibujado dentro del SVG, sin filtro.
      const mobile = isMobileRef.current;
      const svgShadow = mobile
        ? `<ellipse cx="12" cy="22.5" rx="4" ry="1.3" fill="rgba(0,0,0,0.28)" stroke="none"/>`
        : "";
      const svgFilter = mobile ? "" : "filter:drop-shadow(0 2px 3px rgba(0,0,0,0.5));";
      const icon = L.divIcon({
        className: "",
        html: `<div style="transform:translate(-50%,-100%);position:relative;width:${size}px;height:${size}px;">
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeW}"
            style="${svgFilter}">
            ${svgShadow}
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="5" fill="white"/>
          </svg>
          <span style="position:absolute;left:0;width:${size}px;text-align:center;top:${Math.round(size * 0.375 - F / 2)}px;font-size:${F}px;line-height:${F}px;">${emoji}</span>
        </div>`,
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

  // Mientras se escribe en el buscador, el mapa se ajusta solo a los resultados (feedback en vivo).
  // Debounce de 250 ms para no saltar en cada tecla. Solo actúa si hay una búsqueda activa.
  useEffect(() => {
    if (!ready || !mapRef.current || !window.L) return;
    const q = (searchTerm || "").trim();
    if (!q) return;                         // sin búsqueda → no movemos la vista del usuario
    const L = window.L;
    const t = setTimeout(() => {
      if (!mapRef.current || !places.length) return;  // sin resultados → dejamos el mapa como está
      if (places.length === 1) {
        mapRef.current.setView([places[0].lat, places[0].lng], 16, { animate: true });
      } else {
        const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, ready]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (mapRef.current) mapRef.current.setView([-32.945, -60.66], 13, { animate: true });
  };

  return (
    <>
      <div ref={containerRef} className="absolute inset-0 w-full h-full"
        style={{ background: "radial-gradient(circle at 30% 20%, #e0f2fe 0%, #f0f9ff 60%, #ffffff 100%)" }} />
      <button onClick={resetView} title="Volver a la vista inicial del mapa"
        className="absolute top-3 right-3 z-[500] flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 hover:bg-white text-sky-700 border border-sky-400 backdrop-blur shadow-lg transition">
        <RotateCcw size={16} />
      </button>
    </>
  );
}

// Distancia en metros entre dos puntos (fórmula de Haversine)
const distanceM = (a, b) => {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};
const fmtDist = (d) => (d == null ? "" : d < 1000 ? `${Math.round(d)} m` : `${(d / 1000).toFixed(1)} km`);

// Modo relevamiento (solo admin): geolocaliza, ordena los lugares por cercanía y permite
// cargar la accesibilidad con pocos toques, parado frente al lugar.
function SurveyMode({ places, onSaveAccess, onClose }) {
  const [coords, setCoords] = useState(null);
  const [geo, setGeo] = useState("loading"); // loading | ok | denied | error | unavailable
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [active, setActive] = useState(null); // lugar en edición
  const [draftA, setDraftA] = useState(null);
  const [draftW, setDraftW] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const askLocation = () => {
    if (!("geolocation" in navigator)) { setGeo("unavailable"); return; }
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeo("ok"); },
      (err) => { setGeo(err && err.code === 1 ? "denied" : "error"); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };
  useEffect(() => { askLocation(); }, []);

  const list = useMemo(() => {
    const arr = places
      .filter((p) => (onlyMissing ? !hasAnyData(p) : true))
      .map((p) => ({ p, d: coords ? distanceM(coords, p) : null }));
    if (coords) arr.sort((a, b) => a.d - b.d);
    else arr.sort((a, b) => a.p.name.localeCompare(b.p.name));
    return arr;
  }, [places, onlyMissing, coords]);

  const done = places.filter(hasAnyData).length;

  const openEditor = (p) => { setActive(p); setDraftA({ ...p.a }); setDraftW(p.wheelchair ?? null); };
  const save = async () => {
    setSaving(true);
    await onSaveAccess(active.id, draftA, draftW);
    setSaving(false);
    setToast(`Guardado: ${active.name}`);
    setActive(null);
    setTimeout(() => setToast(""), 2500);
  };

  const WOPTS = [["si", "Accesible"], ["parcial", "Parcial"], ["no", "Sin acceso"], [null, "Sin datos"]];
  const wClass = (v, on) => on
    ? (v === "si" ? "bg-emerald-500 text-white border-emerald-500" : v === "parcial" ? "bg-amber-500 text-white border-amber-500" : v === "no" ? "bg-rose-500 text-white border-rose-500" : "bg-slate-400 text-white border-slate-400")
    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";

  return (
    <div className="fixed inset-0 z-[1300] bg-white flex flex-col">
      {/* Encabezado */}
      <div className="shrink-0 bg-sky-100 border-b border-sky-300 px-4 py-3 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-sky-500 text-white"><ClipboardList size={18} /></div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-800 leading-tight">Modo relevamiento</h2>
          <p className="text-xs text-slate-500">{done} de {places.length} lugares con datos</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-sky-200 text-slate-600"><X size={20} /></button>
      </div>

      {!active ? (
        // ---- Lista de lugares por cercanía ----
        <div className="flex-1 overflow-y-auto scroll-orange">
          <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <LocateFixed size={14} className={geo === "ok" ? "text-emerald-500" : "text-slate-400"} />
              {geo === "loading" && "Buscando tu ubicación…"}
              {geo === "ok" && "Ordenado por cercanía a vos"}
              {geo === "denied" && "Sin permiso de ubicación · orden alfabético"}
              {(geo === "error" || geo === "unavailable") && "Ubicación no disponible · orden alfabético"}
              {(geo === "denied" || geo === "error") && (
                <button onClick={askLocation} className="underline text-sky-600 ml-1">reintentar</button>
              )}
            </div>
            <button onClick={() => setOnlyMissing((v) => !v)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition ${onlyMissing ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-300"}`}>
              {onlyMissing ? "Solo sin datos" : "Todos"}
            </button>
          </div>

          {list.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-400 italic">
              {onlyMissing ? "¡No quedan lugares sin datos! 🎉" : "No hay lugares."}
            </p>
          )}

          {list.map(({ p, d }) => (
            <button key={p.id} onClick={() => openEditor(p)}
              className="w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-sky-50 transition flex items-center gap-3">
              <span className="text-xl shrink-0">{TYPE_EMOJI[p.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800 truncate">{p.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-slate-400">{TYPE_LABELS[p.type]}</span>
                  {d != null && <span className="text-[11px] font-medium text-sky-600">· {fmtDist(d)}</span>}
                  {hasAnyData(p) ? <AccessChip wheelchair={p.wheelchair} /> : <span className="text-[11px] text-orange-500 italic">a relevar</span>}
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        // ---- Editor rápido del lugar ----
        <div className="flex-1 overflow-y-auto scroll-orange">
          <div className="px-4 py-3 border-b border-slate-100">
            <button onClick={() => setActive(null)} className="text-sm text-sky-600 flex items-center gap-1 mb-2"><ChevronLeft size={16} /> Volver a la lista</button>
            <h3 className="text-lg font-bold text-slate-800">{active.name}</h3>
            <span className="text-xs text-slate-400">{TYPE_LABELS[active.type]}</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Estado general (semáforo) */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2"><Accessibility size={16} className="text-sky-600" /> ¿Es accesible en silla de ruedas?</p>
              <div className="grid grid-cols-2 gap-2">
                {WOPTS.map(([v, l]) => (
                  <button key={l} onClick={() => setDraftW(v)}
                    className={`px-3 py-3 rounded-xl text-sm font-medium border transition ${wClass(v, draftW === v)}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* 5 criterios */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Detalle</p>
              <div className="space-y-2">
                {CRITERIA.map((c) => {
                  const Icon = c.icon;
                  const val = draftA[c.key];
                  return (
                    <div key={c.key} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200">
                      <span className="flex items-center gap-2 text-sm text-slate-700"><Icon size={18} className="text-slate-500" /> {c.label}</span>
                      <div className="flex gap-1.5">
                        {[["si", "Sí"], ["no", "No"], [null, "—"]].map(([v, l]) => (
                          <button key={l} onClick={() => setDraftA({ ...draftA, [c.key]: v })}
                            className={`w-10 py-1.5 rounded-lg text-sm font-medium border transition ${val === v ? (v === "si" ? "bg-emerald-500 text-white border-emerald-500" : v === "no" ? "bg-rose-500 text-white border-rose-500" : "bg-slate-400 text-white border-slate-400") : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Barra inferior fija con Guardar */}
          <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 flex gap-2" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <button onClick={() => setActive(null)} className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition">Cancelar</button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white text-sm font-semibold transition">
              <Save size={16} /> {saving ? "Guardando…" : "Guardar y volver"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1400] bg-emerald-600 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </div>
  );
}

// Mini-formulario para que el público SUGIERA datos de accesibilidad (entran como propuesta pendiente).
function SuggestionForm({ onSubmit }) {
  const [sugg, setSugg] = useState({ wheelchair: null, bano: null, rampa: null, ascensor: null, braille: null, senas: null });
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);

  const anyData = sugg.wheelchair != null || CRITERIA.some((c) => sugg[c.key] != null) || comment.trim();
  const submit = () => {
    if (!anyData) return;
    onSubmit({ ...sugg, comment: comment.trim(), name: name.trim() });
    setSent(true);
  };

  if (sent) return (
    <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2">
      <CheckCircle2 size={16} /> ¡Gracias! Tu sugerencia será revisada por el equipo. 💙
    </div>
  );

  const WOPTS = [["si", "Accesible"], ["parcial", "Parcial"], ["no", "Sin acceso"]];

  return (
    <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200">
      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Lightbulb size={15} className="text-amber-500" /> Sugerir datos de accesibilidad</p>
      <p className="text-[11px] text-slate-500 mb-2.5">Completá solo lo que sepas. El equipo lo revisa antes de publicarlo.</p>

      <div className="mb-2">
        <span className="text-xs text-slate-600">Acceso en silla de ruedas</span>
        <div className="flex gap-1.5 mt-1">
          {WOPTS.map(([v, l]) => (
            <button key={v} onClick={() => setSugg((s) => ({ ...s, wheelchair: s.wheelchair === v ? null : v }))}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition ${sugg.wheelchair === v ? (v === "si" ? "bg-emerald-500 text-white border-emerald-500" : v === "parcial" ? "bg-amber-500 text-white border-amber-500" : "bg-rose-500 text-white border-rose-500") : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5 mb-2">
        {CRITERIA.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-600"><Icon size={14} className="text-slate-400" /> {c.label}</span>
              <div className="flex gap-1">
                {[["si", "Sí"], ["no", "No"], [null, "—"]].map(([v, l]) => (
                  <button key={l} onClick={() => setSugg((s) => ({ ...s, [c.key]: v }))}
                    className={`w-8 py-0.5 rounded text-xs font-medium border transition ${sugg[c.key] === v ? (v === "si" ? "bg-emerald-500 text-white border-emerald-500" : v === "no" ? "bg-rose-500 text-white border-rose-500" : "bg-slate-400 text-white border-slate-400") : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
        placeholder="Comentario (opcional): contanos qué viste…"
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 resize-none mb-2" />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)"
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 mb-2" />

      <button onClick={submit} disabled={!anyData}
        className="w-full px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-medium transition">
        Enviar sugerencia
      </button>
    </div>
  );
}

// Panel de moderación (solo admin): aprobar / rechazar las sugerencias del público.
function SuggestionsPanel({ suggestions, places, onApprove, onReject, onClose, onRefresh }) {
  const nameOf = (id) => places.find((p) => p.id === id)?.name || id;
  const chip = (label, v) => (
    <span className={`text-[11px] px-1.5 py-0.5 rounded border ${v === "si" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : v === "parcial" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
      {label}: {v === "si" ? "Sí" : v === "parcial" ? "Parcial" : "No"}
    </span>
  );
  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl rounded-t-2xl border border-sky-200 shadow-2xl scroll-orange">
        <div className="sticky top-0 bg-sky-50 p-4 border-b border-sky-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Lightbulb size={18} className="text-amber-500" /> Sugerencias pendientes ({suggestions.length})</h2>
          <div className="flex items-center gap-1">
            <button onClick={onRefresh} title="Actualizar" className="p-1.5 rounded-lg hover:bg-sky-100 text-slate-500"><RotateCcw size={16} /></button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {suggestions.length === 0 && <p className="text-center text-sm text-slate-400 italic py-8">No hay sugerencias pendientes. 🎉</p>}
          {suggestions.map((s) => (
            <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="font-semibold text-sm text-slate-800">{nameOf(s.place_id)}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {s.wheelchair && chip("Silla de ruedas", s.wheelchair)}
                {CRITERIA.filter((c) => s[c.key]).map((c) => chip(c.label, s[c.key]))}
              </div>
              {s.comment && <p className="text-xs text-slate-600 mt-2 italic">“{s.comment}”</p>}
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-[11px] text-slate-400">{s.name ? `por ${s.name}` : "anónimo"}</span>
                <div className="flex gap-2">
                  <button onClick={() => onReject(s)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100 transition">Rechazar</button>
                  <button onClick={() => onApprove(s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition"><CheckCircle2 size={14} /> Aprobar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ddPos, setDdPos] = useState(null); // posición del desplegable (portal), medida del buscador
  const searchBoxRef = useRef(null);
  const dropdownRef = useRef(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [accessFilter, setAccessFilter] = useState("all");
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showRamps, setShowRamps] = useState(false);
  const [showSurvey, setShowSurvey] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [showSuggPanel, setShowSuggPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 640 : true));
  const [admin, setAdmin] = useState(() => !db.cloud && typeof window !== "undefined" && localStorage.getItem("admin_mode") === "1");
  const [showLogin, setShowLogin] = useState(false);

  // En modo nube, "admin" = sesión activa de Supabase
  useEffect(() => {
    if (!db.cloud) return;
    db.getSession().then((s) => setAdmin(!!s));
    const unsub = db.onAuthChange((s) => setAdmin(!!s));
    return () => unsub();
  }, []);

  // Activar / salir del modo edición (admin)
  const toggleAdmin = () => {
    if (db.cloud) {
      if (admin) db.signOut();   // cerrar sesión
      else setShowLogin(true);   // abrir login real
      return;
    }
    // Modo local (sin nube): candado con código
    if (admin) { setAdmin(false); try { localStorage.removeItem("admin_mode"); } catch (e) {} return; }
    const code = window.prompt("Ingresá el código de administrador para editar la información:");
    if (code == null) return;
    if (code === ADMIN_CODE) { setAdmin(true); try { localStorage.setItem("admin_mode", "1"); } catch (e) {} }
    else window.alert("Código incorrecto.");
  };
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

  // Guarda los 5 criterios y, si se pasa, el estado general (wheelchair). Preserva lo previo.
  const saveAccess = async (placeId, newA, newWheelchair = undefined) => {
    const prev = overrides[placeId] || {};
    const merged = { ...prev, ...newA };
    if (newWheelchair !== undefined) merged.wheelchair = newWheelchair;
    const next = { ...overrides, [placeId]: merged };
    setOverrides(next);
    await db.saveAccess(placeId, merged, next);
  };

  const resetAccess = async () => {
    setOverrides({});
    await db.clearMyAccess();
  };

  // ---- Sugerencias del público (capa 2) ----
  // Cargar las pendientes cuando el usuario es admin (en la nube, RLS solo deja leerlas al admin).
  useEffect(() => {
    if (!admin) { setPendingSuggestions([]); return; }
    db.loadPendingSuggestions().then(setPendingSuggestions).catch(() => {});
  }, [admin]);

  const refreshSuggestions = () => { db.loadPendingSuggestions().then(setPendingSuggestions).catch(() => {}); };

  const addSuggestion = async (placeId, s) => {
    const item = { id: `local-${Date.now()}-${Math.round(Math.random() * 1e6)}`, place_id: placeId, status: "pending", created_at: new Date().toISOString(), ...s };
    const next = db.cloud ? null : [...pendingSuggestions, item];
    await db.addSuggestion(placeId, s, next);
    if (!db.cloud) setPendingSuggestions(next);
    else if (admin) refreshSuggestions();
  };

  const approveSuggestion = async (sug) => {
    const place = data.find((p) => p.id === sug.place_id);
    const newA = { ...(place ? place.a : {}) };
    CRITERIA.forEach((c) => { if (sug[c.key] != null) newA[c.key] = sug[c.key]; });
    const newW = sug.wheelchair != null ? sug.wheelchair : undefined;
    await saveAccess(sug.place_id, newA, newW);
    const next = pendingSuggestions.filter((x) => x.id !== sug.id);
    setPendingSuggestions(next);
    await db.setSuggestionStatus(sug.id, "approved", next);
  };

  const rejectSuggestion = async (sug) => {
    const next = pendingSuggestions.filter((x) => x.id !== sug.id);
    setPendingSuggestions(next);
    await db.setSuggestionStatus(sug.id, "rejected", next);
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
      if (accessFilter === "no" && p.wheelchair !== "no") return false;
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
    const rated = (reviews[id] || []).filter((x) => x.stars > 0);
    if (!rated.length) return null;
    return (rated.reduce((s, x) => s + x.stars, 0) / rated.length).toFixed(1);
  };

  // Sugerencias del autocompletado: todas las coincidencias por nombre (respetando los filtros activos).
  const suggestions = filtered;

  // Elegir un lugar de la lista: lo resalta y centra en el mapa, y completa el buscador.
  const pickSuggestion = (p) => {
    setSelected(p);
    setQuery(p.name);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  // Al tocar "Buscar" o Enter: si hay una sugerencia marcada con el teclado la elige; si no, el primer resultado.
  const handleSearch = () => {
    if (activeIndex >= 0 && suggestions[activeIndex]) { pickSuggestion(suggestions[activeIndex]); return; }
    if (filtered.length > 0) setSelected(filtered[0]);
    setShowSuggestions(false);
  };

  // Navegación del desplegable con el teclado (flechas / Enter / Esc).
  const onSearchKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setShowSuggestions(true); setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { handleSearch(); }
    else if (e.key === "Escape") { setShowSuggestions(false); setActiveIndex(-1); }
  };

  // Cerrar el desplegable al hacer clic fuera del buscador (o del propio desplegable, que vive en un portal).
  useEffect(() => {
    const onDocClick = (e) => {
      if (searchBoxRef.current && searchBoxRef.current.contains(e.target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Medir dónde colocar el desplegable (debajo del buscador). Como va en un portal con position:fixed,
  // ningún contenedor padre puede recortarlo. Se recalcula al abrir y al cambiar el tamaño/scroll.
  const placeDropdown = () => {
    const el = searchBoxRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setDdPos({ top: r.bottom + 6, left: r.left, width: r.width });
  };
  useLayoutEffect(() => {
    if (showSuggestions && query.trim()) placeDropdown();
  }, [showSuggestions, query]);
  useEffect(() => {
    if (!showSuggestions) return;
    const onMove = () => placeDropdown();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [showSuggestions]);

  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col overflow-hidden bg-sky-50 text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="relative z-20 shrink-0 bg-sky-100 border-b border-sky-300 px-3 sm:px-5 py-3 sm:py-4">
        {/* Detalle decorativo superior: franja celeste → naranja */}
        <div className="-mx-3 sm:-mx-5 -mt-3 sm:-mt-4 mb-3 h-1.5 bg-gradient-to-r from-sky-400 via-orange-300 to-orange-400" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-sky-400 to-orange-400 shadow-lg shadow-sky-400/30 text-white shrink-0">
              <Accessibility size={28} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight text-orange-500" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Rosario Access Map</h1>
              <p className="text-xs sm:text-sm font-medium text-sky-800">Toda la información disponible acerca de la accesibilidad local.</p>
            </div>
            <button onClick={toggleAdmin}
              title={admin ? "Modo edición activado — tocá para salir" : "Acceso de administrador (editar información)"}
              className={`shrink-0 ml-1 w-8 h-8 flex items-center justify-center rounded-lg border transition ${admin ? "bg-emerald-500 text-white border-emerald-500" : "bg-white/70 text-slate-400 border-slate-200 hover:text-sky-600 hover:border-sky-300"}`}>
              {admin ? <Unlock size={15} /> : <Lock size={15} />}
            </button>
          </div>
          {/* Buscador con autocompletado */}
          <div className="w-full sm:flex-1 sm:max-w-md" ref={searchBoxRef}>
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <button type="button" onClick={handleSearch} aria-label="Buscar"
                    title="Buscar y resaltar el lugar en el mapa"
                    className="absolute left-0 top-0 h-full px-2.5 z-10 flex items-center text-sky-500 hover:text-sky-700 active:text-sky-800 transition">
                    <Search size={16} />
                  </button>
                  <input value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setActiveIndex(-1); }}
                    onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
                    onKeyDown={onSearchKeyDown}
                    placeholder="Buscar un lugar por nombre…"
                    role="combobox" aria-expanded={showSuggestions} aria-autocomplete="list"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/90 border border-sky-300 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-sky-500 transition" />
                  {query && (
                    <button onClick={() => { setQuery(""); setShowSuggestions(false); setActiveIndex(-1); }} title="Limpiar búsqueda"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      <X size={15} />
                    </button>
                  )}
                </div>
                <button onClick={handleSearch} title="Buscar y resaltar el lugar en el mapa"
                  className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium border border-sky-500 shadow-sm transition">
                  <Search size={15} /> <span className="hidden sm:inline">Buscar</span>
                </button>
              </div>

              {/* Desplegable de coincidencias en vivo (estilo autocompletado).
                  Va en un PORTAL al <body> con position:fixed → ningún padre lo recorta. */}
              {showSuggestions && query.trim() && ddPos && createPortal(
                <ul role="listbox" ref={dropdownRef}
                  style={{ position: "fixed", top: ddPos.top, left: ddPos.left, width: ddPos.width }}
                  className="z-[3000] bg-white rounded-xl border border-sky-200 shadow-2xl max-h-[70vh] overflow-y-auto scroll-orange">
                  {suggestions.length === 0 ? (
                    <li className="px-3 py-2.5 text-sm text-slate-400 italic">Sin coincidencias…</li>
                  ) : (
                    suggestions.map((p, i) => {
                      const dot = p.wheelchair === "si" ? "#10b981" : p.wheelchair === "parcial" ? "#f59e0b" : p.wheelchair === "no" ? "#ef4444" : "#94a3b8";
                      return (
                        <li key={p.id} role="option" aria-selected={i === activeIndex}>
                          <button onClick={() => pickSuggestion(p)}
                            onMouseEnter={() => setActiveIndex(i)}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition ${i === activeIndex ? "bg-sky-100" : "hover:bg-sky-50"}`}>
                            <span className="text-base leading-none shrink-0">{TYPE_EMOJI[p.type]}</span>
                            <span className="flex-1 truncate text-slate-700 font-medium">{p.name}</span>
                            <span className="text-[11px] text-slate-400 shrink-0">{TYPE_LABELS[p.type]}</span>
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: dot }} title="Accesibilidad" />
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>,
                document.body
              )}
            </div>
          </div>
          <div className="flex flex-row flex-wrap sm:flex-col gap-2 sm:w-36 shrink-0">
            <button onClick={() => setShowAnalysis(true)}
              className="flex-1 sm:w-full justify-center flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white transition text-sm font-medium border border-orange-500 shadow-sm">
              <BarChart3 size={16} /> Análisis
            </button>
            <button onClick={() => setShowRamps((v) => !v)}
              title="Mostrar u ocultar las rampas y cruces accesibles de la vía pública (fuente OpenStreetMap)"
              className={`flex-1 sm:w-full justify-center flex items-center gap-2 px-4 py-2 rounded-xl transition text-sm font-medium border shadow-sm ${showRamps ? "bg-sky-500 hover:bg-sky-400 text-white border-sky-500" : "bg-white/90 hover:bg-white text-sky-700 border-sky-400"}`}>
              <Accessibility size={16} /> Rampas
            </button>
            {admin && (
              <button onClick={() => setShowSurvey(true)}
                title="Relevar accesibilidad en la calle: ordena los lugares por cercanía y los cargás con pocos toques"
                className="flex-1 sm:w-full justify-center flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white transition text-sm font-medium border border-emerald-500 shadow-sm">
                <ClipboardList size={16} /> Relevar
              </button>
            )}
            {admin && (
              <button onClick={() => { setShowSuggPanel(true); refreshSuggestions(); }}
                title="Revisar las sugerencias de accesibilidad enviadas por el público"
                className="relative flex-1 sm:w-full justify-center flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-amber-700 transition text-sm font-medium border border-amber-400 shadow-sm">
                <Lightbulb size={16} /> Sugerencias
                {pendingSuggestions.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-bold">{pendingSuggestions.length}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filtros — fila por tipo (deslizable en celular, con wrap en escritorio) */}
        <div className="flex items-center gap-2 mt-3 flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0">
          <span title="Filtrar por tipo de lugar" className="shrink-0 text-slate-400"><Filter size={15} /></span>
          {["all", "bar", "restaurant", "boliche", "educativo", "deportivo", "cultural", "salud", "transporte", "gobierno", "verde"].map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition border ${typeFilter === t ? "bg-sky-500 text-white border-sky-500" : "bg-white/90 text-sky-700 border-sky-400 hover:bg-white"}`}>
              {t === "all" ? "Todos" : TYPE_PLURAL[t]}
            </button>
          ))}
        </div>
        {/* Filtros — fila por accesibilidad */}
        <div className="flex items-center gap-2 mt-2 flex-nowrap overflow-x-auto sm:flex-wrap sm:overflow-visible pb-1 sm:pb-0">
          <span title="Filtrar por acceso en silla de ruedas" className="shrink-0 text-slate-400"><Accessibility size={15} /></span>
          {[["all", "Todos"], ["si", "Accesible"], ["parcial", "Parcial"], ["no", "Sin acceso"], ["sindato", "Sin datos"]].map(([k, l]) => (
            <button key={k} onClick={() => setAccessFilter(k)}
              className={`shrink-0 whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition border ${accessFilter === k ? "bg-orange-500 text-white border-orange-500" : "bg-white/90 text-sky-700 border-sky-400 hover:bg-white"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido: mapa a pantalla completa + panel lateral desplegable */}
      <div className="relative flex-1 min-h-0">
        <RealMap places={filtered} selected={selected} onSelect={setSelected} avgRating={avgRating} showRamps={showRamps} searchTerm={query} />
        <div className="absolute bottom-3 left-3 z-[500] text-[10px] text-slate-600 bg-white/90 border border-sky-100 px-2 py-1 rounded pointer-events-none">
          {filtered.length} lugares
        </div>

        {/* Fondo oscuro al abrir el panel en celular */}
        {sidebarOpen && <div className="sm:hidden absolute inset-0 bg-black/30 z-[1040]" onClick={() => setSidebarOpen(false)} />}

        {/* Panel lateral desplegable (overlay sobre el mapa, no lo deforma) */}
        <div className={`absolute inset-y-0 left-0 z-[1050] w-[86%] max-w-xs transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="h-full overflow-y-auto bg-sky-100 border-r border-sky-300 scroll-orange shadow-2xl">
            {filtered.length === 0 && <p className="px-4 py-4 text-sm text-slate-500 italic">No hay lugares que coincidan con la búsqueda.</p>}
            {filtered.map((p) => (
              <button key={p.id} onClick={() => { setSelected(p); if (typeof window !== "undefined" && window.innerWidth < 640) setSidebarOpen(false); }}
                className={`w-full text-left px-4 py-3 border-b border-sky-200 border-l-4 hover:bg-sky-200 transition ${selected?.id === p.id ? "bg-sky-300 border-l-orange-500" : "border-l-transparent"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-sky-700">{p.name}</span>
                  <AccessChip wheelchair={p.wheelchair} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: TYPE_COLORS[p.type] + "22", color: TYPE_COLORS[p.type] }}>{TYPE_EMOJI[p.type]} {TYPE_LABELS[p.type]}</span>
                  {p.gRating && <span className="text-[11px] text-slate-500 flex items-center gap-0.5"><Star size={10} className="fill-amber-400 text-amber-400" /> {p.gRating}</span>}
                  {!hasAnyData(p) && <span className="text-[11px] text-slate-400 italic">a relevar</span>}
                </div>
              </button>
            ))}
          </div>
          {/* Tirador para abrir/cerrar el panel */}
          <button onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Ocultar la lista de lugares" : "Ver la lista de lugares"}
            className="absolute top-3 -right-10 w-10 h-14 rounded-r-xl bg-sky-500 hover:bg-sky-400 text-white shadow-lg flex items-center justify-center">
            {sidebarOpen ? <ChevronLeft size={20} /> : <List size={18} />}
          </button>
        </div>
      </div>

      {selectedLive && (
        <DetailPanel place={selectedLive} onClose={() => setSelected(null)} reviews={reviews[selectedLive.id] || []}
          admin={admin}
          onAddReview={(rev) => addReview(selectedLive.id, rev)}
          onSaveAccess={(newA, newW) => saveAccess(selectedLive.id, newA, newW)}
          onAddSuggestion={addSuggestion}
          avgRating={avgRating(selectedLive.id)} />
      )}
      {showAnalysis && <AnalysisPanel stats={stats} onClose={() => setShowAnalysis(false)} onReset={resetAccess} hasOverrides={!db.cloud && Object.keys(overrides).length > 0} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSurvey && admin && (
        <SurveyMode places={data} onClose={() => setShowSurvey(false)}
          onSaveAccess={(placeId, newA, newW) => saveAccess(placeId, newA, newW)} />
      )}
      {showSuggPanel && admin && (
        <SuggestionsPanel suggestions={pendingSuggestions} places={data}
          onApprove={approveSuggestion} onReject={rejectSuggestion}
          onRefresh={refreshSuggestions} onClose={() => setShowSuggPanel(false)} />
      )}
    </div>
  );
}

function DetailPanel({ place, onClose, reviews, onAddReview, onSaveAccess, onAddSuggestion, avgRating, admin }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [kind, setKind] = useState("experiencia"); // "experiencia" | "sugerencia"
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(place.a);
  const [draftW, setDraftW] = useState(place.wheelchair ?? null);

  useEffect(() => { setDraft(place.a); setDraftW(place.wheelchair ?? null); setEditing(false); }, [place.id, place.a, place.wheelchair]);

  const submit = () => {
    if (!text.trim()) return; // las estrellas son opcionales (una sugerencia puede no llevar puntaje)
    onAddReview({ stars, kind, name: name.trim() || "Anónimo", text: text.trim(), date: new Date().toLocaleDateString("es-AR") });
    setStars(0); setName(""); setText(""); setKind("experiencia");
  };

  const saveEdit = () => { onSaveAccess(draft, draftW); setEditing(false); };
  const cancelEdit = () => { setDraft(place.a); setDraftW(place.wheelchair ?? null); setEditing(false); };

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl rounded-t-2xl border border-sky-200 shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400 sm:rounded-t-2xl rounded-t-2xl" />
        <div className="sticky top-0 bg-sky-50 p-5 border-b border-sky-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{place.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: TYPE_COLORS[place.type] + "22", color: TYPE_COLORS[place.type] }}>{TYPE_EMOJI[place.type]} {TYPE_LABELS[place.type]}</span>
              {place.gRating && <span className="text-xs text-slate-500 flex items-center gap-1"><Star size={12} className="fill-amber-400 text-amber-400" /> {place.gRating} Google</span>}
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
            {editing ? (
              <div className="flex items-center gap-2">
                <button onClick={cancelEdit} className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-600 transition">Cancelar</button>
                <button onClick={saveEdit} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-medium transition">
                  <Save size={13} /> Guardar
                </button>
              </div>
            ) : admin ? (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-xs text-sky-700 border border-sky-200 transition">
                <Pencil size={13} /> Editar
              </button>
            ) : null}
          </div>

          {editing && (
            <div className="mb-3 p-2.5 rounded-lg border bg-sky-50 border-sky-200">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2"><Accessibility size={16} className="text-sky-600" /> Accesibilidad general (silla de ruedas)</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[["si", "Accesible"], ["parcial", "Parcial"], ["no", "Sin acceso"], [null, "Sin datos"]].map(([v, l]) => (
                  <button key={l} onClick={() => setDraftW(v)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition ${draftW === v ? (v === "si" ? "bg-emerald-500 text-white border-emerald-500" : v === "parcial" ? "bg-amber-500 text-white border-amber-500" : v === "no" ? "bg-rose-500 text-white border-rose-500" : "bg-slate-400 text-white border-slate-400") : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

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
            {!editing && !hasAnyData(place) && <p className="text-[11px] text-slate-500 italic">Todavía no hay datos verificados de este lugar.{admin ? ' Podés cargarlos con "Editar".' : ""}</p>}
          </div>

          {/* Sugerir datos de accesibilidad (público, no admin) */}
          {!admin && !editing && <SuggestionForm onSubmit={(s) => onAddSuggestion(place.id, s)} />}

          {/* Opiniones y sugerencias */}
          <h3 className="text-sm font-semibold text-slate-700 mb-1 flex items-center gap-2"><MessageSquare size={15} /> Opiniones y sugerencias ({reviews.length})</h3>
          <p className="text-[11px] text-slate-500 mb-2">Contá tu experiencia o dejá una recomendación para mejorar la app.</p>
          <div className="space-y-2 mb-4 max-h-44 overflow-y-auto">
            {reviews.length === 0 && <p className="text-xs text-slate-500 italic">Todavía no hay opiniones. ¡Sé el primero!</p>}
            {reviews.map((r, i) => {
              const esSug = r.kind === "sugerencia";
              return (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-800">{r.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1 whitespace-nowrap ${esSug ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-sky-100 text-sky-700 border-sky-200"}`}>
                      {esSug ? <><Lightbulb size={10} /> Sugerencia</> : <><MessageSquare size={10} /> Experiencia</>}
                    </span>
                  </div>
                  {r.stars > 0 && <span className="flex gap-0.5 mt-1">{[1,2,3,4,5].map((s) => <Star key={s} size={12} className={s <= r.stars ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}</span>}
                  <p className="text-xs text-slate-600 mt-1">{r.text}</p>
                  <span className="text-[10px] text-slate-500">{r.date}</span>
                </div>
              );
            })}
          </div>

          {/* Formulario de feedback */}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
            {/* Tipo de feedback */}
            <div className="flex gap-2 mb-2">
              {[["experiencia", "Experiencia", MessageSquare], ["sugerencia", "Sugerencia", Lightbulb]].map(([k, l, Ic]) => (
                <button key={k} onClick={() => setKind(k)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition ${kind === k ? "bg-sky-500 text-white border-sky-500" : "bg-white text-slate-600 border-slate-200 hover:bg-sky-100"}`}>
                  <Ic size={13} /> {l}
                </button>
              ))}
            </div>
            {/* Puntuación (opcional) */}
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => setStars(stars === s ? 0 : s)}>
                  <Star size={24} className={(hover || stars) >= s ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-2">{stars ? `${stars}/5` : "Puntuación (opcional)"}</span>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)"
              className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500" />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === "sugerencia" ? "¿Qué te gustaría que mejoremos o agreguemos?" : "Contanos tu experiencia con la accesibilidad del lugar…"}
              rows={2} className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500 resize-none" />
            <button onClick={submit} disabled={!text.trim()}
              className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition">
              Enviar
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

function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email || !password) return;
    setErr(""); setLoading(true);
    const { error } = await db.signIn(email.trim(), password);
    setLoading(false);
    if (error) setErr("No se pudo iniciar sesión. Revisá el email y la contraseña.");
    else onClose();
  };
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-white rounded-2xl border border-sky-200 shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Lock size={18} className="text-sky-600" /> Acceso de administrador</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email"
            className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-500" />
          {err && <p className="text-xs text-rose-600 mb-2">{err}</p>}
          <button onClick={submit} disabled={loading || !email || !password}
            className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition">
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
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