import { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TYPE_COLORS, TYPE_LABELS, ACCESS_LABELS, accessColor, prefersReducedMotion } from "../data/constants";
import { reverseGeocode, escapeH } from "../lib/geo";
import { RAMP_ICON_URL } from "../lib/rampIcon";
import { pinSvg, pinImage, PIN_W, PIN_H, oscuro, ESTILO_NOMBRE } from "../lib/pin";

// Vista inicial: toda la ciudad
const HOME = { center: [-32.945, -60.66], zoom: 13 };
// Límites de la ciudad de Rosario: el mapa no se puede alejar ni desplazar fuera de la ciudad.
const ROSARIO_BOUNDS = [[-33.06, -60.82], [-32.83, -60.55]];
// Con muchas rampas (dataset municipal), solo se dibujan a partir de este zoom y dentro de la vista.
const RAMPS_MIN_ZOOM = 14;
const RAMPS_MANY = 1500;

// Ícono de las rampas (persona en silla de ruedas). Se dibuja sobre el canvas del mapa, como antes los
// puntos: así se pueden mostrar más de mil íconos sin que el celular se trabe al mover el mapa.
const rampImg = typeof Image !== "undefined" ? new Image() : null;
if (rampImg) rampImg.src = RAMP_ICON_URL;
// Tamaño del ícono (px) según el zoom: chiquito con la ciudad entera, un poco más grande al acercarse
const rampSize = (z) => (z <= 13 ? 12 : z <= 14 ? 14 : z <= 15 ? 16 : 18);

// Marcador de rampa: se comporta como un círculo de Leaflet (rápido y clickeable), pero dibuja el ícono
const RampMarker = L.CircleMarker.extend({
  _updatePath() {
    const r = this._renderer;
    if (!r || !r._ctx) return L.CircleMarker.prototype._updatePath.call(this); // sin canvas: círculo común
    if (!r._drawing || this._empty()) return;
    const ctx = r._ctx, p = this._point, d = this._radius * 2;
    ctx.save();
    ctx.globalAlpha = 1;
    if (rampImg && rampImg.complete && rampImg.naturalWidth) {
      ctx.drawImage(rampImg, p.x - d / 2, p.y - d / 2, d, d);
    } else {
      // (mientras carga el ícono, un círculo del mismo color)
      ctx.beginPath(); ctx.arc(p.x, p.y, d / 2, 0, Math.PI * 2); ctx.fillStyle = "#0369a1"; ctx.fill();
    }
    ctx.restore();
  },
});

// Pin liviano para las empresas importadas de OpenStreetMap (son más de 1.500): se dibuja en el canvas del
// mapa con la misma forma y colores que los pines comunes, así el celular no se traba.
const PinMarker = L.CircleMarker.extend({
  _updatePath() {
    const r = this._renderer;
    if (!r || !r._ctx) return L.CircleMarker.prototype._updatePath.call(this);
    if (!r._drawing || this._empty()) return;
    const o = this.options, w = o.pinSize, h = Math.round((w * PIN_H) / PIN_W), p = this._point;
    const img = pinImage(o.type, o.wheelchair, w, () => this.redraw());
    if (img.complete && img.naturalWidth) {
      r._ctx.save(); r._ctx.globalAlpha = 1;
      r._ctx.drawImage(img, p.x - w / 2, p.y - h, w, h);   // la punta del pin queda en el lugar exacto
      if (o.nombre && this._map && this._map.getZoom() >= 17) {
        const ctx = r._ctx;
        ctx.font = "600 11px 'Plus Jakarta Sans', system-ui, sans-serif";
        ctx.textBaseline = "middle";
        ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = "#ffffff";
        const t = o.nombre.length > 26 ? o.nombre.slice(0, 25) + "…" : o.nombre;
        ctx.strokeText(t, p.x + w / 2 + 1, p.y - h * 0.62);
        ctx.fillStyle = o.colorNombre; ctx.fillText(t, p.x + w / 2 + 1, p.y - h * 0.62);
      }
      r._ctx.restore();
    }
  },
  // se puede tocar en toda la cabeza del pin (no solo en la punta)
  _containsPoint(pt) {
    const w = this.options.pinSize, h = (w * PIN_H) / PIN_W;
    return pt.distanceTo(L.point(this._point.x, this._point.y - h * 0.62)) <= w * 0.6;
  },
});
// Las empresas importadas se muestran a partir de este zoom (o siempre, si el filtro deja pocas)
const OSM_MIN_ZOOM = 15;
const OSM_POCAS = 250;

export default function RealMap({ places, selected, onSelect, avgRating, ramps, showRamps, onRampsHint, searchTerm, sidebarOpen, route, userPos, picking, onPick }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const osmLayerRef = useRef(null);
  const rampsLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const userLayerRef = useRef(null);
  const isMobileRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(HOME.zoom);
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
    // créditos cortos (sin la banderita ni el "Leaflet" que se agregan solos), para que en celular entren en
    // un renglón y no tapen los botones de abajo
    map.attributionControl.setPrefix(false);
    // Mapa de respaldo (Esri, imágenes sueltas): se ve mientras carga el mapa de estilo Google y queda si este falla.
    const respaldo = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      maxNativeZoom: 19,
      detectRetina: true,
      attribution: "Tiles &copy; Esri",
      keepBuffer: isMobile ? 2 : 6,   // celular: menos tiles en memoria → arrastre mucho más liviano
      updateWhenIdle: isMobile,       // celular: carga tiles al SOLTAR (arrastre fluido); escritorio: mientras se mueve
      updateWhenZooming: false,
    });
    // El de respaldo está SIEMPRE desde el principio (así el mapa nunca queda en blanco) y solo se retira
    // cuando el mapa de estilo Google terminó de dibujarse de verdad.
    respaldo.addTo(map);
    // Mapa de fondo con estilo parecido a Google Maps: OpenFreeMap, estilo "Liberty" (gratis, sin clave y sin
    // límite de uso). Se dibuja con MapLibre, que se carga aparte para no demorar la apertura de la página.
    // Si algo falla (sin WebGL, un bloqueador, el servicio caído o no termina de dibujar), queda el de respaldo.
    (async () => {
      let fondo = null;
      const volverAlRespaldo = (motivo) => {
        console.warn("Mapa de estilo no disponible, uso el de respaldo:", motivo);
        if (mapRef.current !== map) return;
        if (fondo && map.hasLayer(fondo)) fondo.remove();
        if (!map.hasLayer(respaldo)) respaldo.addTo(map);
      };
      try {
        const prueba = document.createElement("canvas");
        if (!(prueba.getContext("webgl2") || prueba.getContext("webgl"))) throw new Error("sin WebGL");
        const [modulo, { default: workerUrl }] = await Promise.all([
          import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl-worker.mjs?url"), import("maplibre-gl/dist/maplibre-gl.css")]);
        const maplibregl = modulo.default || modulo;   // según cómo se empaquete, viene con o sin "default"
        maplibregl.setWorkerUrl(workerUrl);   // dónde está la parte que procesa el mapa en segundo plano
        window.maplibregl = maplibregl;
        // Bajamos el estilo y le sacamos, antes de dibujar, las paradas de colectivo con su número
        // (llenaban el mapa y tapaban los pines) y los iconitos de comercios del propio mapa (para que no se
        // confundan con nuestros pines: así los únicos pines que se ven son los de la app).
        const [{ maplibreGL }, estilo] = await Promise.all([
          import("@maplibre/maplibre-gl-leaflet"),
          fetch("https://tiles.openfreemap.org/styles/liberty").then((r) => { if (!r.ok) throw new Error("estilo " + r.status); return r.json(); }),
        ]);
        estilo.layers = estilo.layers.filter((l) => l["source-layer"] !== "poi" && l.id !== "poi_transit");
        if (mapRef.current !== map) return;
        fondo = maplibreGL({
          style: estilo,
          // créditos que pide OpenFreeMap, en versión corta (si no, el complemento arma uno largo de dos renglones)
          attributionControl: { customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org" target="_blank" rel="noreferrer">OpenMapTiles</a> · &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' },
        }).addTo(map);
        const gl = fondo.getMaplibreMap();
        let listo = false, errores = 0;
        gl.on("error", (e) => {
          errores++;
          if (!listo && errores >= 3) volverAlRespaldo((e && e.error && e.error.message) || "error del mapa");
          // si después falla al cargar otra zona, el de respaldo vuelve debajo para que no quede en blanco
          else if (listo && mapRef.current === map && !map.hasLayer(respaldo)) { respaldo.addTo(map); respaldo.bringToBack(); }
        });
        // "idle" = terminó de dibujar todo lo que está a la vista: recién ahí se retira el de respaldo
        gl.once("idle", () => {
          listo = true;
          if (mapRef.current === map && map.hasLayer(fondo)) setTimeout(() => { if (mapRef.current === map && map.hasLayer(fondo)) respaldo.remove(); }, 400);
        });
        // si a los 12 segundos no terminó de dibujar, nos quedamos con el de respaldo
        setTimeout(() => { if (!listo) volverAlRespaldo("tardó demasiado"); }, 12000);
      } catch (e) {
        volverAlRespaldo(e && e.message);
      }
    })();
    mapRef.current = map;
    map.zoomControl.setPosition("bottomright"); // abajo-derecha: no choca con el panel ni el header
    layerRef.current = L.layerGroup().addTo(map);
    osmLayerRef.current = L.layerGroup();
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
    map.on("zoomend", () => setZoom(Math.round(map.getZoom())));
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
    osmLayerRef.current.clearLayers();
    const map = mapRef.current;
    const osm = places.filter((p) => p.osm && selected?.id !== p.id);
    const osmSize = (z) => (z >= 17 ? 22 : z >= 16 ? 20 : 17);
    osm.forEach((p) => {
      const m = new PinMarker([p.lat, p.lng], { radius: 14, stroke: false, fillOpacity: 0, pinSize: osmSize(map.getZoom()),
        type: p.type, wheelchair: p.wheelchair, nombre: p.name, colorNombre: oscuro(TYPE_COLORS[p.type] || "#5F6368", 0.8) });
      m.bindTooltip(p.name, { direction: "top", offset: [0, -10] });
      m.on("click", () => onSelectRef.current(p));
      m.addTo(osmLayerRef.current);
    });
    // Se ven con el mapa acercado; con la ciudad entera solo si el filtro o la búsqueda dejan pocas
    const mostrar = () => {
      const ver = osm.length <= OSM_POCAS || map.getZoom() >= OSM_MIN_ZOOM;
      if (ver && !map.hasLayer(osmLayerRef.current)) osmLayerRef.current.addTo(map);
      if (!ver && map.hasLayer(osmLayerRef.current)) osmLayerRef.current.remove();
      const t = osmSize(map.getZoom());
      osmLayerRef.current.eachLayer((l) => { if (l.options.pinSize !== t) { l.options.pinSize = t; l.redraw(); } });
    };
    mostrar();
    map.on("zoomend", mostrar);
    places.forEach((p) => {
      if (p.osm && selected?.id !== p.id) return;
      const isSel = selected?.id === p.id;
      // Pin estilo Google Maps: color y dibujito = tipo de lugar; circulito de la esquina = accesibilidad
      // Tamaño según el zoom: chicos con la ciudad entera (no se enciman), más grandes al acercar
      const base = zoom <= 13 ? 18 : zoom === 14 ? 20 : zoom === 15 ? 22 : 25;
      const w = isSel ? base + 10 : base;
      const h = Math.round((w * PIN_H) / PIN_W);
      const icon = L.divIcon({
        className: "",
        html: `<div style="transform:translate(-50%,-100%);width:${w}px;height:${h}px;position:relative;">${pinSvg(p.type, p.wheelchair, w, isSel)}` +
          ((zoom >= 16 || isSel) ? `<span style="position:absolute;left:${w - 2}px;top:${Math.round(h * 0.2)}px;color:${oscuro(TYPE_COLORS[p.type] || "#5F6368", 0.8)};${ESTILO_NOMBRE}">${escapeH(p.name)}</span>` : "") + `</div>`,
        iconSize: [w, h],
        iconAnchor: [0, 0],
      });
      const size = h;
      const avg = avgRating(p.id);
      // `title`: nombre accesible del pin para teclado y lectores de pantalla (Leaflet lo hace enfocable con Tab).
      const a11yName = `${p.name}, ${TYPE_LABELS[p.type] || p.type}, ${ACCESS_LABELS[p.wheelchair ?? null]}`;
      const marker = L.marker([p.lat, p.lng], { icon, title: a11yName, riseOnHover: true }).addTo(layerRef.current);
      marker.bindTooltip(`${p.name}${avg ? ` · ★${avg}` : ""}`, { direction: "top", offset: [0, -size] });
      marker.on("click", () => onSelectRef.current(p));
      marker.on("keypress", (e) => { const k = e.originalEvent && e.originalEvent.key; if (k === "Enter" || k === " ") onSelectRef.current(p); });
    });
    return () => map.off("zoomend", mostrar);
  }, [places, selected, ready, avgRating, zoom]);

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
      const size = rampSize(Math.round(map.getZoom()));
      let n = 0;
      pts.forEach(([lat, lng, srcTag]) => {
        if (b && !b.contains([lat, lng])) return;
        n++;
        const municipal = srcTag === "m";
        new RampMarker([lat, lng], { radius: size / 2, stroke: false, fillOpacity: 1 })
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
    // Al hacer zoom solo cambia el tamaño del ícono (no se vuelven a crear las rampas: así no se cierra
    // el cartelito con la dirección cuando el mapa se corre para mostrarlo).
    const resize = () => {
      const size = rampSize(Math.round(map.getZoom()));
      if (rampsLayerRef.current) rampsLayerRef.current.eachLayer((l) => l.setRadius(size / 2));
    };
    // Con muchísimas rampas (más de RAMPS_MANY) se dibujan solo las que están a la vista, y eso sí
    // necesita rehacerse cada vez que se mueve el mapa. Con las de hoy (~1.000) se dibujan una sola vez.
    const many = (rampsRef.current || []).length > RAMPS_MANY;
    const onMove = many ? draw : resize;
    draw();
    map.on(many ? "moveend" : "zoomend", onMove);
    // si el ícono todavía no terminó de cargar, se vuelve a dibujar cuando esté listo
    const redibujar = () => { if (rampsLayerRef.current) rampsLayerRef.current.eachLayer((l) => l.redraw()); };
    if (rampImg && !rampImg.complete) rampImg.onload = redibujar;
    return () => { map.off(many ? "moveend" : "zoomend", onMove); if (rampImg) rampImg.onload = null; };
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
        className={`absolute flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 hover:bg-white text-sky-700 border border-sky-400 backdrop-blur shadow-lg transition-all duration-300 ${sidebarOpen ? "z-[1060] bottom-20 sm:bottom-3 left-[calc(86%_+_0.5rem)] sm:left-[21rem]" : "z-[900] bottom-7 sm:bottom-3 left-3"}`}>
        <RotateCcw size={16} />
      </button>
    </>
  );
}
