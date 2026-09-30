import { Bath, MoveUp, BookOpen, Hand, ArrowUpDown } from "lucide-react";
export const CRITERIA = [
  { key: "bano", label: "Baño adaptado", icon: Bath },
  { key: "rampa", label: "Rampa de acceso", icon: ArrowUpDown },
  { key: "ascensor", label: "Ascensor", icon: MoveUp },
  { key: "braille", label: "Menú en braille", icon: BookOpen },
  { key: "senas", label: "Personal con lengua de señas", icon: Hand },
];

export const TYPE_LABELS = { bar: "Bar", restaurant: "Restaurante", boliche: "Boliche", educativo: "Educativo", deportivo: "Deportivo", cultural: "Cultural", salud: "Salud", transporte: "Transporte", gobierno: "Gobierno", verde: "Espacio verde" };
export const TYPE_PLURAL = { bar: "Bares", restaurant: "Restaurantes", boliche: "Boliches", educativo: "Educativos", deportivo: "Deportivos", cultural: "Culturales", salud: "Salud", transporte: "Transporte", gobierno: "Gobierno", verde: "Espacios verdes" };
export const TYPE_COLORS = { bar: "#f59e0b", restaurant: "#10b981", boliche: "#a855f7", educativo: "#3b82f6", deportivo: "#ef4444", cultural: "#d946ef", salud: "#14b8a6", transporte: "#64748b", gobierno: "#6366f1", verde: "#84cc16" };
// Ícono (emoji) por categoría — usado en los marcadores y en las etiquetas
export const TYPE_EMOJI = { bar: "🍺", restaurant: "🍽️", boliche: "🎶", educativo: "🎓", deportivo: "⚽", cultural: "🎭", salud: "🏥", transporte: "🚌", gobierno: "🏛️", verde: "🌳" };

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
export const CONTACT_EMAIL = "";
export const REPO_URL = "https://github.com/facuarregui77/rosario-accesible";
