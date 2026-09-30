import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { TYPE_LABELS, TYPE_COLORS, ACCESS_LABELS, accessColor } from "../data/constants";

// Leyenda del mapa: qué significa el color del pin (tipo de lugar) y el puntito del centro (accesibilidad).
// Botón flotante abajo a la derecha (arriba del zoom); se abre como una tarjetita.
export default function Legend({ showRamps }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute right-3 bottom-[7.5rem] z-[500] flex flex-col items-end gap-2">
      {open && (
        <div role="region" aria-label="Leyenda del mapa" className="w-60 max-w-[80vw] rounded-2xl bg-white/95 backdrop-blur border border-sky-300 shadow-2xl p-3 text-xs text-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800">Cómo leer el mapa</span>
            <button onClick={() => setOpen(false)} aria-label="Cerrar leyenda" className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"><X size={14} /></button>
          </div>
          <p className="font-semibold text-slate-600 mb-1">Puntito del centro = accesibilidad</p>
          <ul className="space-y-1 mb-2.5">
            {[["si"], ["parcial"], ["no"], [null]].map(([w]) => (
              <li key={String(w)} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0" style={{ background: accessColor(w) }} aria-hidden="true" />
                {ACCESS_LABELS[w]}
              </li>
            ))}
          </ul>
          <p className="font-semibold text-slate-600 mb-1">Color del pin = tipo de lugar</p>
          <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
            {Object.keys(TYPE_LABELS).map((t) => (
              <li key={t} className="flex items-center gap-1.5 min-w-0">
                <svg width="12" height="14" viewBox="0 0 24 28" aria-hidden="true" className="shrink-0"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={TYPE_COLORS[t]} stroke="white" strokeWidth="1.5" /></svg>
                <span className="truncate">{TYPE_LABELS[t]}</span>
              </li>
            ))}
          </ul>
          {showRamps && (
            <p className="mt-2.5 pt-2 border-t border-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-300 border border-sky-700 shrink-0" aria-hidden="true" /> Puntos celestes: rampas y cruces accesibles de la vereda
            </p>
          )}
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Ocultar leyenda" : "Ver leyenda del mapa"} title="Leyenda: qué significa cada color"
        className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-white/90 hover:bg-white text-sky-700 border border-sky-400 backdrop-blur shadow-lg text-xs font-semibold">
        <HelpCircle size={16} /> Leyenda
      </button>
    </div>
  );
}
