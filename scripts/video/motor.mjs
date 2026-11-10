// MOTOR DE LOS VIDEOS DE ROSARIO ACCESS MAP
// Graba la app de verdad (con un navegador automático), le pone un puntero que muestra dónde se toca,
// subtítulos y una voz argentina (edge-tts), y arma el .mp4. Lo usan los guiones de esta carpeta.
//
// La base de datos (Supabase) se SIMULA durante la grabación: el login usa un usuario de demostración, las
// sugerencias que aparecen son de ejemplo y nada de lo que se "guarda" llega a la base de datos real.
import { chromium } from "playwright-core";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

export const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find((c) => fs.existsSync(c));
const duracion = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString()) * 1000;

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
      #tut-sub{position:fixed;left:50%;bottom:var(--sub-abajo,26px);transform:translateX(-50%);width:max-content;max-width:var(--sub-ancho,78%);
        padding:10px 18px;border-radius:12px;background:rgba(6,21,61,.88);color:#fff;
        font:600 var(--sub-letra,21px)/1.35 'Plus Jakarta Sans',system-ui,sans-serif;text-align:center;
        z-index:2147483645;pointer-events:none;transition:opacity .25s}
      #tut-sub:empty{opacity:0}
      #tut-tit{position:fixed;inset:0;z-index:2147483647;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
        padding:0 24px;text-align:center;background:linear-gradient(135deg,#06153D,#032761 60%,#0B3A7E);color:#fff;
        font-family:'Plus Jakarta Sans',system-ui,sans-serif;transition:opacity .6s;pointer-events:none}
      #tut-tit h1{margin:0;font-size:clamp(30px,6.5vw,52px);font-weight:800;letter-spacing:-1px;line-height:1.1}
      #tut-tit p{margin:0;font-size:clamp(17px,2vw,24px);color:#75BDFF;font-weight:600}
      #tut-tit .logo{width:72px;height:72px;border-radius:20px;background:linear-gradient(135deg,#06153D,#1E8FD9);
        box-shadow:0 0 0 2px rgba(255,255,255,.25);display:flex;align-items:center;justify-content:center;margin-bottom:6px}
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
    async escribir(loc, texto, pausa = 120) { const [x, y] = await centro(loc); await mover(x, y); await onda(); await loc.click(); await loc.fill(""); await loc.pressSequentially(texto, { delay: pausa }); },
    async posar(loc) { const [x, y] = await centro(loc); const b = await loc.boundingBox(); const yy = b.y + b.height / 3; await mover(x, yy); await p.mouse.move(x, yy, { steps: 6 }); },
    async dobleClic(x, y) { await mover(x, y); await onda(); await p.mouse.dblclick(x, y); },
    async mostrar(loc) { await loc.evaluate((e) => e.scrollIntoView({ behavior: "smooth", block: "center" })); await esperar(1200); const [x, y] = await centro(loc); await mover(x, y); },
    async deslizar(loc, dy, ms) {
      await loc.evaluate((e, [dy, ms]) => new Promise((ok) => {
        const y0 = e.scrollTop, t0 = performance.now();
        const paso = (t) => { const k = Math.min(1, (t - t0) / ms); e.scrollTop = y0 + dy * (0.5 - Math.cos(Math.PI * k) / 2); k < 1 ? requestAnimationFrame(paso) : ok(); };
        requestAnimationFrame(paso);
      }), [dy, ms]);
    },
    // Pantalla de título (con el logo de la app). Si `ms` es 0 queda puesta hasta llamar a quitarTitulo().
    async titulo(t, sub, ms) {
      await p.evaluate(([t, sub]) => {
        const d = document.createElement("div"); d.id = "tut-tit";
        d.innerHTML = `<div class="logo"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg></div><h1></h1><p></p>`;
        d.querySelector("h1").textContent = t; d.querySelector("p").textContent = sub; document.body.appendChild(d);
      }, [t, sub]);
      if (ms) { await esperar(ms); await this.quitarTitulo(); }
    },
    async quitarTitulo() {
      await p.evaluate(() => { const d = document.getElementById("tut-tit"); if (d) { d.style.opacity = "0"; setTimeout(() => d.remove(), 700); } });
      await esperar(700);
    },
  };
}

// Subtítulos: la frase se reparte en partes cortas, cada una el tiempo proporcional a su largo
async function subtitular(p, texto, ms) {
  const partes = texto.match(/[^.:;?!]+[.:;?!]?/g).map((x) => x.trim()).filter(Boolean);
  const total = partes.reduce((s, x) => s + x.length, 0);
  for (const parte of partes) {
    await p.evaluate((t) => { document.getElementById("tut-sub").textContent = t; }, parte);
    await esperar((ms * parte.length) / total);
  }
  await p.evaluate(() => { document.getElementById("tut-sub").textContent = ""; });
}

// ---------- Base de datos simulada (nada sale hacia Supabase) ----------
function jwtFalso(email) {
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 86400;
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: "00000000-0000-4000-8000-000000000001", email, role: "authenticated", aud: "authenticated", exp })}.firma-de-demostracion`;
}
async function simularNube(ctx, ejemplos) {
  let pendientes = [...(ejemplos || [])];
  await ctx.route(/\/(auth|rest|storage)\/v1\//, async (route) => {
    const req = route.request(), url = req.url(), metodo = req.method();
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (url.includes("/auth/v1/token")) {
      let email = "equipo@ejemplo.com";
      try { email = JSON.parse(req.postData() || "{}").email || email; } catch (e) {}
      const user = { id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated", email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
      return json({ access_token: jwtFalso(email), token_type: "bearer", expires_in: 86400, expires_at: Math.floor(Date.now() / 1000) + 86400, refresh_token: "demo", user });
    }
    if (url.includes("/auth/v1/logout")) return route.fulfill({ status: 204, body: "" });
    if (url.includes("/auth/v1/")) return json({});
    if (url.includes("/rest/v1/access_suggestions")) {
      if (metodo === "GET") return json(pendientes);
      const id = (url.match(/id=eq\.([^&]+)/) || [])[1];
      if (id) pendientes = pendientes.filter((s) => String(s.id) !== decodeURIComponent(id));
      return json([], 201);
    }
    if (metodo === "GET" || metodo === "HEAD") return json([]);
    return json([], 201);   // altas y cambios: se responden "ok" sin guardar nada
  });
}

// ---------- Grabar un guion ----------
// g = { nombre, salida, voz, velocidad, ancho, alto, escala, letra, subAbajo, subAncho, ubicacion, sugerenciasEjemplo, escenas }
export async function grabar(g, { raiz, puerto }) {
  const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "video-mapa-"));
  const salida = path.join(raiz, g.salida);

  console.log(`\n== ${g.nombre} ==`);
  console.log("1/4 Generando la voz…");
  g.escenas.forEach((e, i) => {
    e.audio = path.join(TMP, `voz-${i}.mp3`);
    execFileSync("python", ["-m", "edge_tts", "--voice", g.voz, `--rate=${g.velocidad || "-4%"}`, "--text", e.voz || e.texto, "--write-media", e.audio], { stdio: "ignore" });
    e.ms = duracion(e.audio);
  });

  console.log("2/4 Grabando la app…");
  const nav = await chromium.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const escala = g.escala || 1;
  // Celular (escala > 1): la grabación común sale a la mitad de tamaño, así que se capturan los cuadros de la
  // pantalla uno por uno en alta resolución. Computadora: grabación común.
  const cuadros = escala > 1 ? [] : null;
  const ctx = await nav.newContext({
    viewport: { width: g.ancho, height: g.alto }, deviceScaleFactor: escala, isMobile: escala > 1, hasTouch: escala > 1,
    locale: "es-AR", serviceWorkers: "block", geolocation: g.ubicacion, permissions: ["geolocation"],
    ...(cuadros ? {} : { recordVideo: { dir: TMP, size: { width: g.ancho, height: g.alto } } }),
  });
  await simularNube(ctx, g.sugerenciasEjemplo);
  const p = await ctx.newPage();
  if (cuadros) {
    const cdp = await ctx.newCDPSession(p);
    cdp.on("Page.screencastFrame", (f) => {
      const archivo = path.join(TMP, `c${String(cuadros.length).padStart(6, "0")}.jpg`);
      fs.writeFileSync(archivo, Buffer.from(f.data, "base64"));
      cuadros.push({ archivo, t: Date.now() });
      cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: g.ancho * escala, maxHeight: g.alto * escala, everyNthFrame: 1 });
  }
  const t0 = Date.now();
  await p.goto(`http://localhost:${puerto}/`);
  await p.waitForFunction(() => { const a = document.querySelector(".leaflet-control-attribution"); return a && a.innerText.includes("OpenFreeMap") && !a.innerText.includes("Esri"); }, null, { timeout: 60000 }).catch(() => {});
  await p.evaluate(CAPA);
  await p.evaluate(([l, ab, an]) => { const r = document.documentElement.style; r.setProperty("--sub-letra", l); r.setProperty("--sub-abajo", ab); r.setProperty("--sub-ancho", an); }, [g.letra || "21px", g.subAbajo || "26px", g.subAncho || "78%"]);
  const a = acciones(p);
  if (g.preparar) await g.preparar(a, p);
  await esperar(1200);
  const inicio = Date.now() - t0;   // desde acá empieza el video final
  for (const [i, e] of g.escenas.entries()) {
    e.desde = Date.now() - t0;
    console.log(`   escena ${i + 1} de ${g.escenas.length}`);
    const hecho = e.hacer(a, p, e.ms).catch((err) => console.log(`   (escena ${i + 1}: ${err.message.split("\n")[0]})`));
    await Promise.all([hecho, subtitular(p, e.texto, e.ms)]);
    await esperar(e.pausa ?? 600);
  }
  await esperar(800);
  const fin = Date.now() - t0;
  let webm, desdeSeg = (inicio / 1000).toFixed(2), hastaSeg = (fin / 1000).toFixed(2);
  if (cuadros) {
    // Los cuadros llegan solo cuando cambia algo: cada uno dura hasta que llega el siguiente
    await ctx.close(); await nav.close();
    const desde = t0 + inicio, hasta = t0 + fin;
    let i0 = cuadros.findLastIndex((c) => c.t <= desde); if (i0 < 0) i0 = 0;
    const usados = cuadros.slice(i0).filter((c) => c.t < hasta);
    const lista = usados.map((c, k) => {
      const ini = Math.max(c.t, desde), sig = k + 1 < usados.length ? usados[k + 1].t : hasta;
      return `file '${c.archivo.replace(/\\/g, "/")}'\nduration ${((sig - ini) / 1000).toFixed(3)}`;
    });
    lista.push(`file '${usados[usados.length - 1].archivo.replace(/\\/g, "/")}'`);
    fs.writeFileSync(path.join(TMP, "cuadros.txt"), lista.join("\n"));
    webm = path.join(TMP, "pantalla.mp4");
    execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", path.join(TMP, "cuadros.txt"), "-vf", `scale=${g.ancho * escala}:${g.alto * escala}:flags=lanczos,fps=25,format=yuv420p`,
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", webm], { stdio: "ignore" });
    desdeSeg = "0"; hastaSeg = ((fin - inicio) / 1000).toFixed(2);
  } else {
    webm = await p.video().path();
    await ctx.close(); await nav.close();
  }

  console.log("3/4 Armando el video…");
  const entradas = ["-y", "-ss", desdeSeg, "-to", hastaSeg, "-i", webm];
  const filtros = [];
  g.escenas.forEach((e, i) => {
    const d = Math.max(0, Math.round(e.desde - inicio));
    entradas.push("-i", e.audio); filtros.push(`[${i + 1}:a]adelay=${d}|${d}[v${i}]`);
  });
  filtros.push(`${g.escenas.map((_, i) => `[v${i}]`).join("")}amix=inputs=${g.escenas.length}:normalize=0[voz]`);
  execFileSync("ffmpeg", [...entradas, "-filter_complex", filtros.join(";"), "-map", "0:v", "-map", "[voz]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-r", "25", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", salida], { stdio: "ignore" });

  fs.rmSync(TMP, { recursive: true, force: true });
  const mb = (fs.statSync(salida).size / 1048576).toFixed(1);
  console.log(`4/4 Listo: "${g.salida}" (${Math.round((fin - inicio) / 1000)} segundos, ${mb} MB).`);
}
