import { Bath, MoveUp, BookOpen, Hand, ArrowUpDown } from "lucide-react";
export const CRITERIA = [
  { key: "bano", label: "Baño adaptado", icon: Bath },
  { key: "rampa", label: "Rampa de acceso", icon: ArrowUpDown },
  { key: "ascensor", label: "Ascensor", icon: MoveUp },
  { key: "braille", label: "Menú o carteles en braille", icon: BookOpen },
  { key: "senas", label: "Personal con lengua de señas", icon: Hand },
];

// Qué criterios tienen sentido según el tipo de lugar (un parque no tiene menú ni ascensor, un comercio no
// suele tener baño para clientes…). Se usa en la ficha, al sugerir, al relevar y en los filtros.
const CRITERIOS_POR_TIPO = {
  bar: ["bano", "rampa", "ascensor", "braille", "senas"],
  restaurant: ["bano", "rampa", "ascensor", "braille", "senas"],
  gastronomia: ["bano", "rampa", "braille", "senas"],
  boliche: ["bano", "rampa", "ascensor", "senas"],
  educativo: ["bano", "rampa", "ascensor", "braille", "senas"],
  cultural: ["bano", "rampa", "ascensor", "braille", "senas"],
  salud: ["bano", "rampa", "ascensor", "braille", "senas"],
  gobierno: ["bano", "rampa", "ascensor", "braille", "senas"],
  transporte: ["bano", "rampa", "ascensor", "braille", "senas"],
  alojamiento: ["bano", "rampa", "ascensor", "senas"],
  deportivo: ["bano", "rampa", "ascensor"],
  comercio: ["rampa", "ascensor", "senas"],
  servicio: ["bano", "rampa", "ascensor", "senas"],
  verde: ["bano", "rampa"],
};
// En los lugares donde se come, el braille es del menú; en el resto, de la cartelería
const COMIDA = ["bar", "restaurant", "gastronomia"];
export function criteriosDe(type) {
  const claves = CRITERIOS_POR_TIPO[type];
  if (!claves) return CRITERIA;
  return CRITERIA.filter((c) => claves.includes(c.key))
    .map((c) => (c.key === "braille" ? { ...c, label: COMIDA.includes(type) ? "Menú en braille" : "Carteles en braille" } : c));
}
// Criterios de varios tipos juntos (para los filtros cuando se eligen todos los tipos)
export const criteriosDeTipos = (tipos) => CRITERIA.filter((c) => tipos.some((t) => criteriosDe(t).some((x) => x.key === c.key)));

export const TYPE_LABELS = { bar: "Bar", restaurant: "Restaurante", boliche: "Boliche", educativo: "Educativo", deportivo: "Deportivo", cultural: "Cultural", salud: "Salud", transporte: "Transporte", gobierno: "Gobierno", verde: "Espacio verde", gastronomia: "Café y comida al paso", comercio: "Comercio", servicio: "Empresa", alojamiento: "Alojamiento" };
export const TYPE_PLURAL = { bar: "Bares", restaurant: "Restaurantes", boliche: "Boliches", educativo: "Educativos", deportivo: "Deportivos", cultural: "Culturales", salud: "Salud", transporte: "Transporte", gobierno: "Gobierno", verde: "Espacios verdes", gastronomia: "Cafés y comida al paso", comercio: "Comercios", servicio: "Empresas", alojamiento: "Alojamiento" };
// Colores al estilo Google Maps: comida y bebida naranja, compras azul, salud rojo, parques verde, hoteles rosa,
// cultura turquesa, educación índigo, oficinas y gobierno gris.
export const TYPE_COLORS = { bar: "#E8710A", restaurant: "#E8710A", boliche: "#9334E6", educativo: "#5C6BC0", deportivo: "#0B8043", cultural: "#12A4AF", salud: "#D93025", transporte: "#1967D2", gobierno: "#5F6368", verde: "#34A853", gastronomia: "#E8710A", comercio: "#4285F4", servicio: "#78909C", alojamiento: "#D81B60" };
// Ícono (emoji) por categoría — usado en los marcadores y en las etiquetas
export const TYPE_EMOJI = { bar: "🍺", restaurant: "🍽️", boliche: "🎶", educativo: "🎓", deportivo: "⚽", cultural: "🎭", salud: "🏥", transporte: "🚌", gobierno: "🏛️", verde: "🌳", gastronomia: "☕", comercio: "🛍️", servicio: "🏢", alojamiento: "🛏️" };

// Etiquetas del acceso en silla de ruedas (dato real de OSM)
export const WHEELCHAIR_LABELS = { si: "Acceso en silla de ruedas", parcial: "Acceso parcial en silla de ruedas", no: "Sin acceso en silla de ruedas" };

// Código para desbloquear el "modo edición" (admin). Cambialo por el que quieras.
// (Candado blando del lado del cliente; la seguridad real llega con login de Supabase.)
export const ADMIN_CODE = "rosario-2026";

// ¿Tenemos algún dato real o cargado para este lugar?
export const hasAnyData = (p) => p.wheelchair != null || CRITERIA.some((c) => p.a[c.key] != null);

// Normaliza texto para buscar sin distinguir mayúsculas ni acentos
export const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Color del semáforo de accesibilidad (puntito del pin, chips, autocompletado)
export const accessColor = (w) => (w === "si" ? "#10b981" : w === "parcial" ? "#f59e0b" : w === "no" ? "#ef4444" : "#94a3b8");

// Etiquetas del semáforo (para leyenda y lectores de pantalla)
export const ACCESS_LABELS = { si: "Accesible", parcial: "Parcialmente accesible", no: "Sin acceso", null: "Sin datos" };

// ¿El usuario pidió menos animaciones en su sistema? (accesibilidad)
export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Contacto público (aparece en "Acerca de"). Dejalo vacío ("") para ocultar el botón.
export const CONTACT_EMAIL = "facuarregui77@gmail.com";
// WhatsApp de contacto (botón en "Acerca de"). Formato internacional, solo números:
// 54 (Argentina) + 9 + característica sin el 0 + número sin el 15. Ej.: "5493415551234". Vacío = no se muestra.
export const CONTACT_WHATSAPP = "5493412517777";
// A quién se puede escribir por WhatsApp: al tocar el botón aparece un menú para elegir.
// `numero` en formato internacional, solo números (como CONTACT_WHATSAPP); `ver` es como se muestra.
export const WHATSAPP_CONTACTOS = [
  { nombre: "Facundo Arregui", ver: "+54 9 341 251-7777", numero: CONTACT_WHATSAPP },
  { nombre: "Welcome Rosario", ver: "+54 9 341 325-2526", numero: "5493413252526" },
];
export const REPO_URL = "https://github.com/facuarregui77/rosario-accesible";
