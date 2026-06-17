# 🗺️ Rosario Access App

Mapa interactivo que muestra **bares, restaurantes, boliches, instituciones educativas, clubes deportivos/gimnasios y centros culturales** de **Rosario (Argentina)** con información de **accesibilidad** para personas con discapacidad.

La idea es ayudar a encontrar lugares inclusivos según distintos criterios: baño adaptado, rampa de acceso, ascensor, menú en braille y personal con lengua de señas.

## 🌍 Demo en vivo

👉 **https://access-app-rosario.vercel.app**

## ✨ Características

- 🗺️ **Mapa real** de Rosario con marcadores (usando Leaflet).
- ♿ **Datos de accesibilidad reales y verificables** (fuente: OpenStreetMap), con tres estados por criterio: **sí / no / sin datos**. Cada lugar con dato enlaza a su objeto en OSM para comprobarlo.
- 🏫 **Instituciones educativas** (universidades, escuelas y colegios), 🏟️ **clubes deportivos y gimnasios**, 🎭 **centros culturales**, además de bares, restaurantes y boliches.
- 🔍 **Filtros** por tipo de lugar y por nivel de accesibilidad.
- ⬅️ **Botón "Volver al inicio"**: al hacer clic en un lugar el mapa se centra en él, y con un botón volvés a la vista de toda la ciudad.
- 🦽 **Capa de rampas / cruces accesibles** de la vía pública (OpenStreetMap), que se prende y apaga desde el mapa.
- 📊 **Panel de análisis** con estadísticas honestas (datos verificados vs. a relevar).
- ⭐ **Reseñas y calificaciones** de usuarios (se guardan en el navegador).
- ✏️ **Edición de datos** de accesibilidad de cada lugar, con persistencia.

## 🛠️ Tecnologías

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) para los estilos
- [Leaflet](https://leafletjs.com/) para el mapa
- [lucide-react](https://lucide.dev/) para los iconos

## 🚀 Cómo correrlo en tu computadora

Necesitás tener instalado [Node.js](https://nodejs.org/).

```bash
# 1. Instalar las dependencias (solo la primera vez)
npm install

# 2. Encender la app en modo desarrollo
npm run dev
```

Después se abre solo en el navegador (normalmente en **http://localhost:5173**).

Para generar la versión final lista para publicar:

```bash
npm run build
```

## 📝 Nota sobre los datos

Los **lugares y sus ubicaciones son reales**. Los **datos de accesibilidad también son reales y comprobables**: provienen de [OpenStreetMap](https://www.openstreetmap.org/copyright) (licencia ODbL) y cada lugar que tiene dato enlaza a su objeto en OSM para verificarlo.

Hoy la cobertura abierta es limitada: solo algunos lugares tienen cargado el **acceso en silla de ruedas**, y prácticamente no hay datos públicos de baño adaptado, ascensor, braille o lengua de señas. Por eso **lo que no está verificado se muestra como "sin datos / a relevar"** — no se inventa ningún dato. Cualquiera puede completar información real desde la ficha de cada lugar (relevamiento manual), que se guarda en el navegador.

La app incluye además una **capa opcional de rampas / cruces accesibles de la vía pública** (botón en el mapa), con ~274 puntos reales de OpenStreetMap (`kerb=lowered`, `ramp=yes`). Sirve de contexto: ayuda a saber si se puede *llegar* a un lugar de forma accesible, más allá del local en sí. (El portal municipal de [datos abiertos de Rosario](https://datos.rosario.gob.ar) publica un dataset más amplio de rampas, pero hoy no está disponible para descarga abierta.)

## 👤 Autor

**Facundo Arregui**

---

Proyecto desarrollado con fines educativos. 💙