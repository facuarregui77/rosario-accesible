# 📘 Guía de uso — Rosario Access Map

Todo lo que se puede hacer para **administrar y cargar datos** en la app, en un solo lugar.

## 🧭 ¿Qué querés hacer? (mapa rápido)

| Quiero… | Función | Quién puede | Requisitos |
|---|---|---|---|
| Sumar a alguien al equipo | [Agregar colaboradores](#-1-agregar-colaboradores) | Vos (dueño) | Supabase |
| Cargar accesibilidad **estando en el lugar** | [Modo relevamiento](#-21-relevar-en-la-calle-modo-relevamiento) | Admin | Celular + ubicación |
| Cargar accesibilidad **sin ir** (desde la compu) | [Relevar de escritorio](#-22-relevar-desde-el-escritorio-sin-ir) | Admin | Google Maps web |
| Corregir/completar **un lugar puntual** | [Editar ficha](#-23-editar-un-lugar-puntual) | Admin | — |
| Revisar lo que propone la gente | [Moderar sugerencias](#-24-moderar-sugerencias-del-público) | Admin | — |
| Que la gente **proponga** datos | [Sugerencias del público](#-25-sugerencias-del-público) | Cualquiera | — |
| Rellenar datos **automáticamente** | [Enriquecer con Google](#-26-enriquecer-automático-con-google-opcional) | Admin | Tarjeta (Google) |
| Subir **fotos** de un lugar | [Fotos](#-3-fotos-por-lugar) | Admin | Migración de fotos |

> **Regla de oro (siempre):** cargá solo datos **reales** que puedas confirmar. Ante la duda, dejá **"— / sin datos"**. Mejor sin dato que un dato inventado.

---

## 🔐 0. Entrar como administrador (paso común)

Casi todo lo de abajo necesita estar logueado como admin.

1. Abrí la app: **https://access-app-rosario.vercel.app**
2. Tocá el **candado** 🔒 (al lado del título).
3. Ingresá tu **email y contraseña** de administrador.
4. El candado se pone verde 🔓 y aparecen los botones de admin (**Relevar**, **Sugerencias**, **Análisis**, editar, subir fotos).

Para salir, tocá de nuevo el candado.

---

## 👥 1. Agregar colaboradores

La app usa modelo **"equipo de confianza"**: el registro público está cerrado, así que las cuentas las creás vos a mano. Cualquier colaborador logueado puede editar y relevar igual que vos.

> ⚠️ Sumá solo gente de confianza: todos tienen el mismo poder de edición.

1. Entrá a **https://supabase.com** → tu proyecto **mapa-accesible**.
2. Menú izquierdo → **Authentication** → pestaña **Users**.
3. Arriba a la derecha → **Add user** → **Create new user**.
4. Poné **email** y **contraseña**, y ✅ activá **"Auto Confirm User"** (si no, no puede entrar).
5. **Create user**. Listo.
6. Pasale al colaborador su **email + contraseña** (por un medio privado) y el link de la app. Él entra por el candado.

**Quitar un colaborador:** Authentication → Users → los **tres puntitos (⋯)** → **Delete user**. *(No borra ningún dato del mapa, solo le saca el acceso.)*

---

## 📍 2. Cargar datos de accesibilidad

Hay varias formas según la situación. Todas cargan los mismos datos (acceso en silla de ruedas + baño, rampa, ascensor, braille, señas), pero se usan en momentos distintos.

### 🚶 2.1 Relevar en la calle (Modo relevamiento)
**Cuándo:** estás físicamente frente al lugar (o caminando por la zona).
1. Logueate como admin → tocá el botón verde **"Relevar"**.
2. Permití la **ubicación** → te ordena los lugares por **cercanía** (los sin datos primero).
3. Tocá el lugar donde estás → marcá lo que ves (accesible sí/parcial/no + cada criterio Sí/No/—).
4. **"Guardar y volver"**. Seguís con el próximo.

### 💻 2.2 Relevar desde el escritorio (sin ir)
**Cuándo:** querés cargar datos desde tu casa, sin moverte, gratis.
1. Buscá el lugar en **Google Maps** (la web normal): https://www.google.com/maps
2. Mirá la sección **"Accesibilidad"** (te dice entrada/baño/estacionamiento accesibles) + fotos + reseñas.
3. En la app (admin), abrí el lugar → **"Editar"** → cargá **solo lo que confirmes**.

| Lo que dice Google | Qué cargás |
|---|---|
| "Entrada accesible para silla de ruedas" ✅ | Acceso general → **Accesible** |
| "Baño accesible para silla de ruedas" ✅ | Baño adaptado → **Sí** |
| No figura | Dejalo en **— (sin datos)** |

> Google **no** suele traer rampa exacta, braille ni señas → esos por relevamiento, llamando al lugar, o esperando sugerencias.

### ✏️ 2.3 Editar un lugar puntual
**Cuándo:** corregir o completar un lugar específico, desde donde estés.
1. Admin → buscá el lugar → abrí su ficha → **"Editar"**.
2. Elegí el estado general + cada criterio (Sí/No/—).
3. **"Guardar"**. Se publica al instante.

### 💡 2.4 Moderar sugerencias del público
**Cuándo:** revisar lo que propuso la gente.
1. Admin → botón **"Sugerencias"** (con globito naranja si hay pendientes).
2. Por cada una: **Aprobar** ✅ (aplica los datos) o **Rechazar**.

### 🙋 2.5 Sugerencias del público (lo hace cualquiera)
Cualquier visitante puede proponer datos: abre un lugar → sección **"¿Conocés este lugar? ¡Ayudanos!"** → completa lo que sabe → **Enviar**. No modifica el mapa hasta que vos lo apruebes (ver 2.4).

### 🤖 2.6 Enriquecer automático con Google (opcional)
**Cuándo:** querés rellenar varios lugares de una, automáticamente.
- Script `scripts/enrich-google-places.mjs` que trae datos de Google e inserta **sugerencias pendientes** (después las aprobás vos).
- Requiere una **API key de Google** (activar facturación con tarjeta; no cobra a tu escala).
- Pasos: sacar la key → ponerla en `.env.local` como `GOOGLE_MAPS_API_KEY` → `node scripts/enrich-google-places.mjs` (prueba) → `--push` (sube) → aprobar en "Sugerencias".

---

## 📸 3. Fotos por lugar

En la ficha de cada lugar, el admin puede **subir fotos** ("Agregar foto") y el público las ve.

**Requisito (una vez):** correr en Supabase → SQL Editor el archivo **`supabase/migracion-fotos.sql`** (crea el bucket de almacenamiento con lectura pública y subida solo-admin).

---

## 🗄️ 4. Referencia técnica

- **Migraciones de Supabase** (correr en SQL Editor cuando aplique):
  - `supabase/migracion-sugerencias.sql` — accesibilidad general + tabla de sugerencias (ya aplicada).
  - `supabase/migracion-fotos.sql` — bucket de fotos.
- **Deploy:** el sitio se publica con `npx vercel --prod` (no con git push).
- **Colores del mapa:** 🟢 accesible · 🟡 parcial · 🔴 sin acceso · ⚪ sin datos. El ícono del pin = tipo de lugar.

---

## ✅ Buenas prácticas
- No inventes datos. Ante la duda, **"sin datos" (—)**.
- El dato más valioso es el **acceso en silla de ruedas** (pinta el color del mapa).
- Los cambios de admin se publican para **todos** al instante.
- Para sumar gente al equipo, ver [sección 1](#-1-agregar-colaboradores).
