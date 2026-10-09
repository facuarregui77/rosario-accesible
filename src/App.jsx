import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Accessibility, Star, X, Filter, BarChart3, CheckCircle2, Search, ChevronLeft, List, Lock, Unlock, Lightbulb, ClipboardList, ChevronRight, SlidersHorizontal, Navigation, Plus, Info, LocateFixed } from "lucide-react";
// Capa de datos: nube (Supabase) con fallback automático a localStorage
import * as db from "./db";
import { PLACES } from "./data/places";
import { CRITERIA, TYPE_LABELS, TYPE_PLURAL, TYPE_COLORS, ADMIN_CODE, hasAnyData, norm, accessColor } from "./data/constants";
// Rebajes de cordón / cruces accesibles de Rosario (datos reales de OpenStreetMap, ODbL)
import RAMPS from "./rampas-rosario.json";
import { distanceM, fmtDist } from "./lib/geo";
import { AccessChip } from "./components/AccessChip";
import RealMap from "./components/RealMap";
import Legend from "./components/Legend";
import SurveyMode from "./components/SurveyMode";
import SuggestionsPanel from "./components/SuggestionsPanel";
import DetailPanel from "./components/DetailPanel";
import AnalysisPanel from "./components/AnalysisPanel";
import LoginModal from "./components/LoginModal";
import AboutModal from "./components/AboutModal";
import AddPlaceModal from "./components/AddPlaceModal";
import ContactButtons from "./components/ContactButtons";
import { ROUTING_ON, fetchRoute } from "./lib/routing";
import { updateHead } from "./lib/seo";

// Aplica los cambios guardados (relevamiento) sobre los datos base
const mergePlaces = (base, overrides) => base.map((p) => {
  const o = overrides[p.id];
  if (!o) return p;
  const { wheelchair, _updatedAt, ...a } = o; // separamos el estado general y la fecha de los 5 criterios
  return {
    ...p,
    a: { ...p.a, ...a },
    wheelchair: wheelchair != null ? wheelchair : p.wheelchair, // null = sin dato → se mantiene el de OSM
    updatedAt: _updatedAt || null,
  };
});

// Radios disponibles para "Cerca de mí"
const RADII = [[500, "500 m"], [1000, "1 km"], [2000, "2 km"], [null, "Toda la ciudad"]];

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
  const [rampsHint, setRampsHint] = useState("");
  const [showSurvey, setShowSurvey] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [showSuggPanel, setShowSuggPanel] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [criteriaFilter, setCriteriaFilter] = useState([]); // criterios que el lugar DEBE tener ("si")
  const [route, setRoute] = useState(null); // ruta accesible: {loading|error|coords, origin, distance, duration, to}
  const [sidebarOpen, setSidebarOpen] = useState(() => (typeof window !== "undefined" ? window.innerWidth >= 640 : true));
  const [admin, setAdmin] = useState(() => !db.cloud && typeof window !== "undefined" && localStorage.getItem("admin_mode") === "1");
  const [showLogin, setShowLogin] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  // "Cerca de mí": ubicación del usuario + radio de búsqueda
  const [userPos, setUserPos] = useState(null);       // {lat, lng, accuracy}
  const [geoState, setGeoState] = useState("idle");   // idle | loading | ok | denied | error
  const [radius, setRadius] = useState(1000);         // metros; null = sin límite
  // Alta de lugares (admin)
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [picking, setPicking] = useState(false);      // esperando un clic en el mapa
  const [picked, setPicked] = useState(null);
  const [customPlaces, setCustomPlaces] = useState([]); // lugares sumados desde la app
  // Mensajes para lectores de pantalla (región aria-live)
  const [liveMsg, setLiveMsg] = useState("");
  const announce = useCallback((msg) => { setLiveMsg(""); setTimeout(() => setLiveMsg(msg), 50); }, []);
  // Alto contraste (ajuste de accesibilidad; se recuerda en el navegador y respeta la preferencia del sistema)
  const [highContrast, setHighContrast] = useState(() => {
    try {
      const saved = localStorage.getItem("alto_contraste");
      if (saved != null) return saved === "1";
    } catch (e) {}
    return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-contrast: more)").matches;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("hc", highContrast);
    try { localStorage.setItem("alto_contraste", highContrast ? "1" : "0"); } catch (e) {}
  }, [highContrast]);

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

  // Cargar reseñas, cambios de accesibilidad y lugares agregados (nube o local)
  useEffect(() => {
    (async () => {
      try {
        const { overrides: ov, reviews: rv, places: pl } = await db.loadAll();
        setOverrides(ov);
        setReviews(rv);
        setCustomPlaces(pl || []);
      } catch (e) { console.error("Error cargando datos:", e); db.logError("loadAll", e && e.message); }
      setLoading(false);
    })();
  }, []);

  const addReview = async (placeId, rev) => {
    const item = { id: `local-${Date.now()}`, ...rev };
    const next = { ...reviews, [placeId]: [...(reviews[placeId] || []), item] };
    setReviews(next);
    await db.addReview(placeId, rev, next);
    announce("Opinión enviada. ¡Gracias!");
    // En la nube el id real lo pone la base: recargamos para poder borrarla después si hace falta.
    if (db.cloud) db.loadAll().then(({ reviews: rv }) => setReviews(rv)).catch(() => {});
  };

  const deleteReview = async (placeId, rev) => {
    if (!window.confirm("¿Borrar esta opinión?")) return;
    const next = { ...reviews, [placeId]: (reviews[placeId] || []).filter((r) => r !== rev) };
    setReviews(next);
    await db.deleteReview(rev.id, next);
    announce("Opinión borrada.");
  };

  // Guarda los 5 criterios y, si se pasa, el estado general (wheelchair). Preserva lo previo.
  const saveAccess = async (placeId, newA, newWheelchair = undefined) => {
    const prev = overrides[placeId] || {};
    const merged = { ...prev, ...newA };
    if (newWheelchair !== undefined) merged.wheelchair = newWheelchair;
    merged._updatedAt = new Date().toISOString();
    const next = { ...overrides, [placeId]: merged };
    setOverrides(next);
    await db.saveAccess(placeId, merged, next);
    announce("Accesibilidad guardada.");
  };

  const resetAccess = async () => {
    setOverrides({});
    await db.clearMyAccess();
  };

  // ---- Lugares agregados desde la app (admin) ----
  const allIds = useMemo(() => new Set([...PLACES.map((p) => p.id), ...customPlaces.map((p) => p.id)]), [customPlaces]);
  const addPlace = async (p) => {
    const item = { ...p, a: { bano: null, rampa: null, ascensor: null, braille: null, senas: null }, custom: true };
    const next = [...customPlaces, item];
    const { error } = await db.addPlace(p, next);
    if (error) return false;
    setCustomPlaces(next);
    setPicked(null);
    announce(`Lugar agregado: ${p.name}.`);
    setTimeout(() => setSelected(item), 100);
    return true;
  };
  const deletePlace = async (p) => {
    if (!window.confirm(`¿Borrar "${p.name}" del mapa? Esta acción no se puede deshacer.`)) return;
    const next = customPlaces.filter((x) => x.id !== p.id);
    const { error } = await db.deletePlace(p.id, next);
    if (error) { window.alert("No se pudo borrar el lugar."); return; }
    setCustomPlaces(next);
    setSelected(null);
    announce("Lugar borrado.");
  };
  const startPick = () => { setPicking(true); setSidebarOpen(false); setFiltersOpen(false); announce("Tocá el mapa donde está el lugar."); };
  const onMapPick = (pos) => { setPicked(pos); setPicking(false); };

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
    announce("Sugerencia enviada. El equipo la va a revisar.");
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

  // Lugares base + agregados desde la app (si un agregado repite id, gana el de la app)
  const basePlaces = useMemo(() => {
    const customIds = new Set(customPlaces.map((p) => p.id));
    return [...PLACES.filter((p) => !customIds.has(p.id)), ...customPlaces];
  }, [customPlaces]);

  // Lista de lugares con los cambios del relevamiento aplicados
  const data = useMemo(() => mergePlaces(basePlaces, overrides), [basePlaces, overrides]);

  // Lugar seleccionado siempre actualizado con los overrides
  const selectedLive = useMemo(
    () => (selected ? data.find((p) => p.id === selected.id) : null),
    [selected, data]
  );

  // Compartir lugar por URL: al abrir con ?lugar=<id> se selecciona ese lugar automáticamente.
  // Capturamos el parámetro inicial ANTES de que el efecto de sincronía pueda borrarlo.
  const initialLugarRef = useRef(typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("lugar") : null);
  const urlAppliedRef = useRef(false);
  useEffect(() => {
    if (urlAppliedRef.current || loading || !data.length) return;
    urlAppliedRef.current = true;
    const id = initialLugarRef.current;
    const found = id && data.find((p) => p.id === id);
    if (found) setSelected(found);
  }, [loading, data]);

  // Título, descripción y dirección oficial de la página según el lugar abierto (para Google y al compartir).
  useEffect(() => { updateHead(selectedLive); }, [selectedLive]);

  // Mantener la URL en sincronía con el lugar abierto (para poder compartir el enlace).
  // Solo actúa una vez aplicado el deep-link inicial (para no pisar el ?lugar antes de leerlo).
  useEffect(() => {
    if (!urlAppliedRef.current) return;
    try {
      const url = selected ? `${window.location.pathname}?lugar=${selected.id}` : window.location.pathname;
      window.history.replaceState(null, "", url);
    } catch (e) { /* ignorar */ }
  }, [selected]);

  // Accesibilidad: la tecla Escape cierra el panel/modal abierto (de arriba hacia abajo).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (showSuggestions) { setShowSuggestions(false); return; }
      if (picking) { setPicking(false); return; }
      if (showAddPlace) { setShowAddPlace(false); return; }
      if (showLogin) { setShowLogin(false); return; }
      if (showAbout) { setShowAbout(false); return; }
      if (showSuggPanel) { setShowSuggPanel(false); return; }
      if (showAnalysis) { setShowAnalysis(false); return; }
      if (showSurvey) { setShowSurvey(false); return; }
      if (selected) { setSelected(null); return; }
      if (filtersOpen) { setFiltersOpen(false); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuggestions, picking, showAddPlace, showLogin, showAbout, showSuggPanel, showAnalysis, showSurvey, selected, filtersOpen]);

  // ---- "Cerca de mí" ----
  const locateMe = () => {
    if (!("geolocation" in navigator)) { setGeoState("error"); announce("Tu dispositivo no permite ubicación."); return; }
    setGeoState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGeoState("ok");
        setSidebarOpen(true);
      },
      (err) => { setGeoState(err && err.code === 1 ? "denied" : "error"); announce("No pudimos obtener tu ubicación."); },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };
  const clearNearMe = () => { setUserPos(null); setGeoState("idle"); };

  const filtered = useMemo(() => {
    const q = norm(query.trim());
    const list = data.filter((p) => {
      if (q && !norm(p.name).includes(q)) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (accessFilter === "si" && p.wheelchair !== "si") return false;
      if (accessFilter === "parcial" && p.wheelchair !== "parcial") return false;
      if (accessFilter === "no" && p.wheelchair !== "no") return false;
      if (accessFilter === "sindato" && hasAnyData(p)) return false;
      if (criteriaFilter.length && !criteriaFilter.every((k) => p.a[k] === "si")) return false;
      return true;
    });
    if (!userPos) return list;
    // Con ubicación: se agrega la distancia, se filtra por radio y se ordena de más cerca a más lejos.
    return list
      .map((p) => ({ ...p, dist: distanceM(userPos, p) }))
      .filter((p) => radius == null || p.dist <= radius)
      .sort((a, b) => a.dist - b.dist);
  }, [query, typeFilter, accessFilter, criteriaFilter, data, userPos, radius]);

  // Anunciar al lector de pantalla cuántos lugares quedan al cambiar filtros o ubicación (con pausa para no "hablar" en cada tecla)
  const firstRunRef = useRef(true);
  useEffect(() => {
    if (firstRunRef.current) { firstRunRef.current = false; return; }
    const t = setTimeout(() => {
      const n = filtered.length;
      announce(userPos && radius ? `${n} ${n === 1 ? "lugar" : "lugares"} a menos de ${fmtDist(radius)} de vos.` : `${n} ${n === 1 ? "lugar encontrado" : "lugares encontrados"}.`);
    }, 600);
    return () => clearTimeout(t);
  }, [filtered.length, userPos, radius]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const avgRating = useCallback((id) => {
    const rated = (reviews[id] || []).filter((x) => x.stars > 0);
    if (!rated.length) return null;
    return (rated.reduce((s, x) => s + x.stars, 0) / rated.length).toFixed(1);
  }, [reviews]);

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

  // "Cómo llego": traza una ruta accesible desde la ubicación del usuario hasta el lugar.
  const requestRoute = (place) => {
    setSelected(null);          // cerrar la ficha para ver el mapa y la ruta
    setSidebarOpen(false);
    setRoute({ loading: true, to: place });
    announce("Calculando ruta accesible…");
    if (!navigator.geolocation) { setRoute({ error: "Tu dispositivo no permite ubicación.", to: place }); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const start = [pos.coords.longitude, pos.coords.latitude];
          const r = await fetchRoute(start, [place.lng, place.lat]);
          setRoute({ ...r, origin: [pos.coords.latitude, pos.coords.longitude], to: place });
          announce(`Ruta accesible a ${place.name}: ${(r.distance / 1000).toFixed(2)} kilómetros, unos ${Math.round(r.duration / 60)} minutos.`);
        } catch (e) {
          setRoute({ error: e.message || "No se pudo calcular la ruta.", to: place });
          announce(e.message || "No se pudo calcular la ruta.");
        }
      },
      () => setRoute({ error: "Necesitamos tu ubicación para trazar la ruta.", to: place }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

  const anyFilter = typeFilter !== "all" || accessFilter !== "all" || criteriaFilter.length > 0 || (userPos && radius != null);

  return (
    <div className="w-full h-screen h-[100dvh] flex flex-col overflow-hidden bg-sky-50 text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {/* Región para lectores de pantalla: anuncia resultados, guardados, rutas, etc. (invisible) */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{liveMsg}</div>

      {/* Header */}
      <header className="relative z-20 shrink-0 bg-sky-100 border-b border-sky-300 px-3 sm:px-5 py-3 sm:py-4">
        {/* Detalle decorativo superior: franja celeste → naranja */}
        <div className="-mx-3 sm:-mx-5 -mt-3 sm:-mt-4 mb-3 h-1.5 bg-gradient-to-r from-blue-800 via-sky-400 to-orange-400" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-blue-700 via-sky-400 to-orange-400 shadow-lg shadow-sky-400/30 text-white shrink-0" aria-hidden="true">
              <Accessibility size={28} />
            </div>
            <div className="sm:max-w-[13rem] lg:max-w-[15rem] xl:max-w-sm">
              <h1 className="text-lg sm:text-xl font-extrabold leading-tight tracking-tight w-fit bg-gradient-to-r from-blue-800 via-sky-500 to-orange-500 bg-clip-text text-transparent" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>Rosario Access Map</h1>
              <p className="text-xs sm:text-sm font-medium text-blue-900">Toda la información disponible acerca de la accesibilidad local.</p>
            </div>
            <button onClick={() => setShowAbout(true)} title="Acerca del proyecto, fuentes y cómo colaborar" aria-label="Acerca de Rosario Access Map"
              className="shrink-0 ml-1 w-8 h-8 flex items-center justify-center rounded-lg border bg-white/70 text-sky-700 border-sky-300 hover:bg-white transition">
              <Info size={16} />
            </button>
            <button onClick={toggleAdmin}
              title={admin ? "Modo edición activado — tocá para salir" : "Acceso de administrador (editar información)"}
              aria-label={admin ? "Salir del modo administrador" : "Acceso de administrador"} aria-pressed={admin}
              className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border transition ${admin ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/70 text-slate-500 border-slate-300 hover:text-sky-700 hover:border-sky-300"}`}>
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
                    className="absolute left-0 top-0 h-full px-2.5 z-10 flex items-center text-sky-600 hover:text-sky-800 active:text-sky-800 transition">
                    <Search size={16} />
                  </button>
                  <input value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setActiveIndex(-1); }}
                    onFocus={() => { if (query.trim()) setShowSuggestions(true); }}
                    onKeyDown={onSearchKeyDown}
                    placeholder="Buscar un lugar por nombre…" aria-label="Buscar un lugar por nombre"
                    role="combobox" aria-expanded={showSuggestions} aria-autocomplete="list" aria-controls="search-listbox"
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-white/90 border border-sky-300 text-sm text-slate-700 placeholder:text-slate-500 outline-none focus:border-sky-600 transition" />
                  {query && (
                    <button onClick={() => { setQuery(""); setShowSuggestions(false); setActiveIndex(-1); }} title="Limpiar búsqueda" aria-label="Limpiar búsqueda"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition">
                      <X size={15} />
                    </button>
                  )}
                </div>
                <button onClick={handleSearch} title="Buscar y resaltar el lugar en el mapa"
                  className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-700 text-white text-sm font-medium border border-blue-800 shadow-sm transition">
                  <Search size={15} /> <span className="hidden xl:inline">Buscar</span>
                </button>
              </div>

              {/* Desplegable de coincidencias en vivo (estilo autocompletado).
                  Va en un PORTAL al <body> con position:fixed → ningún padre lo recorta. */}
              {showSuggestions && query.trim() && ddPos && createPortal(
                <ul role="listbox" id="search-listbox" ref={dropdownRef}
                  style={{ position: "fixed", top: ddPos.top, left: ddPos.left, width: ddPos.width }}
                  className="z-[3000] bg-white rounded-xl border border-sky-200 shadow-2xl max-h-[70vh] overflow-y-auto scroll-orange">
                  {suggestions.length === 0 ? (
                    <li className="px-3 py-2.5 text-sm text-slate-500 italic">Sin coincidencias…</li>
                  ) : (
                    suggestions.map((p, i) => (
                      <li key={p.id} role="option" aria-selected={i === activeIndex}>
                        <button onClick={() => pickSuggestion(p)}
                          onMouseEnter={() => setActiveIndex(i)}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 text-sm transition ${i === activeIndex ? "bg-sky-100" : "hover:bg-sky-50"}`}>
                          <span className="flex-1 truncate text-slate-700 font-medium">{p.name}</span>
                          {p.dist != null && <span className="text-xs text-slate-600 shrink-0">{fmtDist(p.dist)}</span>}
                          <span className="text-xs shrink-0 font-medium" style={{ color: TYPE_COLORS[p.type] }}>{TYPE_LABELS[p.type]}</span>
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: accessColor(p.wheelchair) }} title="Accesibilidad" />
                        </button>
                      </li>
                    ))
                  )}
                </ul>,
                document.body
              )}
            </div>
          </div>
          <div className="flex flex-row flex-wrap sm:flex-col lg:grid lg:grid-cols-2 gap-2 sm:w-36 lg:w-[19rem] shrink-0">
            {admin && (
              <button onClick={() => setShowAnalysis(true)}
                className="flex-1 sm:w-full justify-center flex items-center gap-2 px-2 sm:px-4 lg:px-3 py-2 rounded-xl whitespace-nowrap bg-orange-600 hover:bg-orange-500 text-white transition text-sm font-medium border border-orange-600 shadow-sm">
                <BarChart3 size={16} /> Análisis
              </button>
            )}
            <button onClick={userPos ? clearNearMe : locateMe} aria-pressed={!!userPos} disabled={geoState === "loading"}
              title={userPos ? "Dejar de ordenar por cercanía" : "Ver los lugares más cercanos a donde estás"}
              className={`flex-1 sm:w-full justify-center flex items-center gap-2 px-2 sm:px-4 lg:px-3 py-2 rounded-xl whitespace-nowrap transition text-sm font-medium border shadow-sm disabled:opacity-60 ${userPos ? "bg-blue-700 hover:bg-blue-600 text-white border-blue-700" : "bg-white/90 hover:bg-white text-blue-800 border-blue-700"}`}>
              <LocateFixed size={16} /> {geoState === "loading" ? "Ubicando…" : "Cerca de mí"}
            </button>
            <button onClick={() => setShowRamps((v) => !v)} aria-pressed={showRamps}
              title="Mostrar u ocultar las rampas y cruces accesibles de la vía pública (fuente OpenStreetMap)"
              className={`flex-1 sm:w-full justify-center flex items-center gap-2 px-2 sm:px-4 lg:px-3 py-2 rounded-xl whitespace-nowrap transition text-sm font-medium border shadow-sm ${showRamps ? "bg-sky-600 hover:bg-sky-500 text-white border-sky-600" : "bg-white/90 hover:bg-white text-sky-700 border-sky-400"}`}>
              <Accessibility size={16} /> Rampas
            </button>
            {/* Contacto directo (WhatsApp + mail), siempre a la vista */}
            <ContactButtons />
            {admin && (
              <button onClick={() => setShowSurvey(true)}
                title="Relevar accesibilidad en la calle: ordena los lugares por cercanía y los cargás con pocos toques"
                className="flex-1 sm:w-full justify-center flex items-center gap-2 px-2 sm:px-4 lg:px-3 py-2 rounded-xl whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white transition text-sm font-medium border border-emerald-600 shadow-sm">
                <ClipboardList size={16} /> Relevar
              </button>
            )}
            {admin && (
              <button onClick={() => { setShowSuggPanel(true); refreshSuggestions(); }}
                title="Revisar las sugerencias de accesibilidad enviadas por el público"
                className="relative flex-1 sm:w-full justify-center flex items-center gap-2 px-2 sm:px-4 lg:px-3 py-2 rounded-xl whitespace-nowrap bg-white/90 hover:bg-white text-amber-800 transition text-sm font-medium border border-amber-500 shadow-sm">
                <Lightbulb size={16} /> Sugerencias
                {pendingSuggestions.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-orange-600 text-white text-[11px] font-bold" aria-label={`${pendingSuggestions.length} pendientes`}>{pendingSuggestions.length}</span>
                )}
              </button>
            )}
            {admin && (
              <button onClick={() => { setPicked(null); setShowAddPlace(true); }}
                title="Sumar un lugar nuevo al mapa"
                className="flex-1 sm:w-full justify-center flex items-center gap-2 px-2 sm:px-4 lg:px-3 py-2 rounded-xl whitespace-nowrap bg-white/90 hover:bg-white text-emerald-800 transition text-sm font-medium border border-emerald-600 shadow-sm">
                <Plus size={16} /> Agregar lugar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido: mapa a pantalla completa + panel lateral desplegable */}
      <main className="relative flex-1 min-h-0">
        <RealMap places={filtered} selected={selected} onSelect={setSelected} avgRating={avgRating}
          ramps={RAMPS.points} showRamps={showRamps} onRampsHint={setRampsHint}
          searchTerm={query} sidebarOpen={sidebarOpen} route={route} userPos={userPos}
          picking={picking} onPick={onMapPick} />
        <Legend showRamps={showRamps} />

        {/* Aviso de las rampas (cuántas se ven / acercar el mapa) */}
        {showRamps && rampsHint && !route && !picking && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] px-3 py-1.5 rounded-full bg-white/95 border border-sky-300 shadow text-xs text-sky-800 font-medium pointer-events-none">{rampsHint}</div>
        )}

        {/* Aviso mientras se elige un punto en el mapa (agregar lugar) */}
        {picking && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] w-[92%] max-w-sm">
            <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-emerald-400 shadow-lg px-3 py-2 backdrop-blur text-xs text-slate-700">
              <Plus size={16} className="text-emerald-700 shrink-0" />
              <span className="flex-1">Tocá el mapa justo donde está el lugar.</span>
              <button onClick={() => setPicking(false)} className="shrink-0 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Volver</button>
            </div>
          </div>
        )}

        {/* Banner de la ruta accesible (arriba, centrado) */}
        {route && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[600] w-[92%] max-w-sm">
            <div className="flex items-center gap-2 rounded-xl bg-white/95 border border-sky-300 shadow-lg px-3 py-2 backdrop-blur">
              <Navigation size={16} className="text-sky-700 shrink-0" />
              <div className="flex-1 min-w-0 text-xs text-slate-700 leading-snug">
                {route.loading ? "Calculando ruta accesible…"
                  : route.error ? <span className="text-rose-700">{route.error}</span>
                  : <>Ruta accesible a <b>{route.to?.name}</b>: <b>{(route.distance / 1000).toFixed(2)} km</b> · ~{Math.round(route.duration / 60)} min<br /><span className="text-[11px] text-slate-600">Ruta sugerida — verificá el terreno.</span></>}
              </div>
              <button onClick={() => setRoute(null)} aria-label="Cerrar ruta" className="shrink-0 p-1 rounded-lg hover:bg-slate-100 text-slate-600"><X size={16} /></button>
            </div>
          </div>
        )}

        {/* Fondo oscuro al abrir el panel en celular */}
        {sidebarOpen && <div className="sm:hidden absolute inset-0 bg-black/30 z-[1040]" onClick={() => setSidebarOpen(false)} />}

        {/* Panel lateral desplegable (overlay sobre el mapa, no lo deforma) */}
        <div className={`absolute inset-y-0 left-0 z-[1050] w-[86%] max-w-xs transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <nav aria-label="Lista de lugares" className="h-full overflow-y-auto bg-sky-100 border-r border-sky-300 scroll-orange shadow-2xl">
            {userPos && (
              <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 text-xs text-blue-900 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5"><LocateFixed size={13} /> Ordenado por cercanía{radius != null && <> · hasta {RADII.find(([r]) => r === radius)?.[1] || fmtDist(radius)}</>}</span>
                <button onClick={() => setFiltersOpen(true)} className="underline hover:text-blue-700">cambiar</button>
              </div>
            )}
            {filtered.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-600 italic">
                {userPos && radius != null ? `No hay lugares a menos de ${fmtDist(radius)} con estos filtros. Probá ampliar el radio.` : "No hay lugares que coincidan con la búsqueda."}
              </p>
            )}
            {filtered.map((p) => (
              <button key={p.id} onClick={() => { setSelected(p); if (typeof window !== "undefined" && window.innerWidth < 640) setSidebarOpen(false); }}
                aria-current={selected?.id === p.id ? "true" : undefined}
                className={`w-full text-left px-4 py-3 border-b border-sky-200 border-l-4 hover:bg-sky-200 transition ${selected?.id === p.id ? "bg-sky-300 border-l-orange-600" : "border-l-transparent"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm text-sky-800">{p.name}</span>
                  <AccessChip wheelchair={p.wheelchair} />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: TYPE_COLORS[p.type] + "22", color: TYPE_COLORS[p.type] }}>{TYPE_LABELS[p.type]}</span>
                  {p.dist != null && <span className="text-xs font-semibold text-blue-800">{fmtDist(p.dist)}</span>}
                  {p.gRating && <span className="text-xs text-slate-600 flex items-center gap-0.5"><Star size={10} className="fill-amber-400 text-amber-400" aria-hidden="true" /> {p.gRating}</span>}
                  {admin && !hasAnyData(p) && <span className="text-xs text-slate-600 italic">a relevar</span>}
                </div>
              </button>
            ))}
          </nav>
          {/* Tirador para abrir/cerrar el panel */}
          <button onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Ocultar la lista de lugares" : "Ver la lista de lugares"} aria-label={sidebarOpen ? "Ocultar la lista de lugares" : "Ver la lista de lugares"} aria-expanded={sidebarOpen}
            className="absolute top-3 -right-10 w-10 h-14 rounded-r-xl bg-sky-600 hover:bg-sky-500 text-white shadow-lg flex items-center justify-center">
            {sidebarOpen ? <ChevronLeft size={20} /> : <List size={18} />}
          </button>
        </div>

        {/* Fondo oscuro al abrir los filtros en celular */}
        {filtersOpen && <div className="sm:hidden absolute inset-0 bg-black/30 z-[1040]" onClick={() => setFiltersOpen(false)} />}

        {/* Panel de filtros desplegable (derecha) — gemelo del de lugares, con ícono distinto */}
        <div className={`absolute inset-y-0 right-0 z-[1050] w-[86%] max-w-xs transition-transform duration-300 ease-in-out ${filtersOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div role="region" aria-label="Filtros" className="h-full overflow-y-auto bg-sky-100 border-l border-sky-300 scroll-orange shadow-2xl p-4 space-y-5">
            <div role="group" aria-labelledby="f-cerca">
              <p id="f-cerca" className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5"><LocateFixed size={13} /> Cerca de mí</p>
              {!userPos ? (
                <button onClick={locateMe} disabled={geoState === "loading"} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-white text-xs font-medium">
                  <LocateFixed size={14} /> {geoState === "loading" ? "Buscando tu ubicación…" : "Usar mi ubicación"}
                </button>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {RADII.map(([r, l]) => (
                      <button key={String(r)} onClick={() => setRadius(r)} aria-pressed={radius === r}
                        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition border ${radius === r ? "bg-blue-700 text-white border-blue-700" : "bg-white/90 text-blue-800 border-blue-600 hover:bg-white"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <button onClick={clearNearMe} className="mt-2 text-xs text-slate-600 underline hover:text-slate-800">Quitar mi ubicación</button>
                </>
              )}
              {geoState === "denied" && <p className="text-xs text-rose-700 mt-1">No diste permiso de ubicación. Activalo en el navegador y volvé a intentar.</p>}
              {geoState === "error" && <p className="text-xs text-rose-700 mt-1">No pudimos obtener tu ubicación.</p>}
            </div>
            <div role="group" aria-labelledby="f-tipo">
              <p id="f-tipo" className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Filter size={13} /> Tipo de lugar</p>
              <div className="flex flex-wrap gap-2">
                {["all", "bar", "restaurant", "boliche", "educativo", "deportivo", "cultural", "salud", "transporte", "gobierno", "verde"].map((t) => (
                  <button key={t} onClick={() => setTypeFilter(t)} aria-pressed={typeFilter === t}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition border ${typeFilter === t ? "bg-sky-600 text-white border-sky-600" : "bg-white/90 text-sky-700 border-sky-400 hover:bg-white"}`}>
                    {t === "all" ? "Todos" : TYPE_PLURAL[t]}
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-labelledby="f-acc">
              <p id="f-acc" className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Accessibility size={13} /> Accesibilidad</p>
              <div className="flex flex-wrap gap-2">
                {[["all", "Todos"], ["si", "Accesible"], ["parcial", "Parcial"], ["no", "Sin acceso"], ["sindato", "Sin datos"]].map(([k, l]) => (
                  <button key={k} onClick={() => setAccessFilter(k)} aria-pressed={accessFilter === k}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition border ${accessFilter === k ? "bg-orange-600 text-white border-orange-600" : "bg-white/90 text-sky-700 border-sky-400 hover:bg-white"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div role="group" aria-labelledby="f-serv">
              <p id="f-serv" className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-1.5"><CheckCircle2 size={13} /> Servicios (que tenga…)</p>
              <div className="flex flex-wrap gap-2">
                {CRITERIA.map((c) => {
                  const on = criteriaFilter.includes(c.key);
                  const Icon = c.icon;
                  return (
                    <button key={c.key} aria-pressed={on}
                      onClick={() => setCriteriaFilter((prev) => on ? prev.filter((k) => k !== c.key) : [...prev, c.key])}
                      className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium transition border flex items-center gap-1 ${on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white/90 text-sky-700 border-sky-400 hover:bg-white"}`}>
                      <Icon size={12} /> {c.label}
                    </button>
                  );
                })}
              </div>
              {criteriaFilter.length > 0 && (
                <button onClick={() => setCriteriaFilter([])} className="mt-2 text-xs text-slate-600 underline hover:text-slate-800">Limpiar servicios</button>
              )}
            </div>
          </div>
          {/* Tirador para abrir/cerrar los filtros (ícono distinto al de lugares) */}
          <button onClick={() => setFiltersOpen((v) => !v)}
            title={filtersOpen ? "Ocultar filtros" : "Ver filtros"} aria-label={filtersOpen ? "Ocultar filtros" : "Ver filtros"} aria-expanded={filtersOpen}
            className="absolute top-20 -left-10 w-10 h-14 rounded-l-xl bg-orange-600 hover:bg-orange-500 text-white shadow-lg flex items-center justify-center">
            {filtersOpen ? <ChevronRight size={20} /> : <SlidersHorizontal size={18} />}
            {!filtersOpen && anyFilter && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white border-2 border-orange-600" title="Hay filtros activos" />
            )}
          </button>
        </div>
      </main>

      {selectedLive && (
        <DetailPanel place={selectedLive} onClose={() => setSelected(null)} reviews={reviews[selectedLive.id] || []}
          admin={admin}
          onAddReview={(rev) => addReview(selectedLive.id, rev)}
          onDeleteReview={(rev) => deleteReview(selectedLive.id, rev)}
          onDeletePlace={selectedLive.custom ? () => deletePlace(selectedLive) : null}
          onSaveAccess={(newA, newW) => saveAccess(selectedLive.id, newA, newW)}
          onAddSuggestion={addSuggestion}
          onRoute={requestRoute} routingEnabled={ROUTING_ON}
          onAnnounce={announce}
          avgRating={avgRating(selectedLive.id)} />
      )}
      {showAnalysis && admin && <AnalysisPanel stats={stats} onClose={() => setShowAnalysis(false)} onReset={resetAccess} hasOverrides={!db.cloud && Object.keys(overrides).length > 0} />}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} stats={stats} highContrast={highContrast} onToggleContrast={() => setHighContrast((v) => !v)} />}
      {showSurvey && admin && (
        <SurveyMode places={data} onClose={() => setShowSurvey(false)}
          onSaveAccess={(placeId, newA, newW) => saveAccess(placeId, newA, newW)} />
      )}
      {showSuggPanel && admin && (
        <SuggestionsPanel suggestions={pendingSuggestions} places={data}
          onApprove={approveSuggestion} onReject={rejectSuggestion}
          onRefresh={refreshSuggestions} onClose={() => setShowSuggPanel(false)} />
      )}
      {showAddPlace && admin && (
        <AddPlaceModal picked={picked} existingIds={allIds} hidden={picking}
          onPickOnMap={startPick}
          onSave={addPlace} onClose={() => { setShowAddPlace(false); setPicked(null); }} />
      )}
    </div>
  );
}
