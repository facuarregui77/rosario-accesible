import { useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { X, CheckCircle2, RotateCcw, Lightbulb } from "lucide-react";
import { CRITERIA } from "../data/constants";

// Panel de moderación (solo admin): aprobar / rechazar las sugerencias del público.
export default function SuggestionsPanel({ suggestions, places, onApprove, onReject, onClose, onRefresh }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);
  const nameOf = (id) => places.find((p) => p.id === id)?.name || id;
  const chip = (label, v) => (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${v === "si" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : v === "parcial" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-rose-50 border-rose-200 text-rose-700"}`}>
      {label}: {v === "si" ? "Sí" : v === "parcial" ? "Parcial" : "No"}
    </span>
  );
  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sugerencias pendientes"
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl rounded-t-2xl border border-sky-200 shadow-2xl scroll-orange">
        <div className="sticky top-0 bg-sky-50 p-4 border-b border-sky-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Lightbulb size={18} className="text-amber-500" /> Sugerencias pendientes ({suggestions.length})</h2>
          <div className="flex items-center gap-1">
            <button onClick={onRefresh} title="Actualizar" aria-label="Actualizar" className="p-1.5 rounded-lg hover:bg-sky-100 text-slate-500"><RotateCcw size={16} /></button>
            <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {suggestions.length === 0 && <p className="text-center text-sm text-slate-500 italic py-8">No hay sugerencias pendientes. 🎉</p>}
          {suggestions.map((s) => (
            <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div className="font-semibold text-sm text-slate-800">{nameOf(s.place_id)}</div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {s.wheelchair && chip("Silla de ruedas", s.wheelchair)}
                {CRITERIA.filter((c) => s[c.key]).map((c) => chip(c.label, s[c.key]))}
              </div>
              {s.comment && <p className="text-xs text-slate-600 mt-2 italic">“{s.comment}”</p>}
              <div className="flex items-center justify-between mt-2.5">
                <span className="text-xs text-slate-500">{s.name ? `por ${s.name}` : "anónimo"}</span>
                <div className="flex gap-2">
                  <button onClick={() => onReject(s)} className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100 transition">Rechazar</button>
                  <button onClick={() => onApprove(s)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-600 text-white text-xs font-medium transition"><CheckCircle2 size={14} /> Aprobar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
