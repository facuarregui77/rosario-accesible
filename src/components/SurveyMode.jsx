import { useState, useEffect, useMemo, useRef } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { Accessibility, X, CheckCircle2, Save, ChevronLeft, ClipboardList, LocateFixed, ChevronRight } from "lucide-react";
import { CRITERIA, TYPE_LABELS, TYPE_EMOJI, hasAnyData } from "../data/constants";
import { distanceM, fmtDist } from "../lib/geo";
import { AccessChip } from "./AccessChip";

// Modo relevamiento (solo admin): geolocaliza, ordena los lugares por cercanía y permite
// cargar la accesibilidad con pocos toques, parado frente al lugar.
export default function SurveyMode({ places, onSaveAccess, onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);
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
    ? (v === "si" ? "bg-emerald-600 text-white border-emerald-600" : v === "parcial" ? "bg-amber-600 text-white border-amber-600" : v === "no" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-600 text-white border-slate-600")
    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50";

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Modo relevamiento" className="fixed inset-0 z-[1300] bg-white flex flex-col outline-none">
      {/* Encabezado */}
      <div className="shrink-0 bg-sky-100 border-b border-sky-300 px-4 py-3 flex items-center gap-3">
        <div className="p-1.5 rounded-lg bg-sky-600 text-white"><ClipboardList size={18} /></div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-800 leading-tight">Modo relevamiento</h2>
          <p className="text-xs text-slate-500">{done} de {places.length} lugares con datos</p>
        </div>
        <button onClick={onClose} aria-label="Cerrar relevamiento" className="p-2 rounded-lg hover:bg-sky-200 text-slate-600"><X size={20} /></button>
      </div>

      {!active ? (
        // ---- Lista de lugares por cercanía ----
        <div className="flex-1 overflow-y-auto scroll-orange">
          <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <LocateFixed size={14} className={geo === "ok" ? "text-emerald-500" : "text-slate-500"} />
              {geo === "loading" && "Buscando tu ubicación…"}
              {geo === "ok" && "Ordenado por cercanía a vos"}
              {geo === "denied" && "Sin permiso de ubicación · orden alfabético"}
              {(geo === "error" || geo === "unavailable") && "Ubicación no disponible · orden alfabético"}
              {(geo === "denied" || geo === "error") && (
                <button onClick={askLocation} className="underline text-sky-600 ml-1">reintentar</button>
              )}
            </div>
            <button onClick={() => setOnlyMissing((v) => !v)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition ${onlyMissing ? "bg-orange-600 text-white border-orange-600" : "bg-white text-slate-600 border-slate-300"}`}>
              {onlyMissing ? "Solo sin datos" : "Todos"}
            </button>
          </div>

          {list.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-slate-500 italic">
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
                  <span className="text-xs text-slate-500">{TYPE_LABELS[p.type]}</span>
                  {d != null && <span className="text-xs font-medium text-sky-600">· {fmtDist(d)}</span>}
                  {hasAnyData(p) ? <AccessChip wheelchair={p.wheelchair} /> : <span className="text-xs text-orange-700 italic">a relevar</span>}
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
            <span className="text-xs text-slate-500">{TYPE_LABELS[active.type]}</span>
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
                            className={`w-10 py-1.5 rounded-lg text-sm font-medium border transition ${val === v ? (v === "si" ? "bg-emerald-600 text-white border-emerald-600" : v === "no" ? "bg-rose-600 text-white border-rose-600" : "bg-slate-600 text-white border-slate-600") : "bg-white text-slate-500 border-slate-200 hover:bg-slate-100"}`}>
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold transition">
              <Save size={16} /> {saving ? "Guardando…" : "Guardar y volver"}
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" aria-live="polite" className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1400] bg-emerald-600 text-white text-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
