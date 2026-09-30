import { useState } from "react";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { CRITERIA } from "../data/constants";

// Mini-formulario para que el público SUGIERA datos de accesibilidad (entran como propuesta pendiente).
export default function SuggestionForm({ onSubmit }) {
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
    <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-sky-50 to-orange-50 border-2 border-sky-300 shadow-sm">
      <p className="text-sm font-bold text-sky-800 flex items-center gap-2"><Lightbulb size={16} className="text-amber-500" /> ¿Conocés este lugar? ¡Ayudanos! 💙</p>
      <p className="text-xs text-slate-600 mb-2.5">Sumá lo que sepas de su accesibilidad. Completá solo lo que conozcas; el equipo lo revisa antes de publicarlo.</p>

      <div className="mb-2">
        <span className="text-xs text-slate-600">Acceso en silla de ruedas</span>
        <div className="flex gap-1.5 mt-1" role="group" aria-label="Acceso en silla de ruedas">
          {WOPTS.map(([v, l]) => (
            <button key={v} onClick={() => setSugg((s) => ({ ...s, wheelchair: s.wheelchair === v ? null : v }))}
              className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition ${sugg.wheelchair === v ? (v === "si" ? "bg-emerald-600 text-white border-emerald-600" : v === "parcial" ? "bg-amber-600 text-white border-amber-600" : "bg-rose-600 text-white border-rose-600") : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"}`}>
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
              <span className="flex items-center gap-1.5 text-xs text-slate-600"><Icon size={14} className="text-slate-500" /> {c.label}</span>
              <div className="flex gap-1">
                {[["si", "Sí"], ["no", "No"], [null, "—"]].map(([v, l]) => (
                  <button key={l} onClick={() => setSugg((s) => ({ ...s, [c.key]: v }))}
                    className={`w-8 py-0.5 rounded text-xs font-medium border transition ${sugg[c.key] === v ? (v === "si" ? "bg-emerald-600 text-white border-emerald-600" : v === "no" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-600 text-white border-slate-600") : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2}
        placeholder="Comentario (opcional): contanos qué viste…" aria-label="Comentario (opcional)" maxLength={600}
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 resize-none mb-2" />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre (opcional)" aria-label="Tu nombre (opcional)" maxLength={60}
        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-sky-400 mb-2" />

      <button onClick={submit} disabled={!anyData}
        className="w-full px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-600 disabled:opacity-50 text-white text-sm font-medium transition">
        Enviar sugerencia
      </button>
    </div>
  );
}
