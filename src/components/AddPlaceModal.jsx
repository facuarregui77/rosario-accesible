import { useState, useRef, useEffect } from "react";
import { MapPin, X, LocateFixed, Crosshair, Save } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { TYPE_LABELS } from "../data/constants";

// Alta de un lugar nuevo (solo admin). La ubicación se elige de tres maneras:
// "Usar mi ubicación", "Marcar en el mapa" (la ventana se esconde y el próximo clic en el mapa la completa)
// o escribiendo las coordenadas a mano.
const inRosario = (lat, lng) => lat >= -33.06 && lat <= -32.83 && lng >= -60.82 && lng <= -60.55;

export default function AddPlaceModal({ initial, picked, hidden, onPickOnMap, onSave, onClose, existingIds }) {
  const ref = useRef(null);
  useFocusTrap(ref, !hidden);
  const [name, setName] = useState(initial?.name || "");
  const [type, setType] = useState(initial?.type || "bar");
  const [lat, setLat] = useState(initial?.lat ?? "");
  const [lng, setLng] = useState(initial?.lng ?? "");
  const [geoMsg, setGeoMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Cuando el usuario marca un punto en el mapa, se completan las coordenadas.
  useEffect(() => { if (picked) { setLat(picked.lat.toFixed(6)); setLng(picked.lng.toFixed(6)); } }, [picked]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setGeoMsg("Tu dispositivo no permite ubicación."); return; }
    setGeoMsg("Buscando tu ubicación…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setGeoMsg(`Listo (precisión ±${Math.round(pos.coords.accuracy)} m).`); },
      () => setGeoMsg("No pudimos obtener tu ubicación. Marcá el punto en el mapa."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Identificador a partir del nombre: "Bar El Cairo" → "bar_el_cairo" (único).
  const makeId = (n) => {
    let base = n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40) || "lugar";
    let id = base, i = 2;
    while (existingIds.has(id)) id = `${base}_${i++}`;
    return id;
  };

  const save = async () => {
    const la = parseFloat(lat), lo = parseFloat(lng);
    if (!name.trim()) { setErr("Escribí el nombre del lugar."); return; }
    if (Number.isNaN(la) || Number.isNaN(lo)) { setErr("Falta la ubicación: usá tu ubicación, marcá en el mapa o escribí las coordenadas."); return; }
    if (!inRosario(la, lo)) { setErr("Esa ubicación cae fuera de Rosario. Revisala."); return; }
    setErr(""); setSaving(true);
    const ok = await onSave({ id: makeId(name.trim()), name: name.trim(), type, lat: la, lng: lo });
    setSaving(false);
    if (ok) onClose(); else setErr("No se pudo guardar. ¿Está creada la tabla 'places' en Supabase? (ver supabase/migracion-lugares.sql)");
  };

  // Mientras se marca el punto en el mapa, la ventana se esconde pero conserva lo escrito.
  if (hidden) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="addplace-title"
        className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl rounded-t-2xl border border-sky-200 shadow-2xl outline-none">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400 sm:rounded-t-2xl rounded-t-2xl" />
        <div className="sticky top-0 bg-sky-50 p-4 border-b border-sky-200 flex items-center justify-between">
          <h2 id="addplace-title" className="text-base font-bold text-slate-900 flex items-center gap-2"><MapPin size={18} className="text-sky-700" /> Agregar un lugar</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-3 text-sm">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Nombre</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Bar El Cairo" maxLength={80}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 outline-none focus:border-sky-600" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Tipo de lugar</span>
            <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-300 bg-white outline-none focus:border-sky-600">
              {Object.entries(TYPE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <div>
            <span className="text-xs font-semibold text-slate-600">Ubicación</span>
            <div className="flex gap-2 mt-1">
              <button onClick={useMyLocation} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"><LocateFixed size={14} /> Usar mi ubicación</button>
              <button onClick={onPickOnMap} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 text-xs font-medium"><Crosshair size={14} /> Marcar en el mapa</button>
            </div>
            {geoMsg && <p className="text-xs text-slate-600 mt-1">{geoMsg}</p>}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <label className="block"><span className="text-[11px] text-slate-600">Latitud</span>
                <input value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" placeholder="-32.94" className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-sky-600" /></label>
              <label className="block"><span className="text-[11px] text-slate-600">Longitud</span>
                <input value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" placeholder="-60.64" className="mt-0.5 w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-sky-600" /></label>
            </div>
          </div>
          {err && <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">{err}</p>}
          <p className="text-[11px] text-slate-600">Después de guardarlo, abrí su ficha y cargá la accesibilidad con "Editar" (o desde "Relevar").</p>
          <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold">
            <Save size={16} /> {saving ? "Guardando…" : "Guardar lugar"}
          </button>
        </div>
      </div>
    </div>
  );
}
