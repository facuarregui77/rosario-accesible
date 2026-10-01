// Ícono de la capa de rampas: persona en silla de ruedas (el mismo dibujo del logo de la app),
// en blanco sobre un círculo azul con borde blanco, para que se distinga sobre cualquier calle del mapa.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24">
<circle cx="12" cy="12" r="11.1" fill="#0369a1" stroke="#ffffff" stroke-width="1.5"/>
<g transform="translate(4.3 4.4) scale(0.65)" fill="none" stroke="#ffffff" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">
<path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>
</g>
<circle cx="14.7" cy="7" r="1.35" fill="#ffffff"/>
</svg>`;

export const RAMP_ICON_URL = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SVG);
