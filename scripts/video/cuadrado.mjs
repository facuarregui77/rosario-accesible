// VERSIÓN CUADRADA DEL VIDEO PROMOCIONAL (1080 x 1080, para el muro de Instagram y Facebook)
// Toma "VIDEO PROMOCIONAL.mp4" (vertical) y lo pone dentro de un celular a la izquierda, con el nombre de la
// app, para qué sirve y la dirección a la derecha. Arma "VIDEO PROMOCIONAL CUADRADO.mp4".
import { chromium } from "playwright-core";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const L = 1080;                                   // lado del cuadrado
const VH = 992, VW = Math.round((VH * 9) / 16 / 2) * 2;   // video dentro del celular (558 x 992)
const VX = 72, VY = Math.round((L - VH) / 2);     // dónde va el video
const BORDE = 12, RADIO = 46;                     // marco del celular

export async function armarCuadrado(raiz, chrome) {
  const vertical = path.join(raiz, "VIDEO PROMOCIONAL.mp4");
  const salida = path.join(raiz, "VIDEO PROMOCIONAL CUADRADO.mp4");
  if (!fs.existsSync(vertical)) throw new Error("Falta VIDEO PROMOCIONAL.mp4: generalo primero.");
  console.log("\n== Video promocional cuadrado ==");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "video-cuadrado-"));
  const fuente = fs.readFileSync(path.join(raiz, "scripts/guia/fonts/PlusJakartaSans.woff2")).toString("base64");

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:J;src:url(data:font/woff2;base64,${fuente}) format("woff2");font-weight:400 800}
    *{box-sizing:border-box}
    body{margin:0;width:${L}px;height:${L}px;overflow:hidden;font-family:J,system-ui,sans-serif;color:#fff;
      background:radial-gradient(circle at 85% 10%,rgba(51,160,255,.35),transparent 45%),linear-gradient(150deg,#06153D 0%,#032761 55%,#0B3A7E 100%)}
    .tel{position:absolute;left:${VX - BORDE}px;top:${VY - BORDE}px;width:${VW + 2 * BORDE}px;height:${VH + 2 * BORDE}px;
      border-radius:${RADIO + BORDE}px;background:#0b0f1a;box-shadow:0 30px 70px rgba(0,0,0,.5),0 0 0 2px rgba(255,255,255,.12)}
    .col{position:absolute;left:${VX + VW + BORDE + 44}px;right:44px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;gap:26px}
    .logo{width:84px;height:84px;border-radius:24px;background:linear-gradient(135deg,#0B3A7E,#1E8FD9);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(255,255,255,.2)}
    h1{margin:0;font-size:46px;line-height:1.05;font-weight:800;letter-spacing:-1px}
    h1 span{color:#75BDFF}
    .tag{margin:0;font-size:25px;line-height:1.3;font-weight:600;color:#E2ECF5}
    ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
    li{display:flex;gap:12px;align-items:flex-start;font-size:21px;line-height:1.3;font-weight:500;color:#fff}
    li i{flex:none;width:28px;height:28px;border-radius:50%;background:#33A0FF;display:flex;align-items:center;justify-content:center;margin-top:-1px}
    .url{align-self:flex-start;background:#33A0FF;color:#06153D;font-weight:800;font-size:19px;padding:12px 20px;border-radius:30px}
  </style></head><body>
    <div class="tel"></div>
    <div class="col">
      <div class="logo"><svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg></div>
      <h1>Rosario<br><span>Access Map</span></h1>
      <p class="tag">¿Se puede entrar? Sabelo antes de salir de casa.</p>
      <ul>
        ${["Lugares accesibles de Rosario", "Rampa, baño adaptado y ascensor", "Cómo llegar en silla, a pie o en colectivo", "Gratis y sin registrarte"]
          .map((t) => `<li><i><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06153D" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></i>${t}</li>`).join("")}
      </ul>
      <div class="url">access-app-rosario.vercel.app</div>
    </div>
  </body></html>`;

  // Fondo y "frente" (el mismo fondo con un agujero de puntas redondeadas donde va el video)
  const nav = await chromium.launch({ executablePath: chrome, headless: true });
  const p = await nav.newPage({ viewport: { width: L, height: L } });
  await p.setContent(html); await p.evaluate(() => document.fonts.ready);
  const fondo = path.join(tmp, "fondo.png"), frente = path.join(tmp, "frente.png");
  const png = await p.screenshot({ path: fondo });
  const conAgujero = await p.evaluate(async ([b64, x, y, w, h, r]) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
    const g = c.getContext("2d"); g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "destination-out"; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    return c.toDataURL("image/png").split(",")[1];
  }, [png.toString("base64"), VX, VY, VW, VH, RADIO]);
  fs.writeFileSync(frente, Buffer.from(conAgujero, "base64"));
  await nav.close();

  execFileSync("ffmpeg", ["-y", "-loop", "1", "-i", fondo, "-i", vertical, "-loop", "1", "-i", frente,
    "-filter_complex", `[1:v]scale=${VW}:${VH}:flags=lanczos[v];[0:v][v]overlay=${VX}:${VY}:shortest=1[a];[a][2:v]overlay=0:0:shortest=1,format=yuv420p[o]`,
    "-map", "[o]", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-r", "25", "-c:a", "copy", "-movflags", "+faststart", "-shortest", salida], { stdio: "ignore" });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`Listo: "VIDEO PROMOCIONAL CUADRADO.mp4" (${(fs.statSync(salida).size / 1048576).toFixed(1)} MB).`);
}

// También se puede correr solo: node scripts/video/cuadrado.mjs (usa el VIDEO PROMOCIONAL.mp4 que ya está)
if (process.argv[1] && process.argv[1].endsWith("cuadrado.mjs")) {
  const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
  const chrome = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find((c) => fs.existsSync(c));
  await armarCuadrado(decodeURIComponent(raiz), chrome);
}
