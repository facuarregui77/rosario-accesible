# 🤖 Enriquecer datos automáticamente con Google Places

Esta guía explica cómo usar el script que trae datos de accesibilidad desde **Google Maps**
y los carga como **sugerencias pendientes** en tu app (las que después aprobás vos).

> 💡 Idea clave: Google NO modifica tu mapa. Entra como un "sugeridor" más. Vos revisás cada
> dato desde el panel **"Sugerencias"** y aprobás solo lo que confíes. Cero riesgo para la integridad.

---

## ¿Qué trae Google?
- ♿ **Entrada accesible en silla de ruedas** → completa el estado general del lugar.
- 🚻 **Baño accesible** → tu criterio prioritario.
- (Como contexto, en el comentario: estacionamiento y asientos accesibles, si Google los tiene.)

Lo que Google **no** trae (rampa exacta, braille, lengua de señas) queda en "sin datos", para relevar.

---

## 💰 ¿Cuánto cuesta?
Para tus ~64 lugares: **prácticamente gratis**. Google Maps Platform da un cupo mensual gratuito
muy superior a esto (miles de consultas), y pedimos solo los campos del tier mínimo. Aun corriéndolo
varias veces por mes, no deberías pagar nada. (Igual conviene poner un límite de gasto, ver abajo.)

---

## Paso 1 — Conseguir la clave de Google (una sola vez)
1. Entrá a **https://console.cloud.google.com/** y logueate con tu cuenta de Google.
2. Creá un proyecto (botón arriba, "Nuevo proyecto") — por ejemplo `mapa-accesible`.
3. Buscá **"Places API (New)"** en la barra de búsqueda → **Habilitar**.
4. En el menú → **APIs y servicios → Credenciales → Crear credenciales → Clave de API**.
5. Copiá la clave (algo como `AIza...`).
6. (Recomendado) **Limitar gasto**: menú → **Facturación → Presupuestos y alertas** → creá un
   presupuesto de, por ejemplo, **USD 5** con alerta, para dormir tranquilo.
7. (Recomendado) **Restringir la clave**: en Credenciales, editá la clave → "Restricciones de API"
   → dejá solo **Places API (New)**.

> Google pide asociar una tarjeta para activar la facturación, pero con el cupo gratuito y el
> presupuesto de USD 5 no se te va a cobrar nada a esta escala.

## Paso 2 — Poner la clave en el proyecto
Abrí tu archivo `.env.local` (en la raíz del proyecto) y agregá esta línea:

```
GOOGLE_MAPS_API_KEY=AIza...tu-clave...
```

(Las otras dos, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, ya las tenés ahí.)

## Paso 3 — Probar (sin subir nada)
En la terminal, parado en la carpeta del proyecto:

```bash
node scripts/enrich-google-places.mjs
```

Esto consulta Google y **genera un informe** en `scripts/enrich-report.json` con lo que encontró.
**No sube nada todavía.** Abrí ese archivo y mirá si los datos tienen sentido.

## Paso 4 — Subir las sugerencias
Si el informe te convence:

```bash
node scripts/enrich-google-places.mjs --push
```

Esto crea las sugerencias **pendientes** en Supabase.

## Paso 5 — Aprobar desde la app
1. Abrí la app y entrá como **admin** (candado).
2. Tocá **"Sugerencias"** (vas a ver el globito con el número).
3. Cada sugerencia dice *"Google Places (automático)"*. Revisá y tocá **Aprobar** o **Rechazar**.

¡Listo! Lo que apruebes queda publicado en el mapa al instante.

---

## Re-correrlo en el futuro
- Cuando **agregues lugares nuevos** a la app, sumalos también a `scripts/places.json` y volvé a correr el script.
- Podés correrlo cada tanto para ver si Google sumó datos nuevos.

## Notas
- El script reutiliza el circuito de moderación: si un lugar ya tiene datos, igual te va a sugerir
  (y vos decidís). No pisa nada sin tu aprobación.
- Si Google no encuentra un lugar o no tiene datos de accesibilidad, simplemente lo saltea.
