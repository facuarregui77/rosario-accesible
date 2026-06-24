# 🗺️ Rosario Access Map

Mapa **colaborativo** de accesibilidad de **Rosario (Argentina)**: muestra lugares de la ciudad con información de **accesibilidad** para personas con discapacidad o movilidad reducida.

La idea es ayudar a encontrar lugares inclusivos según distintos criterios: **acceso en silla de ruedas**, baño adaptado, rampa de acceso, ascensor, menú en braille y personal con lengua de señas.

## 🌍 Demo en vivo

👉 **https://access-app-rosario.vercel.app** (también se puede **instalar como app** en el celular)

## ✨ Características

- 🗺️ **Mapa real** de Rosario (Leaflet), acotado a la ciudad para no perderse en toda la provincia.
- 📍 **Marcadores inteligentes**: el **color** indica el nivel de accesibilidad (semáforo 🟢 accesible / 🟡 parcial / 🔴 sin acceso / ⚪ sin datos) y el **ícono** indica el tipo de lugar.
- 🏷️ **10 categorías**: bares, restaurantes, boliches, educativos, deportivos, culturales, salud, transporte, gobierno y espacios verdes.
- ♿ **Datos de accesibilidad reales y verificables** (fuente: OpenStreetMap), con tres estados por criterio: **sí / no / sin datos**. Cada lugar con dato enlaza a su objeto en OSM para comprobarlo.
- 🔎 **Buscador con autocompletado en vivo**: muestra coincidencias mientras escribís y resalta el lugar en el mapa.
- 🔍 **Filtros** por tipo de lugar y por nivel de accesibilidad.
- 🦽 **Capa de rampas / cruces accesibles** de la vía pública (OpenStreetMap), que se prende y apaga desde el mapa.
- 📊 **Panel de análisis** con estadísticas honestas (datos verificados vs. a relevar).
- 💬 **Opiniones y sugerencias** de la comunidad (experiencias + ideas de mejora), guardadas en la nube.
- 💡 **Sugerencias de accesibilidad del público** con **moderación**: cualquiera puede proponer datos; un administrador los aprueba antes de publicarlos.
- 📋 **Modo relevamiento** (solo admin): geolocaliza, ordena los lugares por cercanía y permite cargar la accesibilidad con pocos toques, parado frente al lugar.
- 🔐 **Edición solo para administradores** (login real con Supabase Auth); el público solo puede opinar y sugerir.
- 📱 **App instalable (PWA)** con **autoactualización** (avisa cuando hay una versión nueva).

> 📖 ¿Cómo cargar o relevar datos? Mirá la guía paso a paso en **[COMO-RELEVAR.md](COMO-RELEVAR.md)**.
> 👥 ¿Cómo sumar colaboradores al equipo? Guía en **[COMO-AGREGAR-COLABORADORES.md](COMO-AGREGAR-COLABORADORES.md)**.

## 🛠️ Tecnologías

- [React](https://react.dev/) + [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) para los estilos
- [Leaflet](https://leafletjs.com/) para el mapa
- [lucide-react](https://lucide.dev/) para los iconos
- [Supabase](https://supabase.com/) (Postgres + Auth + RLS) para la persistencia colaborativa en la nube
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) para la app instalable
- Deploy en [Vercel](https://vercel.com/)

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

### 🔑 Variables de entorno (modo nube)

Para usar la persistencia en la nube (Supabase), creá un archivo `.env.local` con:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Si no están configuradas, la app **funciona igual** pero guarda los datos solo en el navegador (modo local, sin colaboración).

## 📝 Nota sobre los datos

Los **lugares y sus ubicaciones son reales**. Los **datos de accesibilidad también son reales y comprobables**: provienen de [OpenStreetMap](https://www.openstreetmap.org/copyright) (licencia ODbL) y cada lugar que tiene dato enlaza a su objeto en OSM para verificarlo.

La cobertura abierta es limitada, así que **lo que no está verificado se muestra como "sin datos / a relevar"** — no se inventa ningún dato. La información se completa de dos formas, ambas con datos reales:

1. **Relevamiento del equipo** (admin): cargando lo que se ve en el lugar (ver [COMO-RELEVAR.md](COMO-RELEVAR.md)).
2. **Sugerencias del público**: cualquiera puede proponer datos desde la ficha de un lugar; quedan pendientes hasta que un administrador los aprueba.

La app incluye además una **capa opcional de rampas / cruces accesibles de la vía pública** (botón en el mapa), con ~274 puntos reales de OpenStreetMap (`kerb=lowered`, `ramp=yes`). Sirve de contexto: ayuda a saber si se puede *llegar* a un lugar de forma accesible, más allá del local en sí.

## 👤 Autor

**Facundo Arregui**

---

Proyecto desarrollado con fines educativos. 💙
