// GENERA LOS VIDEOS DE ROSARIO ACCESS MAP
//   node scripts/video/grabar-video.mjs            → los dos
//   node scripts/video/grabar-video.mjs tutorial   → solo "VIDEO TUTORIAL.mp4"
//   node scripts/video/grabar-video.mjs promo      → solo "VIDEO PROMOCIONAL.mp4"
// Antes hay que armar la app (npm run build). Lo más fácil: doble clic en "GENERAR VIDEO.bat".
// Requisitos: Google Chrome, ffmpeg (winget install Gyan.FFmpeg) y edge-tts (python -m pip install edge-tts).
// Lo que se dice y se muestra está en guion-tutorial.mjs y guion-promo.mjs.
import { spawn, execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { grabar, esperar } from "./motor.mjs";
import tutorial from "./guion-tutorial.mjs";
import promo from "./guion-promo.mjs";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUERTO = 5288;
const cual = (process.argv[2] || "todos").toLowerCase();
const guiones = cual === "tutorial" ? [tutorial] : cual === "promo" ? [promo] : [tutorial, promo];

const servidor = spawn(`npx vite preview --port ${PUERTO} --strictPort`, { cwd: RAIZ, shell: true, stdio: "ignore" });
await esperar(5000);
let error = false;
try {
  for (const g of guiones) await grabar(g, { raiz: RAIZ, puerto: PUERTO });
} catch (e) {
  error = true;
  console.log("\nNo se pudo terminar el video: " + e.message.split("\n")[0]);
} finally {
  try { execFileSync("taskkill", ["/pid", String(servidor.pid), "/T", "/F"], { stdio: "ignore" }); } catch { servidor.kill(); }
}
process.exit(error ? 1 : 0);
