# 🗺️ Rosario Access App

Mapa interactivo que muestra **bares, restaurantes, boliches, instituciones educativas, clubes deportivos/gimnasios y centros culturales** de **Rosario (Argentina)** con información de **accesibilidad** para personas con discapacidad.

La idea es ayudar a encontrar lugares inclusivos según distintos criterios: baño adaptado, rampa de acceso, ascensor, menú en braille y personal con lengua de señas.

## 🌍 Demo en vivo

👉 **https://access-app-rosario.vercel.app**

## ✨ Características

- 🗺️ **Mapa real** de Rosario con marcadores (usando Leaflet).
- ♿ **5 criterios de accesibilidad** por lugar, con vista de "100% apto".
- 🏫 **Instituciones educativas** (universidades, escuelas y colegios), 🏟️ **clubes deportivos y gimnasios**, 🎭 **centros culturales**, además de bares, restaurantes y boliches.
- 🔍 **Filtros** por tipo de lugar y por nivel de accesibilidad.
- ⬅️ **Botón "Volver al inicio"**: al hacer clic en un lugar el mapa se centra en él, y con un botón volvés a la vista de toda la ciudad.
- 📊 **Panel de análisis** con estadísticas y cobertura por criterio.
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

Los **lugares y sus ubicaciones son reales**. Los **indicadores de accesibilidad son simulados** con fines demostrativos, ya que esa información detallada no está disponible públicamente. Para un uso real habría que relevar cada lugar o integrar una base de datos colaborativa.

## 👤 Autor

**Facundo Arregui**

---

Proyecto desarrollado con fines educativos. 💙