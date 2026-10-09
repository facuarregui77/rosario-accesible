import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import "./storage.js"; // define window.storage antes de montar la app
import "./index.css";
import App from "./App.jsx";
import PWAUpdatePrompt from "./PWAUpdatePrompt.jsx";
import { logError } from "./db.js";
import { cleanChannelPath } from "./lib/seo.js";

// Si algo se rompe en el celular de alguien, queda registrado (tabla app_errors) para poder verlo
// en el panel de Análisis. Solo en la nube; nunca interrumpe a la persona.
window.addEventListener("error", (e) => logError(e.message, e.error && e.error.stack));
window.addEventListener("unhandledrejection", (e) => logError("Promesa sin manejar: " + (e.reason && (e.reason.message || e.reason)), e.reason && e.reason.stack));

// Visitas que llegan por un enlace de campaña (/ig, /fb, /qr…): se registran y la dirección vuelve a "/".
cleanChannelPath();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <PWAUpdatePrompt />
    {/* Estadísticas de visitas de Vercel (anónimas, sin cookies). Solo funciona en el sitio publicado. */}
    <Analytics />
  </StrictMode>
);
