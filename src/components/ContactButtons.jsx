import { Mail } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_WHATSAPP } from "../data/constants";

// Logo de WhatsApp (el de lucide no existe; este es el glifo oficial simplificado)
export function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export const whatsappUrl = () =>
  `https://wa.me/${CONTACT_WHATSAPP.replace(/\D/g, "")}?text=${encodeURIComponent("Hola, te escribo por Rosario Access Map.")}`;

// Botones de contacto de la pantalla principal (WhatsApp + mail), dentro del bloque de botones de la barra.
//  - Celular: dos cuadraditos con ícono al final de la fila.
//  - Tablet: una fila con los dos íconos, mitad y mitad.
//  - Pantalla grande: dos botones con texto, como una fila más de la grilla (`lg:contents`).
export default function ContactButtons() {
  if (!CONTACT_EMAIL && !CONTACT_WHATSAPP) return null;
  const base = "w-10 sm:w-auto sm:flex-1 lg:w-full h-[38px] lg:px-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap border shadow-sm transition";
  return (
    <div className="flex gap-2 shrink-0 sm:w-full lg:contents">
      {CONTACT_WHATSAPP && (
        <a href={whatsappUrl()} target="_blank" rel="noreferrer" title="Escribinos por WhatsApp" aria-label="Escribinos por WhatsApp"
          className={`${base} bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-700`}>
          <WhatsAppIcon size={17} /> <span className="hidden lg:inline">WhatsApp</span>
        </a>
      )}
      {CONTACT_EMAIL && (
        <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Rosario Access Map")}`} title="Escribinos por mail" aria-label="Escribinos por mail"
          className={`${base} bg-white/90 hover:bg-white text-blue-800 border-blue-700`}>
          <Mail size={16} /> <span className="hidden lg:inline">Escribinos</span>
        </a>
      )}
    </div>
  );
}
