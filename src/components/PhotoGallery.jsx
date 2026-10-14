import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Galería de fotos de la ficha: primero las que sube el equipo (muestran detalles de accesibilidad)
// y después las de Wikimedia Commons, con su autor y licencia como pide la licencia libre.
// Cada foto: { url, enlace, credito, licencia? }
export default function PhotoGallery({ photos, placeName }) {
  const [i, setI] = useState(0);
  const n = photos.length;
  useEffect(() => { setI(0); }, [placeName]);
  if (!n) return null;
  const k = Math.min(i, n - 1);
  const ph = photos[k];
  const ir = (d) => setI((v) => (v + d + n) % n);

  return (
    <figure className="mb-4" aria-roledescription="carrusel" aria-label={`Fotos de ${placeName}`}>
      <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-[16/10]">
        <a href={ph.enlace} target="_blank" rel="noreferrer" title="Ver la foto completa">
          <img key={ph.url} src={ph.url} alt={`Foto ${k + 1} de ${n}: ${placeName}`} loading="lazy" decoding="async"
            className="w-full h-full object-cover" />
        </a>
        {n > 1 && (
          <>
            <button onClick={() => ir(-1)} aria-label="Foto anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center">
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => ir(1)} aria-label="Foto siguiente"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/55 hover:bg-black/75 text-white flex items-center justify-center">
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden="true">
              {photos.map((_, j) => <span key={j} className={`w-2 h-2 rounded-full ${j === k ? "bg-white" : "bg-white/50"}`} />)}
            </div>
          </>
        )}
        {/* precarga la siguiente para que el cambio sea instantáneo */}
        {n > 1 && <link rel="prefetch" href={photos[(k + 1) % n].url} />}
      </div>
      <figcaption className="mt-1.5 text-[11px] text-slate-600 leading-snug">
        {n > 1 && <span className="font-semibold text-slate-700">{k + 1}/{n} · </span>}
        <a href={ph.enlace} target="_blank" rel="noreferrer" className="hover:underline">{ph.credito}{ph.licencia ? ` · ${ph.licencia}` : ""}</a>
      </figcaption>
    </figure>
  );
}
