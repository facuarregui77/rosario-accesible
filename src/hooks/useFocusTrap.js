import { useEffect } from "react";

// Accesibilidad de los diálogos (fichas, paneles, login):
//  - al abrir, el foco entra al diálogo (así el lector de pantalla lo anuncia);
//  - Tab / Shift+Tab giran DENTRO del diálogo (no se escapan al mapa de atrás);
//  - al cerrar, el foco vuelve al botón que lo abrió.
// Uso: const ref = useRef(null); useFocusTrap(ref); <div ref={ref} role="dialog" tabIndex={-1}>…
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const opener = document.activeElement;
    // Pequeña demora: deja que el diálogo termine de pintarse antes de enfocarlo.
    const t = setTimeout(() => el.focus({ preventScroll: true }), 30);
    const onKey = (e) => {
      if (e.key !== "Tab") return;
      const items = [...el.querySelectorAll(FOCUSABLE)].filter((i) => i.tabIndex >= 0 && i.offsetParent !== null);
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    el.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      el.removeEventListener("keydown", onKey);
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [ref, active]);
}
