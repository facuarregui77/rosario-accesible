export // Chip compacto del acceso en silla de ruedas (dato real de OSM)
function AccessChip({ wheelchair }) {
  if (wheelchair === "si") return <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 whitespace-nowrap">♿ Accesible</span>;
  if (wheelchair === "parcial") return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">♿ Parcial</span>;
  if (wheelchair === "no") return <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">♿ Sin acceso</span>;
  return null;
}
