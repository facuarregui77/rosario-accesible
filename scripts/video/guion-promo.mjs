// GUION DEL VIDEO PROMOCIONAL (vertical, para redes: Reels, Stories, TikTok, estados de WhatsApp)
// Contado desde la mirada de quien usa la app, en un celular. Dura alrededor de un minuto.
// `voz` (opcional) es cómo se pronuncia cuando difiere de lo que se lee en el subtítulo.
import { esperar } from "./motor.mjs";

export default {
  nombre: "Video promocional",
  salida: "VIDEO PROMOCIONAL.mp4",
  voz: "es-AR-TomasNeural",
  velocidad: "+2%",
  ancho: 360, alto: 640, escala: 2,          // celular; el video sale de 720 x 1280
  letra: "17px", subAbajo: "150px", subAncho: "90%",
  ubicacion: { latitude: -32.94782, longitude: -60.6541 },
  escenas: [
    { texto: "¿Alguna vez llegaste a un lugar y no pudiste entrar?",
      hacer: async (a) => { await a.titulo("¿Se puede entrar?", "Saberlo antes de salir de casa", 0); } },
    { texto: "Con Rosario Access Map lo sabés antes de salir. Es gratis y no hace falta registrarse.",
      hacer: async (a, p) => { await a.quitarTitulo(); await esperar(1500); } },
    { texto: "¿Querés salir a comer? Elegí restaurantes, y mirá solo los que son accesibles.",
      hacer: async (a, p) => {
        await a.tocar(p.getByLabel("Ver filtros")); const f = p.getByRole("region", { name: "Filtros" }); await esperar(500);
        await a.tocar(f.getByRole("button", { name: "Restaurantes" }));
        await a.tocar(f.getByRole("button", { name: "Accesible", exact: true })); await esperar(800);
        await a.tocar(p.getByLabel("Ver la lista de lugares"));
      } },
    { texto: "Tocás uno y su ficha te cuenta si se puede entrar en silla de ruedas, si tiene rampa, baño adaptado o ascensor, y cómo contactarlo.",
      hacer: async (a, p) => {
        await a.tocar(p.getByRole("navigation", { name: "Lista de lugares" }).getByRole("button").first()); await esperar(1800);
        await esperar(1500); await a.deslizar(p.getByRole("dialog").first(), 330, 3500); await esperar(1500);
      } },
    { texto: "Y te lleva hasta la puerta: en silla de ruedas, a pie, en bici, en auto o en colectivo, con los minutos de cada uno.",
      hacer: async (a, p) => {
        await a.deslizar(p.getByRole("dialog").first(), -330, 800);
        await a.tocar(p.getByRole("button", { name: /Cómo llego/ })); await esperar(4500);
        await a.tocar(p.getByRole("tab", { name: /colectivo/ })); await esperar(2500);
      } },
    { texto: "¿Ya estás en la calle? Tocá Cerca de mí y mirá qué hay accesible a tu alrededor.",
      hacer: async (a, p) => {
        await a.tocar(p.getByLabel("Cerrar Cómo llego"));
        // se sacan los filtros de antes (restaurantes accesibles) para ver todo lo que hay cerca
        await a.tocar(p.getByLabel("Ver filtros")); const f = p.getByRole("region", { name: "Filtros" }); await esperar(400);
        await a.tocar(f.getByRole("button", { name: "Todos" }).first()); await a.tocar(f.getByRole("button", { name: "Todos" }).nth(1));
        await a.tocar(p.getByRole("button", { name: /Cerca de m/ }).first()); await esperar(3000);
      } },
    { texto: "¿Conocés un lugar? Contá cómo es. Entre todos, el mapa crece.",
      hacer: async (a, p) => {
        await a.tocar(p.getByRole("navigation", { name: "Lista de lugares" }).getByRole("button").filter({ hasText: "Auckland" }).first());
        await esperar(1200); await a.mostrar(p.getByText(/Conocés este lugar/).first());
        const d = p.getByRole("dialog").first();
        await a.tocar(d.getByRole("group", { name: "Acceso en silla de ruedas" }).getByRole("button", { name: "Accesible" }));
      } },
    { texto: "Rosario Access Map. Gratis, sin registrarte, en access-app-rosario.vercel.app",
      voz: "Rosario Access Map. Gratis y sin registrarte. Entrá en access app rosario, punto vercel, punto app.",
      hacer: async (a) => { await a.titulo("Rosario Access Map", "access-app-rosario.vercel.app", 0); await esperar(4500); } },
  ],
};
