# 💻 Cómo relevar datos SIN ir al lugar (desde la compu, gratis)

Guía para cargar accesibilidad **de forma remota**, sin moverte y sin pagar nada.
La idea: usar **Google Maps (la web normal, gratis)** para ver qué accesibilidad tiene cada
lugar, y cargar en la app **solo lo que puedas confirmar**.

> 🔑 Regla de oro: si no lo podés confirmar, dejalo en **"—" (sin datos)**. Mejor "sin datos" que un dato inventado.

---

## Lo que vas a necesitar
- Tu compu con el navegador.
- **Google Maps web**: https://www.google.com/maps (NO hace falta API ni tarjeta).
- La app abierta y logueada como **admin** (candado 🔒).

---

## Paso a paso (por cada lugar)

### 1) Buscá el lugar en Google Maps
1. Entrá a https://www.google.com/maps
2. Buscá el lugar por nombre (ej. "El Cairo Rosario").
3. Hacé clic en el resultado para abrir su ficha.

### 2) Mirá la sección "Accesibilidad"
1. En la ficha del lugar, buscá la pestaña **"Información"** / **"Acerca de"** (o bajá en el panel).
2. Vas a ver una sección **"Accesibilidad"** que puede decir, por ejemplo:
   - ✅ *Entrada accesible para silla de ruedas*
   - ✅ *Baño accesible para silla de ruedas*
   - ✅ *Estacionamiento accesible para silla de ruedas*
   - ✅ *Asientos accesibles para silla de ruedas*
3. Si un ítem aparece tachado o dice "no tiene", es un **No**. Si no figura nada, es **sin datos**.

### 3) Reforzá con fotos y reseñas (opcional pero útil)
- Mirá las **fotos**: a veces se ve la rampa, el ancho de la puerta, escalones, etc.
- En **reseñas**, usá el buscador interno y poné palabras como *"rampa"*, *"silla de ruedas"*, *"accesible"*, *"escalón"*.

### 4) Cargá en la app lo que confirmaste
1. En la app (logueado como admin), buscá el lugar y abrí su ficha → **"Editar"**.
2. Completá según lo que viste:
   - **Accesibilidad general (silla de ruedas)**: Accesible / Parcial / Sin acceso / Sin datos.
   - **Baño adaptado**, **Rampa**, **Ascensor**, **Braille**, **Lengua de señas**: Sí / No / — .
3. Tocá **"Guardar"**. Listo, queda publicado.

---

## Cómo traducir lo de Google a tus campos

| Lo que dice Google | Qué cargás en la app |
|---|---|
| "Entrada accesible para silla de ruedas" ✅ | Accesibilidad general → **Accesible** |
| Entrada accesible tachada / "no" | Accesibilidad general → **Sin acceso** |
| "Baño accesible para silla de ruedas" ✅ | Baño adaptado → **Sí** |
| Baño accesible tachado / "no" | Baño adaptado → **No** |
| No figura el dato | Dejalo en **— (sin datos)** |

> ⚠️ Google **no** suele informar **rampa exacta, braille ni lengua de señas**. Esos dejalos en "—",
> o conseguilos por otra vía (ver abajo).

---

## Para los datos que Google no tiene (braille, lengua de señas, rampa)
Todo esto también se puede hacer **sin ir**:
- 📞 **Llamar al lugar** y preguntar (el teléfono suele estar en Google Maps).
- 📧 Escribirles por **Instagram / WhatsApp / mail**.
- 👀 Mirar **fotos** del lugar (para la rampa).
- 👥 Esperar **sugerencias del público** (gente que sí fue) y aprobarlas.

---

## Consejos para que rinda
- Hacé **tandas cortas**: 5-10 lugares por sesión, sin agotarte.
- Empezá por los que más se usan (hospitales, transporte, lugares populares).
- Si dudás de un dato, **no lo cargues**: la credibilidad del mapa es lo más valioso.
- ¿Querés automatizarlo? El atajo automático es el script de Google Places
  (ver **[COMO-ENRIQUECER-DATOS.md](COMO-ENRIQUECER-DATOS.md)**), que requiere activar una tarjeta
  en Google (sin cargo a esta escala). Esta guía manual hace lo mismo, gratis, pero a mano.
