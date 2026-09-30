# Manual de Rosario Access Map

Cómo funciona todo lo que tiene la app, explicado para quien la creó y la mantiene.
Última actualización: 30 de septiembre de 2026.

> **La app en vivo:** https://access-app-rosario.vercel.app
> **El código:** https://github.com/facuarregui77/rosario-accesible (público)
> **La base de datos:** Supabase, proyecto `xclzrsvlbbaguhlfgmyf`

---

## 1. Qué es y cómo está armada

Es una página web que funciona como app (se puede instalar en el celular). Muestra un mapa de
Rosario con lugares (bares, escuelas, hospitales, clubes, parques…) y para cada uno dice qué
tan accesible es para una persona con movilidad reducida. La gente puede opinar y sugerir
datos; vos (admin) verificás y publicás.

Tiene tres piezas:

| Pieza | Qué es | Dónde vive |
|---|---|---|
| **La app** (lo que ve la gente) | Código React + Vite | GitHub → publicado en Vercel |
| **La base de datos** (lo que se guarda) | Supabase (PostgreSQL + fotos + login) | supabase.com |
| **Los datos base** (los 110 lugares, contactos, rampas) | Archivos dentro del código | `src/data/places.js`, `src/contactos.json`, `src/rampas-rosario.json` |

Si Supabase no está configurado, la app igual funciona: guarda todo en el navegador de cada
persona (modo "local"). En producción está configurado, así que todo va a la nube.

---

## 2. Lo que ve cualquier persona

### 2.1 La barra de arriba

- **Logo y título** "Rosario Access Map".
- **Botón ⓘ (Acerca de):** explica el proyecto, de dónde salen los datos, cómo colaborar,
  botón "Compartir el mapa" y el ajuste de **Alto contraste**.
- **Candado 🔒:** entrada de administrador (ver sección 3). El público no lo necesita.
- **Buscador:** escribís parte del nombre y aparece una lista en vivo. No distingue
  mayúsculas ni acentos ("cafe" encuentra "Café"). Se maneja con teclado: flechas ↑↓ para
  moverse, Enter para elegir, Escape para cerrar. Al escribir, el mapa se acomoda solo a los
  resultados. La ✕ limpia la búsqueda.
- **Cerca de mí:** pide tu ubicación y ordena la lista de más cerca a más lejos, mostrando la
  distancia (por ejemplo "234 m"). Por defecto muestra lo que está a menos de 1 km; el radio se
  cambia en los filtros (500 m / 1 km / 2 km / toda la ciudad). En el mapa aparece un punto azul
  "Estás acá". Se apaga tocando el mismo botón.
- **Rampas:** prende o apaga la capa de rampas y cruces accesibles de la vereda (puntos
  celestes). Al tocar un punto muestra la dirección aproximada.

### 2.2 El mapa

- Muestra solo Rosario (no se puede ir a otra ciudad ni alejar demasiado). Mapa base de Esri.
- **Cada pin es un lugar.** El **color del pin** es el tipo de lugar (naranja bar, verde
  restaurante, azul educativo, rojo deportivo, etc.). El **puntito del centro** es el semáforo
  de accesibilidad: verde accesible, ámbar parcial, rojo sin acceso, gris sin datos.
- Botón **Leyenda** (abajo a la derecha) explica esos colores.
- Al pasar el mouse por un pin aparece el nombre y, si tiene, el puntaje de los usuarios.
- Tocar un pin abre la ficha del lugar. El pin elegido se agranda y se pone con borde oscuro.
- Botones **+ / −** para el zoom (abajo a la derecha) y un botón ↺ (abajo a la izquierda)
  para volver a la vista de toda la ciudad.
- Con teclado: Tab recorre los pines, Enter abre la ficha.

### 2.3 El panel de la izquierda (lista de lugares)

Se abre y cierra con la pestaña celeste. Muestra los lugares que pasan los filtros, con su
tipo, el puntaje de Google, el chip "♿ Accesible / Parcial / Sin acceso" si tiene dato, y la
distancia si está activo "Cerca de mí". Tocar uno abre su ficha. En celular se cierra solo al
elegir.

### 2.4 El panel de la derecha (filtros)

Se abre con la pestaña naranja (tiene un puntito blanco cuando hay filtros activos).

- **Cerca de mí:** botón para usar tu ubicación y elegir el radio.
- **Tipo de lugar:** Todos / Bares / Restaurantes / Boliches / Educativos / Deportivos /
  Culturales / Salud / Transporte / Gobierno / Espacios verdes.
- **Accesibilidad:** Todos / Accesible / Parcial / Sin acceso / Sin datos.
- **Servicios (que tenga…):** baño adaptado, rampa, ascensor, menú en braille, personal con
  lengua de señas. Se pueden combinar (muestra solo los que tienen TODOS los marcados).

Los filtros se aplican a la vez al mapa, a la lista y al buscador.

### 2.5 La ficha de un lugar

Se abre al tocar un pin, un lugar de la lista o un resultado del buscador. Contiene:

1. **Título, tipo, puntaje de Google y puntaje de los usuarios** (promedio de las opiniones con
   estrellas).
2. **Botón compartir** (arriba a la derecha): en el celular abre el menú de compartir; en la
   computadora copia el link. El link lleva directo a ese lugar
   (`…/?lugar=elcairo`). También se puede copiar la dirección del navegador: cambia sola al
   abrir cada ficha.
3. **Cómo llego (ruta accesible):** traza en el mapa una ruta pensada para silla de ruedas
   desde donde estás, con distancia y minutos. Usa OpenRouteService. (Solo aparece si la clave
   `VITE_ORS_API_KEY` está cargada en Vercel.)
4. **Semáforo de accesibilidad** con el texto "Acceso en silla de ruedas / parcial / sin
   acceso" y el link "Dato verificable en OpenStreetMap" cuando el dato viene de ahí.
5. **Contacto y ubicación:** dirección, teléfono (tocable para llamar), sitio web, Instagram y
   Facebook. Vienen de OpenStreetMap (`src/contactos.json`). Si no hay dirección cargada, la app
   la averigua sola por las coordenadas y la marca "(aprox.)".
6. **Detalle de accesibilidad:** los 5 criterios con ✅ Sí / ❌ No / "sin datos". Abajo, la
   fuente y la fecha de la última actualización.
7. **Fotos:** si el admin subió fotos del lugar, se ven acá (tocar para agrandar).
8. **"¿Conocés este lugar? ¡Ayudanos!":** formulario para que el público **sugiera** datos:
   silla de ruedas (accesible/parcial/sin acceso) y los 5 criterios, más comentario y nombre
   opcionales. **No se publica solo:** entra como sugerencia pendiente y vos la aprobás o
   rechazás (sección 3.4).
9. **Opiniones y sugerencias:** lista de lo que dejó la gente. Cada una dice si es
   "Experiencia" (cómo le fue en el lugar) o "Sugerencia" (para mejorar la app), con
   estrellas si las puso, nombre y fecha.
10. **Formulario de opinión:** elegir Experiencia o Sugerencia, estrellas (opcional, tocar la
    misma estrella la saca), nombre (opcional, sale "Anónimo") y texto (obligatorio, hasta 600
    letras). Se publica al instante.

**Freno anti-spam de las opiniones:** hay un campo invisible que solo completan los robots
(si viene lleno, se descarta), una pausa de 2 minutos entre opiniones del mismo navegador
para el mismo lugar, y del lado del servidor un tope de 5 opiniones por lugar cada 10 minutos
y largo máximo de texto. Si igual entra algo que no corresponde, el admin la borra desde la
ficha.

### 2.6 Accesibilidad de la propia app

- Se recorre entera con **teclado**: Tab avanza, Enter activa, **Escape cierra** lo que esté
  abierto (buscador, ficha, paneles, filtros).
- Cuando se abre una ficha o ventana, el foco entra en ella y **no se escapa** al mapa de atrás;
  al cerrarla vuelve al botón que la abrió.
- Todos los botones con ícono tienen nombre para **lectores de pantalla**; las estrellas dicen
  "3 estrellas"; los resultados de búsqueda, los guardados y las rutas se **anuncian en voz**
  ("12 lugares a menos de 1 km de vos").
- Textos de al menos 11 px con contraste suficiente; los botones de color se oscurecieron
  para que el blanco se lea.
- Respeta la opción **"reducir animaciones"** del sistema (se apagan las animaciones del
  mapa y de los paneles).
- **Alto contraste** (Acerca de → Ajustes): textos casi negros, bordes marcados, sin
  transparencias. Se recuerda en el navegador y se activa solo si el sistema lo pide.

### 2.7 Instalarla como app

En el celular, el navegador ofrece "Agregar a la pantalla de inicio". Queda con ícono propio,
abre a pantalla completa y **abre aunque no haya señal** (muestra lo último que cargó). Cuando
publicás una versión nueva, a quien tenga la app abierta le aparece un cartel
"Hay una versión nueva — Actualizar" (revisa cada hora).

### 2.8 Compartir y Google

Al pegar el link en WhatsApp/Instagram/Facebook sale una tarjeta con título, descripción e
imagen. Google indexa el sitio (está verificado en Search Console; hay `robots.txt`,
`sitemap.xml` y datos estructurados). Lo que más ayuda a posicionar es que otros sitios
enlacen la app (asociaciones, medios, municipio).

---

## 3. Lo que ve el administrador

### 3.1 Entrar y salir

Tocá el **candado** de arriba. Pide **email y contraseña** (cuenta creada en Supabase →
Authentication → Users; el registro público está cerrado, así que solo existen las cuentas que
vos creás a mano). Al entrar el candado se pone verde y aparecen los botones de admin. Para
salir, tocá el candado de nuevo.

(Si la app corre sin Supabase, el candado pide un código: `rosario-2026`, que está en
`src/data/constants.js`.)

Cualquier cuenta que crees puede editar: es el modelo "equipo de confianza".

### 3.2 Botones de admin en la barra

- **Análisis** (naranja): estadísticas (sección 3.6).
- **Relevar** (verde): modo relevamiento en la calle (sección 3.5).
- **Sugerencias** (con contador): moderación (sección 3.4).
- **Agregar lugar**: sumar un lugar nuevo al mapa (sección 3.3).

### 3.3 Agregar un lugar nuevo

Botón **Agregar lugar** → nombre, tipo y ubicación. La ubicación se carga de tres formas:
**Usar mi ubicación** (si estás parado ahí), **Marcar en el mapa** (la ventana se esconde, tocás
el mapa donde está el lugar y vuelve con las coordenadas cargadas) o escribiendo latitud y
longitud. Al guardar, el lugar aparece en el mapa para todos y se abre su ficha para que
cargues la accesibilidad con **Editar**. Estos lugares se guardan en la tabla `places` de
Supabase; los 110 originales siguen en el código. Un lugar agregado desde la app se puede
**borrar** desde su ficha (botón "Borrar lugar"); los originales no.

### 3.4 Sugerencias del público (moderación)

Botón **Sugerencias**: lista de lo que mandó la gente desde "¿Conocés este lugar?", con el
nombre del lugar, los datos propuestos (chips), el comentario y quién lo mandó.
**Aprobar** aplica esos datos a la ficha del lugar (solo los campos que la persona completó;
lo demás no se toca). **Rechazar** la descarta. El botón ↺ recarga la lista.

### 3.5 Relevar en la calle

Botón **Relevar**: pantalla completa que pide tu ubicación y ordena los lugares **de más cerca
a más lejos** con la distancia. Filtro **"Solo sin datos" / "Todos"**. Tocás un lugar y cargás con
botones grandes: ¿es accesible en silla de ruedas? (Accesible / Parcial / Sin acceso / Sin
datos) y los 5 criterios (Sí / No / —). **Guardar y volver** lo publica al instante para todos
y te deja de nuevo en la lista. Arriba se ve el avance ("38 de 112 lugares con datos").

### 3.6 Editar desde la ficha

Con el admin activo, en la ficha aparece **Editar**: se edita el semáforo y los 5 criterios
igual que en Relevar. También:

- **Agregar foto** (se guarda en Supabase Storage, bucket `place-photos`) y **borrar foto**
  (✕ sobre la foto).
- **Borrar una opinión** (ícono 🗑 al lado de cada una).
- **Borrar lugar** (solo lugares agregados desde la app).

### 3.7 Análisis

- Donut con el **porcentaje de lugares con datos**; cuántos son accesibles, parciales o sin
  datos; total de lugares.
- Barra por criterio (cuántos lugares tienen dato de baño, rampa, etc.).
- **Errores registrados en la app:** si a alguien se le rompe algo en su celular, la app lo
  anota sola (tabla `app_errors`, máximo 3 por sesión) y acá ves fecha, mensaje y dispositivo.
  Si está vacío, todo bien.

---

## 4. Los datos: de dónde salen y dónde se guardan

**Regla de oro: nada se inventa.** Si no hay fuente, dice "sin datos".

| Dato | Fuente | Dónde está |
|---|---|---|
| Los 110 lugares (nombre, tipo, ubicación, puntaje Google) | Cargados a mano, ubicaciones reales | `src/data/places.js` |
| Acceso en silla de ruedas de ~25 lugares | OpenStreetMap (con link verificable) | `src/data/places.js` (`wheelchair` + `src`) |
| Contacto (dirección, teléfono, web, redes) | OpenStreetMap | `src/contactos.json` |
| Rampas y cruces accesibles (1.003 puntos) | OpenStreetMap | `src/rampas-rosario.json` |
| Accesibilidad cargada por el equipo (semáforo + 5 criterios) | Relevamiento / sugerencias aprobadas | Supabase, tabla `place_access` |
| Opiniones | Público | Supabase, tabla `reviews` |
| Sugerencias del público | Público (pendiente / aprobada / rechazada) | Supabase, tabla `access_suggestions` |
| Lugares agregados desde la app | Admin | Supabase, tabla `places` |
| Fotos | Admin | Supabase Storage, bucket `place-photos` |
| Errores de la app | La app sola | Supabase, tabla `app_errors` |

**Permisos en Supabase (RLS):** todo el mundo puede *leer* lugares, accesos y opiniones;
todo el mundo puede *escribir* opiniones y sugerencias (con los frenos anti-spam); solo un
usuario logueado puede editar accesos, aprobar sugerencias, subir fotos, agregar/borrar lugares
y borrar opiniones. Los errores los puede insertar cualquiera pero solo el admin los lee.

**Las rampas de la Municipalidad:** la cifra oficial es de 11.129 rampas (2022), pero la Muni
**no publica dónde están** (solo totales por distrito). Se revisó el portal de datos abiertos,
el Infomapa, los servicios de mapas y el archivo histórico: no existe el archivo. La única vía es
un **pedido de acceso a la información pública** pidiendo la capa de rampas de Obras Públicas.
Mientras tanto, la capa usa OpenStreetMap; se refresca con `node scripts/actualizar-rampas-osm.mjs`.

**Google Places:** hay un script (`scripts/enrich-google-places.mjs`) que trae "entrada accesible"
y "baño accesible" de Google para los 70 lugares principales y los mete como sugerencias
pendientes para que las apruebes. Necesita una clave `GOOGLE_MAPS_API_KEY` en `.env.local`
(gratis a esta escala).

---

## 5. Cómo se mantiene (paso a paso)

### 5.1 Cambié algo en el código → guardarlo en GitHub
Doble clic en **`SUBIR A GITHUB.bat`** (o Claude lo hace solo al terminar cada tarea).
GitHub es la copia de seguridad del código; **no** cambia lo que ve la gente.

### 5.2 Que la gente vea la versión nueva → publicar
Doble clic en **`PUBLICAR EN VERCEL.bat`**. La primera vez abre una dirección en el navegador
para que confirmes que sos vos; después compila y publica (1 minuto). También intenta conectar
Vercel con GitHub para que, de ahí en más, **cada "subir" publique solo**.

### 5.3 Cambió la base de datos → correr una migración
Cuando una función nueva necesita una tabla o columna nueva, hay un archivo en `supabase/`.
Se corre así: supabase.com → tu proyecto → **SQL Editor** → New query → pegar todo el
archivo → **Run**. Se pueden correr más de una vez sin romper nada. Orden histórico:
`schema.sql` → `migracion-auth.sql` → `migracion-relevamiento.sql` → `migracion-sugerencias.sql`
→ `migracion-fotos.sql` → **`migracion-lugares.sql`** (la nueva: tabla de lugares, borrado de
opiniones, errores y freno anti-spam).

### 5.4 Claves (no van a GitHub)
En `.env.local` (tu compu) y en Vercel → Settings → Environment Variables:
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (nube) y `VITE_ORS_API_KEY` (ruteo).
Si faltan las de Supabase, la app funciona en modo local; si falta la de ORS, no aparece "Cómo llego".

### 5.5 Estadísticas de visitas
La app ya manda datos a **Vercel Analytics** (anónimo, sin cookies). Para verlos hay que
activarlo una vez: vercel.com → proyecto `access-app-rosario` → pestaña **Analytics** → Enable.

### 5.6 Cosas que se cambian tocando un solo lugar
- Email de contacto en "Acerca de": `CONTACT_EMAIL` en `src/data/constants.js` (vacío = no se
  muestra).
- Colores de cada tipo de lugar: `TYPE_COLORS` en el mismo archivo.
- Radios de "Cerca de mí": `RADII` en `src/App.jsx`.
- Los 5 criterios de accesibilidad: `CRITERIA` en `src/data/constants.js` (si agregás uno,
  también hay que agregar la columna en Supabase).

### 5.7 Estructura del código (para orientarse)
```
src/
  App.jsx                  pantalla principal: barra, mapa, paneles, filtros, lógica general
  main.jsx                 arranque, analítica, registro de errores
  db.js                    todo lo que habla con Supabase (o con el navegador en modo local)
  data/places.js           los 110 lugares base
  data/constants.js        tipos, colores, criterios, etiquetas, contacto
  lib/geo.js               distancias y dirección aproximada
  lib/routing.js           ruta accesible (OpenRouteService)
  hooks/useFocusTrap.js    foco accesible de las ventanas
  components/RealMap.jsx   el mapa (Leaflet), pines, rampas, ruta, punto "estás acá"
  components/DetailPanel.jsx   ficha del lugar
  components/Legend.jsx / AboutModal.jsx / AddPlaceModal.jsx
  components/SurveyMode.jsx / SuggestionForm.jsx / SuggestionsPanel.jsx
  components/AnalysisPanel.jsx / LoginModal.jsx / AccessChip.jsx
```

---

## 6. Pendientes que dependen de vos

1. Correr **`supabase/migracion-lugares.sql`** en Supabase (sin esto, "Agregar lugar",
   "borrar opinión" y el registro de errores no funcionan; todo lo demás sí).
2. Doble clic en **`PUBLICAR EN VERCEL.bat`** y confirmar el login en el navegador.
3. Activar **Analytics** en Vercel (un clic).
4. Opcional: **dominio propio** (por ejemplo `rosarioaccesible.com.ar`): se compra en NIC
   Argentina y se agrega en Vercel → Settings → Domains.
5. Opcional: poner tu email en `CONTACT_EMAIL` para que aparezca "Escribinos" en Acerca de.
6. Opcional: pedido de información pública a la Municipalidad por la capa de rampas.
