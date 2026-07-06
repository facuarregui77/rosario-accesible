// Aviso de "versión nueva disponible" para la PWA.
// Detecta cuando hay una actualización publicada y muestra un cartelito para recargar.
// Estrategia "prompt": no interrumpe; el usuario decide cuándo actualizar.
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

// Cada cuánto el navegador revisa si hay una versión nueva (aunque la app quede abierta).
const CHECK_EVERY_MS = 60 * 60 * 1000; // 1 hora

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Chequeo periódico de actualizaciones.
      setInterval(() => { registration.update(); }, CHECK_EVERY_MS);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[2000] w-[92%] max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl bg-white border border-sky-300 shadow-2xl px-4 py-3">
        <div className="shrink-0 p-1.5 rounded-lg bg-sky-100 text-sky-600">
          <RefreshCw size={16} />
        </div>
        <p className="flex-1 text-sm text-slate-700 leading-snug">
          Hay una <span className="font-semibold text-sky-700">versión nueva</span> de la app.
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition">
          Actualizar
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          aria-label="Cerrar aviso"
          className="shrink-0 text-slate-400 hover:text-slate-600 transition">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
