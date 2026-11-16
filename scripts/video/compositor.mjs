// ARMADO FINAL DE LOS VIDEOS PROMOCIONALES
// Toma la pantalla del celular grabada (sin subtítulos) y la voz, y arma las dos versiones con el MISMO diseño:
//   - VIDEO PROMOCIONAL.mp4          1080 x 1920 (Reels, Stories, TikTok, estados)
//   - VIDEO PROMOCIONAL CUADRADO.mp4 1080 x 1080 (muro de Instagram y Facebook)
// Las dos llevan el fondo de la marca, el celular con marco, un título por escena, los subtítulos afuera del
// celular, la misma presentación al principio y al final, y música de fondo que baja sola cuando habla la voz.
// Las capas (fondo, títulos, subtítulos, presentaciones) se dibujan con Chrome como imágenes y ffmpeg las junta.
import { chromium } from "playwright-core";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find((c) => fs.existsSync(c));
const FPS = 30;
const URL_APP = "access-app-rosario.vercel.app";

// Dónde va cada cosa en cada formato. `tel` es la pantalla del celular (proporción 9:16).
const FORMATOS = [
  { salida: "VIDEO PROMOCIONAL.mp4", ancho: 1080, alto: 1920, tel: { x: 189, y: 340, w: 702, h: 1248 }, vertical: true },
  { salida: "VIDEO PROMOCIONAL CUADRADO.mp4", ancho: 1080, alto: 1080, tel: { x: 76, y: 60, w: 540, h: 960 }, vertical: false },
];

const LOGO = (lado, trazo = "#fff") => `<svg width="${lado}" height="${lado}" viewBox="0 0 24 24" fill="none" stroke="${trazo}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6 1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/></svg>`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function estilos(f, fuente) {
  const t = f.tel, B = 14, R = Math.round(t.w * 0.075);
  // Zonas de texto: en el vertical arriba y abajo del celular; en el cuadrado, la columna de la derecha
  const col = { x: t.x + t.w + 56, w: f.ancho - (t.x + t.w + 56) - 56 };
  return `
  @font-face{font-family:J;src:url(data:font/woff2;base64,${fuente}) format("woff2");font-weight:400 800}
  *{box-sizing:border-box;margin:0}
  html,body{width:${f.ancho}px;height:${f.alto}px;overflow:hidden;background:transparent;font-family:J,system-ui,sans-serif;color:#fff}
  .fondo{position:absolute;inset:0;background:
    radial-gradient(circle at ${f.vertical ? "85% 8%" : "92% 12%"},rgba(51,160,255,.38),transparent 42%),
    radial-gradient(circle at ${f.vertical ? "10% 92%" : "40% 105%"},rgba(51,160,255,.22),transparent 40%),
    linear-gradient(160deg,#06153D 0%,#032761 55%,#0B3A7E 100%)}
  .puntos{position:absolute;inset:0;opacity:.12;background-image:radial-gradient(rgba(255,255,255,.9) 1.4px,transparent 1.6px);background-size:34px 34px;
    -webkit-mask-image:linear-gradient(${f.vertical ? "180deg" : "90deg"},transparent 20%,#000 60%,transparent 95%)}
  .tel{position:absolute;left:${t.x - B}px;top:${t.y - B}px;width:${t.w + 2 * B}px;height:${t.h + 2 * B}px;border-radius:${R + B}px;
    background:#0b0f1a;box-shadow:0 40px 90px rgba(0,0,0,.55),0 0 0 2px rgba(255,255,255,.14),inset 0 0 0 2px rgba(255,255,255,.06)}
  .marca{position:absolute;display:flex;align-items:center;gap:14px;font-weight:800;font-size:${f.vertical ? 34 : 30}px;letter-spacing:-.5px;
    ${f.vertical ? `left:0;right:0;top:56px;justify-content:center` : `left:${col.x}px;top:${t.y + 6}px`}}
  .marca span{color:#75BDFF}
  .logo{flex:none;display:flex;align-items:center;justify-content:center;border-radius:28%;background:linear-gradient(135deg,#0B3A7E,#1E8FD9);box-shadow:0 0 0 2px rgba(255,255,255,.22),0 10px 24px rgba(0,0,0,.3)}
  .url{position:absolute;font-weight:800;color:#06153D;background:#33A0FF;border-radius:40px;
    ${f.vertical ? `left:50%;transform:translateX(-50%);bottom:52px;font-size:24px;padding:10px 24px` : `left:${col.x}px;bottom:${f.alto - t.y - t.h + 6}px;font-size:21px;padding:11px 20px`}}
  .titular{position:absolute;display:flex;flex-direction:column;gap:10px;
    ${f.vertical ? `left:60px;right:60px;top:132px;height:${t.y - 132 - 30}px;align-items:center;justify-content:center;text-align:center` : `left:${col.x}px;width:${col.w}px;top:${t.y + 120}px;height:260px;justify-content:center`}}
  .kicker{display:inline-flex;align-self:${f.vertical ? "center" : "flex-start"};font-size:${f.vertical ? 24 : 20}px;font-weight:800;letter-spacing:3px;text-transform:uppercase;
    color:#06153D;background:#75BDFF;padding:6px 16px;border-radius:30px}
  .titular h2{font-size:${f.vertical ? 58 : 46}px;line-height:1.06;font-weight:800;letter-spacing:-1.5px;text-wrap:balance}
  .sub{position:absolute;display:flex;
    ${f.vertical ? `left:70px;right:70px;top:${t.y + t.h + 40}px;bottom:120px;align-items:center;justify-content:center;text-align:center` : `left:${col.x}px;width:${col.w}px;top:${t.y + 430}px;height:330px;align-items:flex-start`}}
  .sub p{font-size:${f.vertical ? 44 : 33}px;line-height:1.28;font-weight:700;text-wrap:balance;text-shadow:0 2px 14px rgba(0,0,0,.35);
    ${f.vertical ? "" : "border-left:5px solid #33A0FF;padding-left:20px"}}
  .tarjeta{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:${f.vertical ? 40 : 30}px;padding:0 ${f.vertical ? 90 : 120}px}
  .tarjeta h1{font-size:${f.vertical ? 88 : 72}px;line-height:1.04;font-weight:800;letter-spacing:-2.5px;text-wrap:balance}
  .tarjeta h1 span{color:#75BDFF}
  .tarjeta p{font-size:${f.vertical ? 38 : 32}px;font-weight:600;color:#D6E6F7;text-wrap:balance}
  .tarjeta .url{position:static;transform:none;font-size:${f.vertical ? 34 : 30}px;padding:16px 34px}
  .chips{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
  .chips b{font-size:${f.vertical ? 28 : 24}px;font-weight:700;border:2px solid rgba(117,189,255,.6);color:#CFE6FF;padding:8px 20px;border-radius:30px}
  `;
}

const marca = (f) => `<div class="marca"><div class="logo" style="width:${f.vertical ? 58 : 52}px;height:${f.vertical ? 58 : 52}px">${LOGO(f.vertical ? 34 : 30)}</div><div>Rosario <span>Access Map</span></div></div>`;
const capas = {
  fondo: (f) => `<div class="fondo"></div><div class="puntos"></div><div class="tel"></div>${marca(f)}<div class="url">${URL_APP}</div>`,
  titular: (f, e) => `<div class="titular">${e.kicker ? `<div class="kicker">${esc(e.kicker)}</div>` : ""}<h2>${esc(e.titular)}</h2></div>`,
  sub: (f, texto) => `<div class="sub"><p>${esc(texto.replace(/,$/, ""))}</p></div>`,
  tarjeta: (f, c) => `<div class="fondo"></div><div class="puntos"></div><div class="tarjeta">
      <div class="logo" style="width:${f.vertical ? 170 : 140}px;height:${f.vertical ? 170 : 140}px">${LOGO(f.vertical ? 100 : 82)}</div>
      ${c.arriba ? `<div class="kicker" style="align-self:center">${esc(c.arriba)}</div>` : ""}
      <h1>${c.titulo}</h1>
      ${c.texto ? `<p>${esc(c.texto)}</p>` : ""}
      ${c.url ? `<div class="url">${URL_APP}</div>` : ""}
      ${c.chips ? `<div class="chips">${c.chips.map((x) => `<b>${esc(x)}</b>`).join("")}</div>` : ""}
    </div>`,
};

// Fondo de la música: si hay un "musica.mp3" en esta carpeta se usa ese; si no, se compone una pista propia.
function musica(tmp, largo) {
  const propia = path.join(AQUI, "musica.mp3");
  if (fs.existsSync(propia)) return { archivo: propia, filtro: "" };
  const wav = path.join(tmp, "musica.wav");
  execFileSync("python", [path.join(AQUI, "musica.py"), String(largo + 1), wav], { stdio: "ignore" });
  return { archivo: wav, filtro: "lowpass=f=9500,aecho=0.8:0.6:70|140|230:0.22|0.16|0.09," };
}

export async function componer(raiz, grabado) {
  const { pantalla, voz, largo, subtitulos, escenas, tmp } = grabado;
  const fuente = fs.readFileSync(path.join(raiz, "scripts/guia/fonts/PlusJakartaSans.woff2")).toString("base64");

  // Audio final (igual para las dos versiones): voz más clara + música que se corre cuando hay voz
  console.log("Mezclando la voz con la música…");
  const m = musica(tmp, largo);
  const audio = path.join(tmp, "audio.m4a");
  execFileSync("ffmpeg", ["-y", "-i", voz, "-i", m.archivo, "-filter_complex",
    `[0:a]highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=90,volume=1.4,asplit=2[vz][lado];` +
    `[1:a]${m.filtro}atrim=0:${largo.toFixed(2)},afade=t=in:d=0.6,afade=t=out:st=${(largo - 2.5).toFixed(2)}:d=2.5,volume=0.42[mu];` +
    `[mu][lado]sidechaincompress=threshold=0.03:ratio=7:attack=20:release=450[md];` +
    `[vz][md]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]`,
    "-map", "[a]", "-t", largo.toFixed(2), "-c:a", "aac", "-b:a", "192k", audio], { stdio: "ignore" });

  const tarjetas = escenas.map((e, i) => e.tarjeta ? { ...e.tarjeta, desde: i === 0 ? 0 : e.desde, hasta: i === escenas.length - 1 ? largo : e.hasta } : null).filter(Boolean);
  const enTarjeta = (s) => tarjetas.some((c) => s.desde >= c.desde - 0.05 && s.desde < c.hasta);
  const subs = subtitulos.map((s) => ({ ...s, hasta: s.hasta ?? largo })).filter((s) => !enTarjeta(s));
  // El título de cada escena queda puesto hasta que empieza el de la siguiente
  const conTitular = escenas.filter((e) => e.titular);
  const titulares = conTitular.map((e, i) => ({ ...e, hasta: i + 1 < conTitular.length ? conTitular[i + 1].desde : (tarjetas.at(-1)?.desde ?? largo) }));

  const nav = await chromium.launch({ executablePath: CHROME, headless: true });
  for (const f of FORMATOS) {
    console.log(`Armando "${f.salida}"…`);
    const dir = fs.mkdtempSync(path.join(tmp, "capas-"));
    const p = await nav.newPage({ viewport: { width: f.ancho, height: f.alto } });
    const css = estilos(f, fuente);
    const dibujar = async (html, archivo, transparente = true) => {
      await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
      await p.evaluate(() => document.fonts.ready);
      return p.screenshot({ path: path.join(dir, archivo), omitBackground: transparente });
    };

    // Fondo y "frente" (el mismo fondo con un agujero de puntas redondeadas donde se ve la pantalla)
    const png = await dibujar(capas.fondo(f), "fondo.png", false);
    const t = f.tel, R = Math.round(t.w * 0.075);
    const agujero = await p.evaluate(async ([b64, x, y, w, h, r]) => {
      const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode();
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
      const g = c.getContext("2d"); g.drawImage(img, 0, 0);
      g.globalCompositeOperation = "destination-out"; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
      return c.toDataURL("image/png").split(",")[1];
    }, [png.toString("base64"), t.x, t.y, t.w, t.h, R]);
    fs.writeFileSync(path.join(dir, "frente.png"), Buffer.from(agujero, "base64"));

    // Capas con su momento de aparición: [archivo, desde, hasta, fundido]
    const lista = [];
    for (const [i, e] of titulares.entries()) { await dibujar(capas.titular(f, e), `tit${i}.png`); lista.push([`tit${i}.png`, e.desde, e.hasta, 0.35]); }
    for (const [i, s] of subs.entries()) { await dibujar(capas.sub(f, s.texto), `sub${i}.png`); lista.push([`sub${i}.png`, s.desde, s.hasta, 0.15]); }
    for (const [i, c] of tarjetas.entries()) { await dibujar(capas.tarjeta(f, c), `tar${i}.png`, false); lista.push([`tar${i}.png`, c.desde, c.hasta, i === 0 ? 0 : 0.6, i === 0 ? 0.6 : 0]); }
    await p.close();

    const L = largo.toFixed(2);
    const img = (a) => ["-loop", "1", "-framerate", String(FPS), "-t", L, "-i", path.join(dir, a)];
    const entradas = [...img("fondo.png"), "-i", pantalla, ...img("frente.png"), "-i", audio];
    const fil = [`[1:v]scale=${t.w}:${t.h}:flags=lanczos,setsar=1,fps=${FPS}[pan]`, `[0:v][pan]overlay=${t.x}:${t.y}:shortest=1[b0]`, `[b0][2:v]overlay=0:0[b1]`];
    let previo = "b1";
    // Cada capa entra solo durante su tramo (así ffmpeg no la procesa el video entero)
    lista.forEach(([archivo, desde, hasta, entra, sale = entra], k) => {
      const n = 4 + k, ini = Math.max(0, desde), dur = Math.max(0.1, Math.min(largo, hasta) - ini);
      entradas.push("-loop", "1", "-framerate", String(FPS), "-t", dur.toFixed(2), "-i", path.join(dir, archivo));
      const fades = [entra ? `fade=t=in:st=0:d=${entra}:alpha=1` : "", sale ? `fade=t=out:st=${Math.max(0, dur - sale).toFixed(2)}:d=${sale}:alpha=1` : ""].filter(Boolean).join(",");
      fil.push(`[${n}:v]format=rgba${fades ? "," + fades : ""},setpts=PTS-STARTPTS+${ini.toFixed(3)}/TB[c${k}]`);
      fil.push(`[${previo}][c${k}]overlay=0:0:eof_action=pass[b${k + 2}]`);
      previo = `b${k + 2}`;
    });
    fil.push(`[${previo}]format=yuv420p[v]`);
    fs.writeFileSync(path.join(dir, "filtro.txt"), fil.join(";\n"));
    const salida = path.join(raiz, f.salida);
    execFileSync("ffmpeg", ["-y", ...entradas, "-filter_complex_script", path.join(dir, "filtro.txt"), "-map", "[v]", "-map", "3:a",
      "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-profile:v", "high", "-r", String(FPS), "-c:a", "copy", "-t", L, "-movflags", "+faststart", salida], { stdio: "ignore" });
    console.log(`   listo (${(fs.statSync(salida).size / 1048576).toFixed(1)} MB)`);
  }
  await nav.close();
}

// También se puede correr solo, sobre una grabación guardada (VIDEO_CONSERVAR=1): node scripts/video/compositor.mjs <carpeta>
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const grabado = JSON.parse(fs.readFileSync(path.join(process.argv[2], "grabado.json"), "utf8"));
  await componer(path.resolve(AQUI, "../.."), grabado);
}
