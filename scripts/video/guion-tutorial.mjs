// GUION DEL VIDEO TUTORIAL (completo: uso de la app + cómo colaborar + herramientas del equipo)
// Cada escena: `texto` es lo que se dice y se subtitula; `hacer` es lo que pasa en pantalla mientras tanto.
import { esperar } from "./motor.mjs";

const ANCHO = 1280, ALTO = 720;

export default {
  nombre: "Video tutorial",
  salida: "VIDEO TUTORIAL.mp4",
  voz: "es-AR-ElenaNeural",
  ancho: ANCHO, alto: ALTO,
  ubicacion: { latitude: -32.94782, longitude: -60.6541 }, // Auckland, Bv. Oroño 1121
  // Sugerencias de ejemplo que "mandó el público" (solo para el video)
  sugerenciasEjemplo: [
    { id: 9001, place_id: "elcairo", wheelchair: "si", bano: "si", rampa: null, ascensor: null, braille: null, senas: null, comment: "Entrada sin escalones y baño amplio en planta baja.", name: null, status: "pending", created_at: new Date().toISOString() },
    { id: 9002, place_id: "teatro_comedia", wheelchair: null, bano: null, rampa: "si", ascensor: "no", braille: null, senas: null, comment: "Hay rampa en la entrada, pero no ascensor a la sala de arriba.", name: null, status: "pending", created_at: new Date().toISOString() },
  ],
  escenas: [
    // ---------- Parte 1: usar el mapa ----------
    { texto: "Hola. Este es Rosario Access Map, un mapa gratuito que muestra qué tan accesibles son los lugares de Rosario: bares, restaurantes, escuelas, clubes, hospitales y oficinas públicas. Te mostramos cómo usarlo y cómo colaborar.",
      hacer: async (a) => { await a.titulo("Cómo usar Rosario Access Map", "access-app-rosario.vercel.app", 5000); } },
    { texto: "Cada pin es un lugar. El color y el dibujito dicen qué tipo de lugar es, y el circulito de la esquina dice si es accesible. Al pasar el mouse por un pin aparece un cartelito con el nombre, el tipo de lugar y si se puede entrar en silla de ruedas.",
      hacer: async (a, p, ms) => { await esperar(4500); await a.posar(p.locator('.leaflet-marker-icon[title*="Teatro La Comedia"]').first()); await esperar(4500); await a.posar(p.locator('.leaflet-marker-icon[title*="Museo"]').first()); await esperar(Math.max(1500, ms - 14000)); await p.mouse.move(5, 400); } },
    { texto: "Para encontrar un lugar, escribí su nombre en el buscador y elegilo de la lista.",
      hacer: async (a, p) => { await a.escribir(p.getByLabel("Buscar un lugar por nombre"), "comedia", 140); await esperar(900); await a.tocar(p.getByRole("option").first()); } },
    { texto: "Se abre la ficha del lugar: si se puede entrar en silla de ruedas, la dirección, el teléfono, las redes, y el detalle de accesibilidad, como baño adaptado, rampa de acceso o ascensor.",
      hacer: async (a, p) => { await esperar(2500); await a.deslizar(p.locator('[role="dialog"]').first(), 420, 4000); await esperar(1500); await a.deslizar(p.locator('[role="dialog"]').first(), -420, 1500); } },
    { texto: "Con Cómo llego, el mapa busca solo dónde estás y te muestra el recorrido en silla de ruedas, a pie, en bici o en auto, con los minutos que tarda cada uno.",
      hacer: async (a, p) => { await a.tocar(p.getByRole("button", { name: /Cómo llego/ })); await esperar(5000); await a.tocar(p.getByRole("tab", { name: /A pie/ })); await esperar(2200); await a.tocar(p.getByRole("tab", { name: /En auto/ })); } },
    { texto: "En colectivo te dice qué línea tomar, dónde subir y dónde bajar. Con Ver pasos tenés el viaje explicado paso a paso.",
      hacer: async (a, p) => { await a.tocar(p.getByRole("tab", { name: /colectivo/ })); await esperar(2500); await a.tocar(p.getByRole("button", { name: /Ver pasos/ })); await esperar(3500); await a.tocar(p.getByLabel("Cerrar Cómo llego")); } },
    { texto: "Con Cerca de mí, la lista se ordena por distancia desde donde estás. Arriba de la lista elegís hasta qué distancia mirar.",
      hacer: async (a, p) => { await a.tocar(p.getByLabel("Limpiar búsqueda")); await a.tocar(p.getByRole("button", { name: /Cerca de m/ }).first()); await esperar(3000); await a.tocar(p.getByRole("button", { name: "500 m" })); await esperar(2500); await a.tocar(p.getByRole("button", { name: "Toda la ciudad" })); } },
    { texto: "En los filtros podés ver un solo tipo de lugar, solo los accesibles, o los que tienen baño adaptado, rampa o ascensor.",
      hacer: async (a, p) => {
        await a.tocar(p.getByLabel("Ver filtros")); const f = p.getByRole("region", { name: "Filtros" });
        await esperar(800); await a.tocar(f.getByRole("button", { name: "Restaurantes" })); await esperar(1200);
        await a.tocar(f.getByRole("button", { name: "Accesible", exact: true })); await esperar(2500);
        await a.tocar(f.getByRole("button", { name: "Todos" }).first()); await a.tocar(f.getByRole("button", { name: "Todos" }).nth(1));
        await a.tocar(p.getByLabel("Ocultar filtros"));
      } },
    { texto: "El botón Rampas muestra las rampas y los cruces accesibles de la vereda, para planificar mejor el camino.",
      hacer: async (a, p) => {
        await a.tocar(p.getByRole("button", { name: /Cerca de m/ }).first()); // apaga "Cerca de mí"
        await a.tocar(p.getByRole("button", { name: /Rampas/ }).first()); await esperar(1500);
        await a.dobleClic(ANCHO * 0.62, ALTO * 0.6); await esperar(4500); await a.tocar(p.getByRole("button", { name: /Rampas/ }).first());
      } },

    // ---------- Parte 2: colaborar ----------
    { texto: "Ahora, cómo colaborar. Cualquier persona puede sumar datos, sin registrarse.",
      hacer: async (a) => { await a.titulo("Cómo colaborar", "Sumá lo que sabés de un lugar", 0); } },
    { texto: "Abrí la ficha del lugar y bajá hasta, ¿Conocés este lugar? Marcá lo que viste: si se puede entrar en silla de ruedas, si tiene baño adaptado, rampa o ascensor. Si querés, dejá un comentario, y tocá Enviar sugerencia. El equipo la revisa antes de publicarla.",
      hacer: async (a, p) => {
        await a.quitarTitulo();
        await a.escribir(p.getByLabel("Buscar un lugar por nombre"), "cairo", 140); await esperar(700); await a.tocar(p.getByRole("option").first());
        await esperar(1500); await a.mostrar(p.getByText(/Conocés este lugar/).first()); await esperar(1200);
        const d = p.getByRole("dialog").first();
        await a.tocar(d.getByRole("group", { name: "Acceso en silla de ruedas" }).getByRole("button", { name: "Accesible" }));
        await a.tocar(d.getByRole("button", { name: "Sí", exact: true }).first());
        await a.escribir(d.getByLabel("Comentario (opcional)"), "La entrada no tiene escalones.", 70);
        await a.tocar(d.getByRole("button", { name: "Enviar sugerencia" })); await esperar(3000);
        await a.tocar(d.getByLabel("Cerrar").first());
      } },

    // ---------- Parte 3: el equipo ----------
    { texto: "Las personas del equipo entran con el candadito de arriba, con el email y la contraseña que les da el responsable del proyecto.",
      hacer: async (a, p) => {
        await a.tocar(p.getByLabel("Acceso de administrador"));
        await a.escribir(p.getByLabel("Email"), "equipo@ejemplo.com", 70);
        await a.escribir(p.getByLabel("Contraseña"), "demostracion", 70);
        await a.tocar(p.getByRole("button", { name: "Ingresar" }));
      } },
    { texto: "Al entrar, el candadito se pone verde y aparecen las herramientas del equipo: Relevar, Sugerencias, Agregar lugar y Análisis.",
      hacer: async (a, p) => { await esperar(1500); await a.posar(p.getByRole("button", { name: /Relevar/ })); await esperar(1500); await a.posar(p.getByRole("button", { name: /Análisis/ })); } },
    { texto: "Relevar es para salir a la calle. La app ordena los lugares por cercanía y marca los que todavía no tienen datos. Elegís uno, tocás si es accesible y el detalle, y Guardar. Queda publicado al instante.",
      hacer: async (a, p) => {
        await a.tocar(p.getByRole("button", { name: /Relevar/ })); await esperar(2500);
        const r = p.getByRole("dialog", { name: "Modo relevamiento" });
        await a.tocar(r.getByRole("button").filter({ hasText: "a relevar" }).first()); await esperar(1200);
        await a.tocar(r.getByRole("button", { name: "Parcial", exact: true }));
        await a.tocar(r.getByRole("button", { name: "Sí", exact: true }).first());
        await a.tocar(r.getByRole("button", { name: "No", exact: true }).nth(2));
        await a.tocar(r.getByRole("button", { name: /Guardar y volver/ })); await esperar(1800);
        await a.tocar(p.getByLabel("Cerrar relevamiento"));
      } },
    { texto: "En Sugerencias está lo que mandó el público. Si está bien, tocás Aprobar y se publica en el mapa; si no, Rechazar.",
      hacer: async (a, p) => {
        await a.tocar(p.getByRole("button", { name: /Sugerencias/ })); await esperar(2500);
        const s = p.getByRole("dialog", { name: "Sugerencias pendientes" });
        await a.tocar(s.getByRole("button", { name: /Aprobar/ }).first()); await esperar(2000);
        await a.tocar(s.getByLabel("Cerrar"));
      } },
    { texto: "Con Agregar lugar sumás uno nuevo: el nombre, el tipo y la ubicación, que podés marcar tocando el mapa. Y en Análisis ves cuántos lugares ya tienen datos y cuántos faltan relevar.",
      hacer: async (a, p) => {
        await a.tocar(p.getByRole("button", { name: /Agregar lugar/ })); await esperar(4000);
        await a.tocar(p.getByRole("dialog").getByLabel("Cerrar").first()); await esperar(500);
        await a.tocar(p.getByRole("button", { name: /Análisis/ })); await esperar(4500);
        await a.tocar(p.getByRole("dialog", { name: /Análisis/ }).getByLabel("Cerrar"));
      } },
    { texto: "Para salir, tocá otra vez el candadito.",
      hacer: async (a, p) => { await a.tocar(p.getByLabel("Salir del modo administrador")); } },

    // ---------- Cierre ----------
    { texto: "Y si tenés una consulta, escribinos por WhatsApp o por mail. Gracias por ayudar a que Rosario sea más accesible.",
      hacer: async (a, p) => { await a.tocar(p.getByLabel(/Escribinos por WhatsApp/).first()); await esperar(3500); await p.keyboard.press("Escape"); await esperar(800); await a.titulo("Rosario Access Map", "access-app-rosario.vercel.app", 5000); } },
  ],
};
