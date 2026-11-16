// GENERA LOS VIDEOS DE ROSARIO ACCESS MAP
//   node scripts/video/grabar-video.mjs            → los dos
//   node scripts/video/grabar-video.mjs tutorial   → solo "VIDEO TUTORIAL.mp4"
//   node scripts/video/grabar-video.mjs promo      → solo el promocional (vertical y cuadrado)
// Antes hay que armar la app (npm run build). Lo más fácil: doble clic en "GENERAR VIDEO.bat".
// Requisitos: Google Chrome, ffmpeg (winget install Gyan.FFmpeg), edge-tts y numpy (python -m pip install edge-tts numpy).
// Lo que se dice y se muestra está en guion-tutorial.mjs y guion-promo.mjs.
import { spawn, execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { grabar, esperar } from "./motor.mjs";
import { componer } from "./compositor.mjs";
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
  for (const g of guiones) {
    const grabado = await grabar(g, { raiz: RAIZ, puerto: PUERTO });
    // El promocional se graba una sola vez y con eso se arman las dos versiones (vertical y cuadrada)
    if (grabado) {
      fs.writeFileSync(path.join(grabado.tmp, "grabado.json"), JSON.stringify(grabado, (k, v) => (typeof v === "function" ? undefined : v)));
      await componer(RAIZ, grabado);
      // Con VIDEO_CONSERVAR=1 queda la grabación para volver a armar solo el diseño: node scripts/video/compositor.mjs <carpeta>
      if (process.env.VIDEO_CONSERVAR) console.log(`   grabación guardada en ${grabado.tmp}`);
      else fs.rmSync(grabado.tmp, { recursive: true, force: true });
    }
  }
} catch (e) {
  error = true;
  console.log("\nNo se pudo terminar el video: " + e.message.split("\n")[0]);
} finally {
  try { execFileSync("taskkill", ["/pid", String(servidor.pid), "/T", "/F"], { stdio: "ignore" }); } catch { servidor.kill(); }
}
process.exit(error ? 1 : 0);
