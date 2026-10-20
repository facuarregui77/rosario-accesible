// Panel "Cómo llego" (al estilo Google Maps): una pestaña por medio de transporte con su tiempo, la
// distancia, las indicaciones paso a paso y el enlace para seguir el viaje en Google Maps.
import { useState, useEffect, useRef } from "react";
import { Accessibility, Footprints, Bike, Car, Bus, X, GripHorizontal, MapPin, LocateFixed, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";
import { MODOS, enlaceGoogle, fmtMin, fmtKm } from "../lib/routing";

const ICONOS = { silla: Accessibility, pie: Footprints, bici: Bike, auto: Car, colectivo: Bus };
const NOTAS = {
  silla: "Ruta sugerida para silla de ruedas: evita escalones cuando hay datos. Verificá el terreno.",
  pie: "Camino a pie por veredas y sendas.",
  bici: "Prioriza ciclovías y calles tranquilas.",
  auto: "Tiempo estimado sin tránsito en tiempo real.",
};

export default function RoutePanel({ route, onModo, onCerrar, onElegirOrigen, onMiUbicacion, onOpcion, onAlto }) {
  const [verPasos, setVerPasos] = useState(false);
  const [chico, setChico] = useState(false);   // panel achicado: solo el encabezado y las pestañas, para ver el mapa
  // Avisa cuánto ocupa el panel, para que el mapa encuadre el recorrido en la parte que queda libre
  const caja = useRef(null);
  useEffect(() => {
    if (!caja.current || !onAlto || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { const r = caja.current.getBoundingClientRect(); onAlto({ alto: Math.round(r.height), ancho: Math.round(r.width) }); });
    ro.observe(caja.current);
    return () => { ro.disconnect(); onAlto(null); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Se puede arrastrar desde el encabezado (mouse o dedo) para ver lo que tapa
  const [corrido, setCorrido] = useState({ x: 0, y: 0 });
  const arrastre = useRef(null);
  const empezar = (e) => {
    if (e.target.closest("button, a")) return;   // los botones del encabezado siguen funcionando
    arrastre.current = { x0: e.clientX - corrido.x, y0: e.clientY - corrido.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const mover = (e) => {
    if (!arrastre.current || !caja.current) return;
    const marco = caja.current.parentElement.offsetParent;   // el contenedor del mapa
    let x = e.clientX - arrastre.current.x0, y = e.clientY - arrastre.current.y0;
    if (marco) {   // que siempre quede al menos el encabezado a la vista
      const m = marco.getBoundingClientRect(), r = caja.current.getBoundingClientRect();
      const bx = r.left - corrido.x, by = r.top - corrido.y;   // dónde estaría sin correrlo
      x = Math.min(Math.max(x, m.left - bx - r.width + 80), m.right - bx - 80);
      y = Math.min(Math.max(y, m.top - by), m.bottom - by - 60);
    }
    setCorrido({ x, y });
  };
  const soltar = () => { arrastre.current = null; };
  const modo = MODOS.find((m) => m.id === route.modo) || MODOS[0];
  const r = route.res && route.res[modo.id];
  const google = enlaceGoogle(route.origin, route.to, modo.id);

  return (
    // En celular arriba y centrado; en la computadora a la izquierda, como en Google Maps
    <div className="absolute top-3 left-1/2 -translate-x-1/2 sm:left-3 sm:translate-x-0 z-[1055] w-[94%] max-w-md sm:w-[390px]" role="region" aria-label="Cómo llego">
      <div ref={caja} style={{ transform: `translate(${corrido.x}px, ${corrido.y}px)` }}
        className="rounded-2xl bg-white/95 border border-sky-300 shadow-2xl backdrop-blur overflow-hidden">
        {/* Encabezado: a dónde y desde dónde */}
        <div onPointerDown={empezar} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}
          title="Arrastrá para mover el panel" style={{ touchAction: "none" }}
          className="relative flex items-start gap-2 px-3 pt-3 pb-2 bg-sky-50 border-b border-sky-200 cursor-move select-none">
          <GripHorizontal size={16} aria-hidden="true" className="absolute top-0.5 left-1/2 -translate-x-1/2 text-sky-300" />
          <div className="flex-1 min-w-0 text-xs text-slate-700 leading-snug">
            <div className="text-sm font-bold text-sky-900 truncate">Cómo llegar a {route.to?.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Desde: <b>{route.eligiendo ? "tocá el mapa…" : route.origenTexto || "—"}</b></span>
              {!route.eligiendo && (
                <button onClick={onElegirOrigen} title="Marcar en el mapa otro punto de partida" className="text-sky-700 underline font-medium">cambiar</button>
              )}
              {route.origenTexto && route.origenTexto !== "Tu ubicación" && !route.eligiendo && (
                <button onClick={onMiUbicacion} className="inline-flex items-center gap-0.5 text-sky-700 underline font-medium"><LocateFixed size={11} />mi ubicación</button>
              )}
            </div>
          </div>
          <button onClick={() => setChico((v) => !v)} aria-expanded={!chico} aria-label={chico ? "Mostrar el detalle" : "Achicar para ver el mapa"} title={chico ? "Mostrar el detalle" : "Achicar para ver el mapa"}
            className="shrink-0 p-1 rounded-lg hover:bg-white text-slate-600">{chico ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</button>
          <button onClick={onCerrar} aria-label="Cerrar Cómo llego" className="shrink-0 p-1 rounded-lg hover:bg-white text-slate-600"><X size={18} /></button>
        </div>

        {route.error ? (
          <div className="px-3 py-3 text-xs text-rose-700">{route.error}</div>
        ) : route.eligiendo ? (
          <div className="px-3 py-3 text-xs text-slate-700 flex items-center gap-2"><MapPin size={15} className="text-sky-700" />Tocá el mapa en el punto desde donde salís.</div>
        ) : (
          <>
            {/* Pestañas: un medio por botón, con su tiempo */}
            <div className="flex gap-1 px-2 pt-2" role="tablist" aria-label="Medio de transporte">
              {MODOS.map((m) => {
                const Icono = ICONOS[m.id];
                const x = route.res && route.res[m.id];
                const activo = m.id === modo.id;
                return (
                  <button key={m.id} role="tab" aria-selected={activo} onClick={() => { onModo(m.id); setVerPasos(false); setChico(false); }}
                    title={m.nombre}
                    className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl text-[11px] font-semibold transition ${activo ? "bg-sky-800 text-white shadow" : "text-slate-600 hover:bg-sky-50"}`}>
                    <Icono size={18} aria-hidden="true" />
                    <span className="leading-none whitespace-nowrap">
                      {!x || x.loading ? <Loader2 size={11} className="animate-spin inline" aria-label="calculando" />
                        : x.error ? "—" : fmtMin(m.id === "colectivo" ? x.opciones[0].total : x.duration)}
                    </span>
                    <span className="sr-only">{m.nombre}</span>
                  </button>
                );
              })}
            </div>

            {/* Detalle del medio elegido (se oculta con el panel achicado) */}
            {chico ? <div className="h-2" /> : <div className="px-3 pt-2 pb-3 text-xs text-slate-700 max-h-[52vh] overflow-y-auto">
              {modo.id === "colectivo" ? (
                <Colectivo r={r} google={google} onOpcion={onOpcion} verPasos={verPasos} setVerPasos={setVerPasos} />
              ) : !r || r.loading ? (
                <p className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Calculando {modo.nombre.toLowerCase()}…</p>
              ) : r.error ? (
                <p className="text-rose-700">{r.error}</p>
              ) : (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-sky-900">{fmtMin(r.duration)}</span>
                    <span className="text-slate-600">{fmtKm(r.distance)}</span>
                    <span className="ml-auto text-[11px] text-slate-500">{modo.nombre}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug mt-0.5">{NOTAS[modo.id]}</p>
                  <div className="mt-2 flex gap-2">
                    {r.pasos && r.pasos.length > 0 && (
                      <button onClick={() => setVerPasos((v) => !v)} aria-expanded={verPasos}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-sky-800 font-semibold">
                        {verPasos ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {verPasos ? "Ocultar" : "Ver"} indicaciones ({r.pasos.length})
                      </button>
                    )}
                    <a href={google} target="_blank" rel="noreferrer" title="Seguir este viaje en Google Maps"
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-sky-800 font-semibold whitespace-nowrap">
                      <ExternalLink size={13} /> Abrir en Google Maps
                    </a>
                  </div>
                  {verPasos && (
                    <ol className="mt-2 max-h-[34vh] overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white">
                      {r.pasos.map((p, i) => (
                        <li key={i} className="flex gap-2 px-2.5 py-1.5">
                          <span className="shrink-0 w-5 text-right font-bold text-sky-700">{i + 1}.</span>
                          <span className="flex-1">{p.texto}</span>
                          {p.distancia > 0 && <span className="shrink-0 text-slate-500">{fmtKm(p.distancia)}</span>}
                        </li>
                      ))}
                    </ol>
                  )}
                </>
              )}
            </div>}
          </>
        )}
      </div>
    </div>
  );
}

// Pestaña Colectivo: hasta 3 opciones (línea directa o con un trasbordo) y los pasos de la elegida
function Colectivo({ r, google, onOpcion, verPasos, setVerPasos }) {
  const botonGoogle = (
    <a href={google} target="_blank" rel="noreferrer" title="Ver horarios en Google Maps"
      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-sky-800 font-semibold whitespace-nowrap">
      <ExternalLink size={13} /> Horarios en Google
    </a>
  );
  if (!r || r.loading) return <p className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Buscando líneas de colectivo…</p>;
  if (r.error) return <><p className="text-rose-700">{r.error}</p><div className="mt-2 flex">{botonGoogle}</div></>;
  const o = r.opciones[r.elegida || 0];
  const Chip = ({ t }) => <span className="inline-block px-1.5 py-0.5 rounded-md bg-sky-900 text-white text-[11px] font-bold leading-none">{t}</span>;
  return (
    <>
      {/* Opciones */}
      <div className="flex flex-col gap-1">
        {r.opciones.map((op, i) => (
          <button key={i} onClick={() => onOpcion(i)} aria-pressed={i === (r.elegida || 0)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border text-left ${i === (r.elegida || 0) ? "border-sky-700 bg-sky-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
            <span className="w-14 shrink-0 text-sm font-extrabold text-sky-900">{fmtMin(op.total)}</span>
            <span className="flex items-center gap-1 flex-wrap">
              {op.lineas.map((l, k) => <span key={k} className="flex items-center gap-1">{k > 0 && <span className="text-slate-400">›</span>}<Bus size={12} className="text-slate-500" /><Chip t={l} /></span>)}
            </span>
            <span className="ml-auto text-[11px] text-slate-500 whitespace-nowrap">{fmtKm(op.caminaM)} a pie</span>
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={() => setVerPasos((v) => !v)} aria-expanded={verPasos}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-sky-300 bg-white hover:bg-sky-50 text-sky-800 font-semibold">
          {verPasos ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {verPasos ? "Ocultar pasos" : "Ver pasos"}
        </button>
        {botonGoogle}
      </div>
      {/* Pasos de la opción elegida */}
      {verPasos && <>
      <ol className="mt-2 space-y-1.5">
        {o.tramos.map((t, i) => (
          <li key={i} className="flex gap-2 leading-snug">
            <span className="shrink-0 mt-0.5 text-slate-500">
              {t.tipo === "pie" ? <Footprints size={14} /> : t.tipo === "espera" ? <Loader2 size={14} /> : <Bus size={14} className="text-sky-800" />}
            </span>
            <span>
              {t.tipo === "pie" && (t.m < 30 ? <>Estás en {t.hacia}.</> : <>Caminá <b>{fmtKm(t.m)}</b> (~{fmtMin(t.seg)}) {t.trasbordo ? "para combinar en" : "hasta"} {t.hacia === "el destino" ? <b>el destino</b> : <b>{t.hacia}</b>}.</>)}
              {t.tipo === "espera" && <>Esperá el colectivo (unos {fmtMin(t.seg)}, estimado).</>}
              {t.tipo === "colectivo" && <>Tomá el <Chip t={t.ref} /> {t.hacia ? <>hacia {t.hacia}</> : null} y bajá en <b>{t.baja}</b> — {t.paradas} paradas, ~{fmtMin(t.seg)}.</>}
            </span>
          </li>
        ))}
      </ol>
      {r.aPie < o.total && <p className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">Caminando tardás menos: unos {fmtMin(r.aPie)}.</p>}
      <p className="mt-2 text-[11px] text-slate-500 leading-snug">Tiempo estimado con los recorridos de OpenStreetMap: velocidad promedio del colectivo y una espera típica. No incluye horarios ni demoras en tiempo real.</p>
      </>}
    </>
  );
}
