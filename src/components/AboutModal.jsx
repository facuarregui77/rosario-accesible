import { useRef } from "react";
import { Info, X, Accessibility, Lightbulb, MessageSquare, Contrast, Github, Mail, Share2, MessageCircle } from "lucide-react";
import { useFocusTrap } from "../hooks/useFocusTrap";
import { CONTACT_EMAIL, CONTACT_WHATSAPP, REPO_URL } from "../data/constants";

// "Acerca de": qué es el proyecto, de dónde salen los datos, cómo colaborar y ajustes de accesibilidad.
export default function AboutModal({ onClose, stats, highContrast, onToggleContrast }) {
  const ref = useRef(null);
  useFocusTrap(ref);
  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    try {
      if (navigator.share) await navigator.share({ title: "Rosario Access Map", text: "Mapa colaborativo de accesibilidad de Rosario", url });
      else await navigator.clipboard.writeText(url);
    } catch (e) { /* cancelado */ }
  };
  return (
    <div className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="about-title"
        className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white sm:rounded-2xl rounded-t-2xl border border-sky-200 shadow-2xl outline-none">
        <div className="h-1.5 bg-gradient-to-r from-blue-800 via-sky-400 to-orange-400 sm:rounded-t-2xl rounded-t-2xl" />
        <div className="sticky top-0 bg-sky-50 p-5 border-b border-sky-200 flex items-center justify-between">
          <h2 id="about-title" className="text-lg font-bold text-slate-900 flex items-center gap-2"><Info size={20} className="text-sky-700" /> Acerca de Rosario Access Map</h2>
          <button onClick={onClose} aria-label="Cerrar" className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-5 text-sm text-slate-700 leading-relaxed">
          <section>
            <p>
              Un mapa <b>colaborativo y gratuito</b> que muestra qué tan accesibles son los lugares de Rosario para
              personas con discapacidad o movilidad reducida: bares, restaurantes, escuelas, clubes, hospitales,
              trámites, parques y más. También muestra las <b>rampas y cruces accesibles</b> de la vereda.
            </p>
            {stats && (
              <p className="mt-2 text-xs text-slate-600">
                Hoy: <b>{stats.total}</b> lugares cargados · <b>{stats.conDato}</b> con datos verificados de accesibilidad · <b>{stats.sinDato}</b> todavía por relevar.
              </p>
            )}
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Accessibility size={16} className="text-sky-700" /> De dónde salen los datos</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>Nada se inventa.</b> Si un lugar no tiene información comprobada, dice "sin datos".</li>
              <li>Los datos de acceso vienen de <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline text-sky-700">OpenStreetMap</a> (cada uno enlaza a su fuente), del relevamiento en la calle del equipo y de las sugerencias del público, que se revisan antes de publicarse.</li>
              <li>Las rampas de la vereda salen de OpenStreetMap y de los datos abiertos de la Municipalidad de Rosario.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Lightbulb size={16} className="text-amber-600" /> Cómo colaborar</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Abrí la ficha de un lugar y tocá <b>"¿Conocés este lugar? ¡Ayudanos!"</b> para contarnos qué viste: rampa, baño adaptado, ascensor…</li>
              <li>Dejá una <b>opinión</b> <MessageSquare size={12} className="inline" /> con tu experiencia real en el lugar.</li>
              <li><b>Compartí el mapa</b>: cuanta más gente lo use, más completo queda.</li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={share} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"><Share2 size={13} /> Compartir el mapa</button>
              {CONTACT_EMAIL && <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 text-xs font-medium"><Mail size={13} /> Escribinos</a>}
              {CONTACT_WHATSAPP && (
                <a href={`https://wa.me/${CONTACT_WHATSAPP.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, te escribo por Rosario Access Map.")}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium">
                  <MessageCircle size={13} /> WhatsApp
                </a>
              )}
              {REPO_URL && <a href={REPO_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium"><Github size={13} /> Código abierto</a>}
            </div>
          </section>

          <section>
            <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2"><Contrast size={16} className="text-slate-700" /> Ajustes de accesibilidad</h3>
            <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer">
              <span>
                <span className="font-medium text-slate-800">Alto contraste</span>
                <span className="block text-xs text-slate-600">Textos más oscuros y bordes más marcados.</span>
              </span>
              <input type="checkbox" checked={highContrast} onChange={onToggleContrast} className="w-5 h-5 accent-sky-700" />
            </label>
            <p className="text-xs text-slate-600 mt-2">
              La app se puede recorrer con el teclado (Tab, Enter y Escape), funciona con lectores de pantalla,
              respeta el tamaño de letra y la opción "reducir animaciones" de tu celular o computadora, y se puede instalar como app.
            </p>
          </section>

          <p className="text-xs text-slate-600 border-t border-slate-200 pt-3">
            Proyecto sin fines de lucro con fines educativos y comunitarios · Rosario, Santa Fe, Argentina.
            Mapa base © Esri · Datos © colaboradores de OpenStreetMap (ODbL).
          </p>
        </div>
      </div>
    </div>
  );
}
