# 🗺️ Rosario Access Map

Mapa colaborativo de **accesibilidad de Rosario**: lugares de la ciudad con información de accesibilidad para personas con discapacidad o movilidad reducida, más las rampas y cruces accesibles de la vía pública.

🌍 **En vivo:** https://access-app-rosario.vercel.app

## 📄 Documentación

- **[MANUAL.md](MANUAL.md)** — manual completo: cómo funciona cada parte de la app, qué hace el admin, de dónde salen los datos y cómo se mantiene.
- **[README.pdf](README.pdf)** — descripción del proyecto, características y tecnologías.
- **[GUIA.pdf](GUIA.pdf)** — guía de uso: cómo administrar, relevar datos y sumar colaboradores.

## 🧰 Para quien mantiene la app

- `SUBIR A GITHUB.bat` — guarda el código en GitHub.
- `PUBLICAR EN VERCEL.bat` — publica la versión nueva en internet (y conecta el deploy automático).
- `supabase/*.sql` — migraciones de la base de datos, se pegan en Supabase → SQL Editor. La última es `migracion-lugares.sql`.
- `scripts/actualizar-rampas-osm.mjs` — refresca las rampas desde OpenStreetMap (`node scripts/actualizar-rampas-osm.mjs`).

Estructura del código (`src/`): `App.jsx` (pantalla principal) · `components/` (mapa, ficha, paneles) · `data/` (lugares base y constantes) · `lib/` (distancias, direcciones, ruteo) · `db.js` (nube / local).

---

**Autor:** Facundo Arregui · Proyecto con fines educativos. 💙
