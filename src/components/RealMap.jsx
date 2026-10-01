import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TYPE_COLORS, TYPE_LABELS, ACCESS_LABELS, accessColor, prefersReducedMotion } from "../data/constants";
import { reverseGeocode, escapeH } from "../lib/geo";

// Vista inicial: toda la ciudad
const HOME = { center: [-32.945, -60.66], zoom: 13 };
// Límites de la ciudad de Rosario: el mapa no se puede alejar ni desplazar fuera de la ciudad.
const ROSARIO_BOUNDS = [[-33.06, -60.82], [-32.83, -60.55]];
// Con muchas rampas (dataset municipal), solo se dibujan a partir de este zoom y dentro de la vista.
const RAMPS_MIN_ZOOM = 14;
const RAMPS_MANY = 1500;

export default function RealMap({ places, selected, onSelect, avgRating, ramps, showRamps, onRampsHint, searchTerm, sidebarOpen, route, userPos, picking, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const rampsLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userLayerRef = useRef(null);
  const isMobileRef = useRef(false);
  const [ready, setReady] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const pickingRef = useRef(picking);
  pickingRef.current = picking;
  const rampsRef = useRef(ramps);
  rampsRef.current = ramps;
  const onRampsHintRef = useRef(onRampsHint);
  onRampsHintRef.current = onRampsHint;
  const animate = !prefersReducedMotion();

  // Inicializar el mapa una sola vez
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    // ¿Es un celular/tablet (pantalla táctil)? Aplicamos ajustes más livianos para que vaya fluido.
    const isMobile = (L.Browser && L.Browser.mobile) || window.matchMedia("(pointer: coarse)").matches;
    isMobileRef.current = isMobile;
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
      fadeAnimation: !isMobile && animate,    // sin fundido de tiles en celular → menos trabajo de pintado
      zoomAnimation: animate,                 // respeta "reducir animaciones" del sistema
      markerZoomAnimation: !isMobile && animate, // celular: los pines no se animan al pellizcar → menos repintado por frame
      tap: false,                  // mejor respuesta táctil en celulares modernos
    }).setView(HOME.center, HOME.zoom);
    // Mapa con calles (Esri — muy confiable, sin bloqueos ni marca de agua).
    // detectRetina: en pantallas nítidas carga los tiles al doble de resolución → se ve más nítido.
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      maxNativeZoom: 19,
      detectRetina: true,
      attribution: "Tiles &copy; Esri",
      keepBuffer: isMobile ? 2 : 6,   // celular: menos tiles en memoria → arrastre mucho más liviano
      updateWhenIdle: isMobile,       // celular: carga tiles al SOLTAR (arrastre fluido); escritorio: mientras se mueve
      updateWhenZooming: false,
    }).addTo(map);
    mapRef.current = map;
    map.zoomControl.setPosition("bottomright"); // abajo-derecha: no choca con el panel ni el header
    layerRef.current = L.layerGroup().addTo(map);
    // Varios "empujones" para forzar la carga del mapa dentro del visor
    const kick = () => { if (mapRef.current === map) map.invalidateSize(); }; // (si el mapa ya se desmontó, no hace nada)
    setTimeout(kick, 200);
    setTimeout(kick, 800);
    setTimeout(kick, 2000);
    // Clic en el mapa: si estamos "eligiendo un punto" (agregar lugar), devolvemos las coordenadas.
    map.on("click", (e) => {
      kick();
      if (pickingRef.current && onPickRef.current) onPickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    setReady(true);
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cursor en cruz mientras se elige un punto en el mapa
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor = picking ? "crosshair" : "";
  }, [picking]);

  // Dibujar / actualizar los marcadores cuando cambian los lugares filtrados
  useEffect(() => {
    if (!ready || !layerRef.current) return;
    layerRef.current.clearLayers();
    places.forEach((p) => {
      const isSel = selected?.id === p.id;
      // Color del PIN = TIPO de lugar (bar naranja, restaurante verde, etc.).
      // Puntito central = ACCESIBILIDAD (semáforo verde/ámbar/rojo/gris), para no perder ese dato.
      const typeColor = TYPE_COLORS[p.type] || "#64748b";
      const accColor = accessColor(p.wheelchair);
      const size = isSel ? 38 : 28;
      const stroke = isSel ? "#0f172a" : "white";   // selección: contorno oscuro + más grande
      const strokeW = isSel ? 2.5 : 1.5;
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
          <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${typeColor}" stroke="${stroke}" stroke-width="${strokeW}" aria-hidden="true"
            style="${svgFilter}">
            ${svgShadow}
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="4.6" fill="white" stroke="none"/>
            <circle cx="12" cy="9" r="2.4" fill="${accColor}" stroke="none"/>
          </svg>
        </div>`,
        iconSize: [size, size],
        iconAnchor: [0, 0],
      });
      const avg = avgRating(p.id);
      // `title`: nombre accesible del pin para teclado y lectores de pantalla (Leaflet lo hace enfocable con Tab).
      const a11yName = `${p.name}, ${TYPE_LABELS[p.type] || p.type}, ${ACCESS_LABELS[p.wheelchair ?? null]}`;
      const marker = L.marker([p.lat, p.lng], { icon, title: a11yName, riseOnHover: true }).addTo(layerRef.current);
      marker.bindTooltip(`${p.name}${avg ? ` · ★${avg}` : ""}`, { direction: "top", offset: [0, -size] });
      marker.on("click", () => onSelectRef.current(p));
      marker.on("keypress", (e) => { const k = e.originalEvent && e.originalEvent.key; if (k === "Enter" || k === " ") onSelectRef.current(p); });
    });
  }, [places, selected, ready, avgRating]);

  // Centrar el mapa en el lugar seleccionado al hacer clic
  useEffect(() => {
    if (!ready || !mapRef.current || !selected) return;
    mapRef.current.setView([selected.lat, selected.lng], 16, { animate });
  }, [selected, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mientras se escribe en el buscador, el mapa se ajusta solo a los resultados (feedback en vivo).
  // Debounce de 250 ms para no saltar en cada tecla. Solo actúa si hay una búsqueda activa.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const q = (searchTerm || "").trim();
    if (!q) return;                         // sin búsqueda → no movemos la vista del usuario
    const t = setTimeout(() => {
      if (!mapRef.current || !places.length) return;  // sin resultados → dejamos el mapa como está
      if (places.length === 1) {
        mapRef.current.setView([places[0].lat, places[0].lng], 16, { animate });
      } else {
        const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng]));
        mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Capa de rampas / cruces accesibles (se prende y apaga con el botón).
  // Con pocos puntos se dibujan todos; con miles (dataset municipal) solo los que están a la vista
  // y a partir de cierto zoom, para que el celular no se arrodille.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    if (!showRamps) {
      if (rampsLayerRef.current) { rampsLayerRef.current.remove(); rampsLayerRef.current = null; }
      onRampsHintRef.current && onRampsHintRef.current("");
      return;
    }
    const draw = () => {
      const pts = rampsRef.current || [];
      if (!rampsLayerRef.current) rampsLayerRef.current = L.layerGroup().addTo(map);
      const grp = rampsLayerRef.current;
      grp.clearLayers();
      const many = pts.length > RAMPS_MANY;
      if (many && map.getZoom() < RAMPS_MIN_ZOOM) {
        onRampsHintRef.current && onRampsHintRef.current(`Acercá el mapa para ver las ${pts.length.toLocaleString("es-AR")} rampas`);
        return;
      }
      const b = many ? map.getBounds().pad(0.2) : null;
      let n = 0;
      pts.forEach(([lat, lng, srcTag]) => {
        if (b && !b.contains([lat, lng])) return;
        n++;
        const municipal = srcTag === "m";
        L.circleMarker([lat, lng], { radius: 4, color: municipal ? "#0369a1" : "#0284c7", weight: 1, fillColor: municipal ? "#7dd3fc" : "#38bdf8", fillOpacity: 0.85 })
          .bindTooltip("Rampa / cruce accesible — tocá para ver la dirección", { direction: "top" })
          .bindPopup("Buscando dirección…", { minWidth: 180 })
          .on("click", function () {
            const m = this;
            const fuente = municipal ? "Municipalidad de Rosario (datos abiertos)" : "OpenStreetMap";
            m.setPopupContent("🦽 <b>Rampa / cruce accesible</b><br>📍 Buscando dirección…");
            reverseGeocode(lat, lng).then((addr) => {
              m.setPopupContent(`🦽 <b>Rampa / cruce accesible</b><br>📍 ${escapeH(addr)}<br><span style="color:#475569;font-size:11px">Ubicación aproximada · fuente ${fuente}</span>`);
            });
          })
          .addTo(grp);
      });
      onRampsHintRef.current && onRampsHintRef.current(many ? `${n.toLocaleString("es-AR")} rampas a la vista (de ${pts.length.toLocaleString("es-AR")})` : "");
    };
    draw();
    map.on("moveend", draw);
    return () => { map.off("moveend", draw); };
  }, [showRamps, ramps, ready]);

  // Dibujar la ruta accesible (línea celeste + punto de origen) cuando hay una calculada.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (routeLayerRef.current) { routeLayerRef.current.remove(); routeLayerRef.current = null; }
    if (route && route.coords && route.coords.length) {
      const line = L.polyline(route.coords, { color: "#0284c7", weight: 5, opacity: 0.9 });
      const grp = L.layerGroup([line]);
      if (route.origin) {
        L.circleMarker(route.origin, { radius: 7, color: "#fff", weight: 2, fillColor: "#0284c7", fillOpacity: 1 })
          .bindTooltip("Tu ubicación", { direction: "top" }).addTo(grp);
      }
      grp.addTo(mapRef.current);
      routeLayerRef.current = grp;
      try { mapRef.current.fitBounds(line.getBounds(), { padding: [60, 60], maxZoom: 17, animate }); } catch (e) {}
    }
  }, [route, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Punto azul "estás acá" (cuando el usuario activa "Cerca de mí")
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (userLayerRef.current) { userLayerRef.current.remove(); userLayerRef.current = null; }
    if (!userPos) return;
    const grp = L.layerGroup();
    if (userPos.accuracy) L.circle([userPos.lat, userPos.lng], { radius: Math.min(userPos.accuracy, 300), color: "#2563eb", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.12 }).addTo(grp);
    L.circleMarker([userPos.lat, userPos.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 })
      .bindTooltip("Estás acá", { direction: "top" }).addTo(grp);
    grp.addTo(mapRef.current);
    userLayerRef.current = grp;
    mapRef.current.setView([userPos.lat, userPos.lng], Math.max(mapRef.current.getZoom(), 15), { animate });
  }, [userPos, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Volver a la vista inicial de toda la ciudad
  const resetView = () => {
    if (mapRef.current) mapRef.current.setView(HOME.center, HOME.zoom, { animate });
  };

  return (
    <>
      <div ref={containerRef} role="application" aria-label="Mapa de accesibilidad de Rosario. Usá Tab para recorrer los lugares y Enter para abrir uno." className="absolute inset-0 w-full h-full"
        style={{ background: "radial-gradient(circle at 30% 20%, #e0f2fe 0%, #f0f9ff 60%, #ffffff 100%)" }} />
      <button onClick={resetView} title="Volver a la vista inicial del mapa" aria-label="Volver a la vista inicial del mapa"
        className={`absolute flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 hover:bg-white text-sky-700 border border-sky-400 backdrop-blur shadow-lg transition-all duration-300 ${sidebarOpen ? "z-[1060] bottom-20 sm:bottom-3 left-[calc(86%_+_0.5rem)] sm:left-[21rem]" : "z-[500] bottom-3 left-3"}`}>
        <RotateCcw size={16} />
      </button>
    </>
  );
}
