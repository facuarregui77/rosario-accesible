import { useRef, useState } from "react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { X, Lock } from "lucide-react";
import * as db from "../db";

export default function LoginModal({ onClose }) {
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    if (!email || !password) return;
    setErr(""); setLoading(true);
    const { error } = await db.signIn(email.trim(), password);
    setLoading(false);
    if (error) setErr("No se pudo iniciar sesión. Revisá el email y la contraseña.");
    else onClose();
  };
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div ref={dialogRef} tabIndex={-1} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Acceso de administrador" className="w-full max-w-sm bg-white rounded-2xl border border-sky-200 shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-sky-400 via-sky-300 to-orange-400" />
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><Lock size={18} className="text-sky-600" /> Acceso de administrador</h2>
            <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
          </div>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" aria-label="Email" autoComplete="email"
            className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-600" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Contraseña" aria-label="Contraseña" autoComplete="current-password"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full mb-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 outline-none focus:border-sky-600" />
          {err && <p className="text-xs text-rose-600 mb-2">{err}</p>}
          <button onClick={submit} disabled={loading || !email || !password}
            className="w-full py-2 rounded-lg bg-sky-600 hover:bg-sky-600 text-white disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition">
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </div>
      </div>
    </div>
  );
}
