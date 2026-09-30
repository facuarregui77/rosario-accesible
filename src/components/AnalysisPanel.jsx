import { useRef, useState, useEffect } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { X, BarChart3, RotateCcw } from "lucide-react";
import * as db from "../db";

export default function AnalysisPanel({ stats, onClose, onReset, hasOverrides }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);
  // Errores que la app registró en los celulares de la gente (últimos 20)
  const [errors, setErrors] = useState([]);
  useEffect(() => { db.loadErrors(20).then(setErrors); }, []);
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Análisis de accesibilidad" className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-sky-200 shadow-2xl">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400 rounded-t-2xl" />
        <div className="sticky top-0 bg-white p-5 border-b border-sky-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BarChart3 size={20} className="text-sky-500" /> Análisis de Accesibilidad</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="p-5">
          {/* Donut: cobertura de datos verificados de acceso */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <Donut pct={stats.pctConDato} />
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-600" /> Acceso verificado: <b>{stats.accesible}</b></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-600" /> Acceso parcial: <b>{stats.parcial}</b></div>
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
              <div className="text-3xl font-bold text-slate-500">{stats.sinDato}</div>
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

          <p className="text-xs text-slate-500 mt-5 leading-relaxed border-t border-slate-200 pt-3">
            <b>Sobre los datos:</b> los lugares y sus ubicaciones son reales. Los datos de accesibilidad provienen de
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline"> OpenStreetMap</a> (ODbL),
            son verificables (cada lugar con dato enlaza a su objeto en OSM) y hoy solo cubren el <b>acceso en silla de ruedas</b> de
            unos pocos lugares. El resto figura como <b>"sin datos / a relevar"</b>: no se inventa nada. Podés cargar datos reales
            vos mismo desde la ficha de cada lugar (relevamiento manual); {db.cloud ? "se guardan en la nube y los ve toda la comunidad." : "se guardan en este navegador."}
          </p>

          {db.cloud && (
            <div className="mt-4 border-t border-slate-200 pt-3">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Errores registrados en la app</h3>
              {errors.length === 0 ? (
                <p className="text-xs text-slate-600">Ninguno registrado. 🎉 (Si a alguien se le rompe algo, aparece acá.)</p>
              ) : (
                <ul className="space-y-1 max-h-40 overflow-y-auto text-[11px] text-slate-700">
                  {errors.map((e) => (
                    <li key={e.id} className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                      <span className="text-slate-500">{new Date(e.created_at).toLocaleString("es-AR")}</span> · <b>{e.message}</b>
                      {e.agent && <span className="block text-slate-500 truncate">{e.agent}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
