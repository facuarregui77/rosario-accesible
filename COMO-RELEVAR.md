# 📋 Cómo relevar y cargar datos en Rosario Access Map

Guía paso a paso para completar la información de accesibilidad de los lugares.
Hay **3 formas** de cargar datos; todas requieren estar logueado como **administrador**
(salvo la sugerencia del público, que la puede hacer cualquiera).

---

## ✅ Requisito previo (una sola vez)

La carga de datos en la nube necesita que esté corrida la migración de Supabase
(crea la columna del estado general y la tabla de sugerencias). **Esto ya está hecho.**
Si alguna vez se reinstala la base desde cero, volvé a correr el archivo
`supabase/migracion-sugerencias.sql` en **Supabase → SQL Editor**.

---

## 🔐 Paso 0 — Entrar como administrador

1. Abrí la app: **https://access-app-rosario.vercel.app**
2. Arriba, al lado del título, tocá el **candado** 🔒.
3. Ingresá tu **email y contraseña** de administrador.
4. El candado pasa a verde 🔓 y aparecen los botones **"Relevar"** y **"Sugerencias"**.

> Para salir del modo administrador, volvé a tocar el candado.

---

## 🚶 Forma 1 — Modo relevamiento (parado en la calle, desde el celular)

La forma **más práctica** para cargar varios lugares mientras caminás.

1. Logueate como admin (Paso 0).
2. Tocá el botón verde **"Relevar"**.
3. La app te va a pedir **permiso de ubicación** → tocá **Permitir**.
   (Si no querés dar ubicación, igual funciona: ordena los lugares alfabéticamente.)
4. Vas a ver la lista de lugares **ordenados por cercanía a vos**, con los
   **"a relevar"** (sin datos) primero. Arriba dice cuántos lugares ya tienen datos.
5. Tocá el lugar en el que estás parado.
6. Cargá lo que ves:
   - **¿Es accesible en silla de ruedas?** → tocá **Accesible / Parcial / Sin acceso**.
     (Esto es lo que pinta el color del marcador en el mapa.)
   - **Detalle**: para cada criterio (baño adaptado, rampa, ascensor, braille, lengua de señas)
     tocá **Sí**, **No** o **—** (si no sabés / no aplica).
7. Tocá **"Guardar y volver"**. El lugar desaparece de la lista de "sin datos" ✅.
8. Seguí con el próximo lugar.

> 💡 Consejo: cargá solo lo que **realmente ves**. Si no estás seguro de algo, dejalo en **—** (sin datos). Es mejor "sin datos" que un dato inventado.

---

## ✏️ Forma 2 — Editar un lugar puntual (desde la ficha)

Ideal para corregir o completar **un lugar específico**, desde la compu o el celu.

1. Logueate como admin (Paso 0).
2. Buscá el lugar (con el buscador) o tocalo en el mapa / la lista.
3. Se abre la ficha del lugar. Tocá **"Editar"** ✏️.
4. Elegí el **estado general de accesibilidad** (Accesible / Parcial / Sin acceso / Sin datos).
5. Marcá cada criterio en **Sí / No / —**.
6. Tocá **"Guardar"**. Los datos se publican al instante para toda la comunidad.

---

## 💡 Forma 3 — Revisar y aprobar sugerencias del público

El público puede **proponer** datos (no se publican solos): vos los aprobás.

**Cómo lo ve el público (sin login):**
- Abre un lugar → sección **"Sugerir datos de accesibilidad"** → completa lo que sabe → **Enviar**.
- Le aparece *"¡Gracias! Tu sugerencia será revisada"*. **No modifica el mapa todavía.**

**Cómo lo moderás vos (admin):**
1. Logueate como admin (Paso 0).
2. Mirá el botón **"Sugerencias"**: si tiene un **globito naranja con un número**, hay propuestas pendientes.
3. Tocalo → vas a ver cada sugerencia (qué lugar, qué datos proponen, comentario y quién).
4. Por cada una:
   - **Aprobar** ✅ → aplica los datos al lugar al instante.
   - **Rechazar** → la descarta.
5. Tocá el ícono de **actualizar** 🔄 para refrescar la lista si hace falta.

> Al aprobar, solo se aplican los campos que el sugeridor completó; el resto del lugar queda como estaba.

---

## 🎨 Qué significan los colores del mapa

| Color | Significado |
|-------|-------------|
| 🟢 Verde | Accesible en silla de ruedas |
| 🟡 Ámbar | Acceso parcial |
| 🔴 Rojo | Sin acceso |
| ⚪ Gris | Sin datos (a relevar) |

El **ícono** dentro del marcador indica el **tipo de lugar** (🍽️ restaurante, 🏥 salud, 🎓 educativo, etc.).

---

## 🧭 Buenas prácticas

- **No inventes datos.** Si no lo viste o no estás seguro, dejá **"sin datos" (—)**.
- **Acceso en silla de ruedas** es el dato más valioso: es el que pinta el mapa.
- Para sumar a alguien de confianza al equipo de carga: **Supabase → Authentication → Users → Add user** (con *Auto Confirm*). El registro público está cerrado a propósito.
- Los cambios se guardan en la nube y se ven para **todos** al instante.
