import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./storage.js"; // define window.storage antes de montar la app
import "./index.css";
import App from "./App.jsx";
import PWAUpdatePrompt from "./PWAUpdatePrompt.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
    <PWAUpdatePrompt />
  </StrictMode>
);
