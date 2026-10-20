// Panel "Cómo llego" (al estilo Google Maps): una pestaña por medio de transporte con su tiempo, la
// distancia, las indicaciones paso a paso y el enlace para seguir el viaje en Google Maps.
import { useState } from "react";
import { Accessibility, Footprints, Bike, Car, Bus, X, MapPin, LocateFixed, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";
import { MODOS, enlaceGoogle, fmtMin, fmtKm } from "../lib/routing";

const ICONOS = { silla: Accessibility, pie: Footprints, bici: Bike, auto: Car, colectivo: Bus };
const NOTAS = {
  silla: "Ruta sugerida para silla de ruedas: evita escalones cuando hay datos. Verificá el terreno.",
  pie: "Camino a pie por veredas y sendas.",
  bici: "Prioriza ciclovías y calles tranquilas.",
  auto: "Tiempo estimado sin tránsito en tiempo real.",
};

export default function RoutePanel({ route, onModo, onCerrar, onElegirOrigen, onMiUbicacion }) {
  const [verPasos, setVerPasos] = useState(false);
  const modo = MODOS.find((m) => m.id === route.modo) || MODOS[0];
  const r = route.res && route.res[modo.id];
  const google = enlaceGoogle(route.origin, route.to, modo.id);

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1055] w-[94%] max-w-md" role="region" aria-label="Cómo llego">
      <div className="rounded-2xl bg-white/95 border border-sky-300 shadow-2xl backdrop-blur overflow-hidden">
        {/* Encabezado: a dónde y desde dónde */}
        <div className="flex items-start gap-2 px-3 pt-2.5 pb-2 bg-sky-50 border-b border-sky-200">
          <div className="flex-1 min-w-0 text-xs text-slate-700 leading-snug">
            <div className="text-sm font-bold text-sky-900 truncate">Cómo llegar a {route.to?.name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Desde: <b>{route.eligiendo ? "tocá el mapa…" : route.origenTexto || "—"}</b></span>
              {!route.eligiendo && (
                <button onClick={onElegirOrigen} className="text-sky-700 underline font-medium">elegir en el mapa</button>
              )}
              {route.origenTexto && route.origenTexto !== "Tu ubicación" && !route.eligiendo && (
                <button onClick={onMiUbicacion} className="inline-flex items-center gap-0.5 text-sky-700 underline font-medium"><LocateFixed size={11} />mi ubicación</button>
              )}
            </div>
          </div>
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
                  <button key={m.id} role="tab" aria-selected={activo} onClick={() => { onModo(m.id); setVerPasos(false); }}
                    title={m.nombre}
                    className={`flex-1 min-w-0 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-xl text-[11px] font-semibold transition ${activo ? "bg-sky-800 text-white shadow" : "text-slate-600 hover:bg-sky-50"}`}>
                    <Icono size={18} aria-hidden="true" />
                    <span className="leading-none whitespace-nowrap">
                      {m.id === "colectivo" ? "Ver"
                        : !x || x.loading ? <Loader2 size={11} className="animate-spin inline" aria-label="calculando" />
                        : x.error ? "—" : fmtMin(x.duration)}
                    </span>
                    <span className="sr-only">{m.nombre}</span>
                  </button>
                );
              })}
            </div>

            {/* Detalle del medio elegido */}
            <div className="px-3 pt-2 pb-3 text-xs text-slate-700">
              {modo.id === "colectivo" ? (
                <>
                  <p className="leading-snug">Los recorridos de los colectivos de Rosario no están publicados como datos abiertos, así que este viaje lo arma <b>Google Maps</b>: qué línea tomar, dónde subir y bajar, y cuánto tarda.</p>
                  <a href={google} target="_blank" rel="noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold shadow-sm">
                    <Bus size={16} /> Ver el viaje en colectivo <ExternalLink size={13} />
                  </a>
                </>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
