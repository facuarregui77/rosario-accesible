// VIDEO TUTORIAL DE ROSARIO ACCESS MAP
// Graba la app de verdad (con un navegador automático), le pone un puntero que muestra dónde se toca,
// subtítulos y una voz argentina que narra (edge-tts), y arma "VIDEO TUTORIAL.mp4" en la carpeta del proyecto.
//
// Uso: doble clic en "GENERAR VIDEO.bat" (o: npm run build && node scripts/video/grabar-tutorial.mjs)
// Requisitos: Google Chrome, ffmpeg (winget install Gyan.FFmpeg) y edge-tts (python -m pip install edge-tts).
// Para cambiar lo que se dice o se muestra, editá la lista ESCENAS de abajo.
import { chromium } from "playwright-core";
import { spawn, execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SALIDA = path.join(RAIZ, "VIDEO TUTORIAL.mp4");
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "video-mapa-"));
const VOZ = "es-AR-ElenaNeural";
const PUERTO = 5288;
const ANCHO = 1280, ALTO = 720;
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find((c) => fs.existsSync(c));
const UBICACION = { latitude: -32.94782, longitude: -60.6541 }; // Auckland, Bv. Oroño 1121 (punto de partida de "Cerca de mí" y "Cómo llego")

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

// ---------- Guion: lo que se dice y lo que se hace en cada escena ----------
const ESCENAS = [
  { texto: "Hola. Este es Rosario Access Map, un mapa gratuito que muestra qué tan accesibles son los lugares de Rosario: bares, restaurantes, escuelas, clubes, hospitales y oficinas públicas. Te mostramos cómo usarlo.",
    hacer: async (a) => { await a.titulo("Cómo usar Rosario Access Map", "access-app-rosario.vercel.app", 4500); } },
  { texto: "Cada pin es un lugar. El color y el dibujito dicen qué tipo de lugar es, y el circulito de la esquina dice si es accesible: verde, accesible; amarillo, parcial; rojo, sin acceso; y gris, todavía sin datos.",
    hacer: async (a, p, ms) => { await a.tocar(p.getByLabel("Ver leyenda del mapa")); await esperar(ms - 4500); await a.tocar(p.getByLabel("Cerrar leyenda")); } },
  { texto: "Para encontrar un lugar, escribí su nombre en el buscador y elegilo de la lista.",
    hacer: async (a, p) => { await a.escribir(p.getByLabel("Buscar un lugar por nombre"), "comedia"); await esperar(900); await a.tocar(p.getByRole("option").first()); } },
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
  { texto: "Si conocés un lugar, contanos cómo es: en su ficha tocá, ¿Conocés este lugar?, y marcá lo que viste. El equipo lo revisa antes de publicarlo.",
    hacer: async (a, p) => {
      await a.escribir(p.getByLabel("Buscar un lugar por nombre"), "cairo"); await esperar(800); await a.tocar(p.getByRole("option").first());
      await esperar(1800); await a.mostrar(p.getByText(/Conocés este lugar/).first()); await esperar(4500); await a.tocar(p.getByRole("dialog").getByLabel("Cerrar").first());
    } },
  { texto: "Y si tenés una consulta, escribinos por WhatsApp o por mail. Gracias por ayudar a que Rosario sea más accesible.",
    hacer: async (a, p) => { await a.tocar(p.getByLabel(/Escribinos por WhatsApp/).first()); await esperar(3500); await p.keyboard.press("Escape"); await esperar(800); await a.titulo("Rosario Access Map", "access-app-rosario.vercel.app", 5000); } },
];

// ---------- Puntero, subtítulos y carteles dentro de la página ----------
const CAPA = `
  (() => {
    if (document.getElementById("tut-cursor")) return;
    const st = document.createElement("style");
    st.textContent = \`
      #tut-cursor{position:fixed;left:-50px;top:-50px;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;
        background:rgba(51,160,255,.45);border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.45);z-index:2147483646;
        pointer-events:none;transition:left .7s cubic-bezier(.4,0,.2,1),top .7s cubic-bezier(.4,0,.2,1)}
      #tut-cursor.toca::after{content:"";position:absolute;inset:-12px;border-radius:50%;border:3px solid #33A0FF;animation:tutonda .5s ease-out}
      @keyframes tutonda{from{transform:scale(.4);opacity:1}to{transform:scale(1.4);opacity:0}}
      #tut-sub{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);max-width:78%;padding:10px 18px;border-radius:12px;
        background:rgba(6,21,61,.86);color:#fff;font:600 21px/1.35 'Plus Jakarta Sans',system-ui,sans-serif;text-align:center;
        z-index:2147483645;pointer-events:none;transition:opacity .25s}
      #tut-sub:empty{opacity:0}
      #tut-tit{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
        background:linear-gradient(135deg,#06153D,#032761 60%,#0B3A7E);color:#fff;font-family:'Plus Jakarta Sans',system-ui,sans-serif;
        transition:opacity .6s;pointer-events:none}
      #tut-tit h1{margin:0;font-size:52px;font-weight:800;letter-spacing:-1px}
      #tut-tit p{margin:0;font-size:24px;color:#75BDFF;font-weight:600}
    \`;
    document.head.appendChild(st);
    const c = document.createElement("div"); c.id = "tut-cursor"; document.body.appendChild(c);
    const s = document.createElement("div"); s.id = "tut-sub"; document.body.appendChild(s);
  })();`;

function acciones(p) {
  const mover = async (x, y) => { await p.evaluate(([x, y]) => { const c = document.getElementById("tut-cursor"); c.style.left = x + "px"; c.style.top = y + "px"; }, [x, y]); await esperar(800); };
  const onda = async () => { await p.evaluate(() => { const c = document.getElementById("tut-cursor"); c.classList.remove("toca"); void c.offsetWidth; c.classList.add("toca"); }); };
  const centro = async (loc) => {
    await loc.waitFor({ state: "visible", timeout: 15000 });
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    const b = await loc.boundingBox();
    return [b.x + b.width / 2, b.y + b.height / 2];
  };
  return {
    async tocar(loc) { const [x, y] = await centro(loc); await mover(x, y); await onda(); await loc.click({ timeout: 8000 }); await esperar(500); },
    async escribir(loc, texto) { const [x, y] = await centro(loc); await mover(x, y); await onda(); await loc.click(); await loc.fill(""); await loc.pressSequentially(texto, { delay: 140 }); },
    async dobleClic(x, y) { await mover(x, y); await onda(); await p.mouse.dblclick(x, y); },
    async mostrar(loc) { await loc.evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "center" })); await esperar(1200); const [x, y] = await centro(loc); await mover(x, y); },
    async deslizar(loc, dy, ms) {
      await loc.evaluate((e, [dy, ms]) => new Promise((ok) => {
        const y0 = e.scrollTop, t0 = performance.now();
        const paso = (t) => { const k = Math.min(1, (t - t0) / ms); e.scrollTop = y0 + dy * (0.5 - Math.cos(Math.PI * k) / 2); k < 1 ? requestAnimationFrame(paso) : ok(); };
        requestAnimationFrame(paso);
      }), [dy, ms]);
    },
    async titulo(t, sub, ms) {
      await p.evaluate(([t, sub]) => { const d = document.createElement("div"); d.id = "tut-tit"; d.innerHTML = `<h1></h1><p></p>`; d.querySelector("h1").textContent = t; d.querySelector("p").textContent = sub; document.body.appendChild(d); }, [t, sub]);
      await esperar(ms);
      await p.evaluate(() => { const d = document.getElementById("tut-tit"); if (d) { d.style.opacity = "0"; setTimeout(() => d.remove(), 700); } });
      await esperar(700);
    },
  };
}

// Subtítulos: la frase se reparte en partes cortas, cada una el tiempo proporcional a su largo
async function subtitular(p, texto, ms) {
  const partes = texto.match(/[^.:;?]+[.:;?]?/g).map((x) => x.trim()).filter(Boolean);
  const total = partes.reduce((s, x) => s + x.length, 0);
  for (const parte of partes) {
    await p.evaluate((t) => { document.getElementById("tut-sub").textContent = t; }, parte);
    await esperar((ms * parte.length) / total);
  }
  await p.evaluate(() => { document.getElementById("tut-sub").textContent = ""; });
}

const duracion = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString()) * 1000;

// ---------- 1) Voz ----------
console.log("1/4 Generando la voz…");
ESCENAS.forEach((e, i) => {
  e.audio = path.join(TMP, `voz-${i}.mp3`);
  execFileSync("python", ["-m", "edge_tts", "--voice", VOZ, "--rate=-4%", "--text", e.texto, "--write-media", e.audio], { stdio: "ignore" });
  e.ms = duracion(e.audio);
});

// ---------- 2) Grabación ----------
console.log("2/4 Grabando la app (unos 3 minutos)…");
const servidor = spawn(`npx vite preview --port ${PUERTO} --strictPort`, { cwd: RAIZ, shell: true });
await esperar(5000);
const nav = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await nav.newContext({ viewport: { width: ANCHO, height: ALTO }, deviceScaleFactor: 1, locale: "es-AR", serviceWorkers: "block",
  geolocation: UBICACION, permissions: ["geolocation"], recordVideo: { dir: TMP, size: { width: ANCHO, height: ALTO } } });
const p = await ctx.newPage();
const t0 = Date.now();
await p.goto(`http://localhost:${PUERTO}/`);
// esperar a que cargue el mapa con estilo (si no, queda el de respaldo igual)
await p.waitForFunction(() => { const a = document.querySelector(".leaflet-control-attribution"); return a && a.innerText.includes("OpenFreeMap") && !a.innerText.includes("Esri"); }, null, { timeout: 60000 }).catch(() => {});
await p.evaluate(CAPA);
await esperar(1500);
const inicio = Date.now() - t0;   // desde acá empieza el video final
const a = acciones(p);
for (const [i, e] of ESCENAS.entries()) {
  e.desde = Date.now() - t0;
  console.log(`   escena ${i + 1} de ${ESCENAS.length}`);
  const hecho = e.hacer(a, p, e.ms).catch((err) => console.log(`   (escena ${i + 1}: ${err.message.split("\n")[0]})`));
  await Promise.all([hecho, subtitular(p, e.texto, e.ms)]);
  await esperar(600);
}
await esperar(800);
const fin = Date.now() - t0;
const webm = await p.video().path();
await ctx.close(); await nav.close();
servidor.kill(); if (process.platform === "win32") { try { execFileSync("taskkill", ["/pid", String(servidor.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} }

// ---------- 3) Mezcla de imagen y voz ----------
console.log("3/4 Armando el video…");
const entradas = ["-y", "-ss", (inicio / 1000).toFixed(2), "-to", (fin / 1000).toFixed(2), "-i", webm];
const filtros = [];
ESCENAS.forEach((e, i) => { entradas.push("-i", e.audio); filtros.push(`[${i + 1}:a]adelay=${Math.max(0, Math.round(e.desde - inicio))}|${Math.max(0, Math.round(e.desde - inicio))}[v${i}]`); });
filtros.push(`${ESCENAS.map((_, i) => `[v${i}]`).join("")}amix=inputs=${ESCENAS.length}:normalize=0[voz]`);
execFileSync("ffmpeg", [...entradas, "-filter_complex", filtros.join(";"), "-map", "0:v", "-map", "[voz]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", "-r", "25", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", SALIDA], { stdio: "ignore" });

// ---------- 4) Listo ----------
fs.rmSync(TMP, { recursive: true, force: true });
const mb = (fs.statSync(SALIDA).size / 1048576).toFixed(1);
console.log(`4/4 Listo: "VIDEO TUTORIAL.mp4" (${Math.round((fin - inicio) / 1000)} segundos, ${mb} MB).`);
process.exit(0);
