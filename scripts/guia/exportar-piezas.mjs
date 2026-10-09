// Exporta cada .pieza de piezas.html como PNG en la carpeta piezas-redes del proyecto.
// Uso: node exportar-piezas.mjs  (lo llama también "GENERAR PDF.bat"). Necesita: npm i -g playwright-core o tenerlo en el proyecto.
import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const aqui = path.dirname(fileURLToPath(import.meta.url));
const salida = path.resolve(aqui, "../../piezas-redes");
const chrome = process.env.CHROME || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: chrome, headless: true });
const page = await browser.newPage({ viewport: { width: 700, height: 1100 }, deviceScaleFactor: 2 });
await page.goto(pathToFileURL(path.join(aqui, "piezas.html")).href, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);
for (const el of await page.$$(".pieza")) {
  const id = await el.getAttribute("id");
  await el.screenshot({ path: path.join(salida, id + ".png") });
  console.log("  " + id + ".png");
}
await browser.close();
