import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Abrir el navegador Google Chrome automáticamente al iniciar `npm run dev`
process.env.BROWSER = "chrome";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      // Archivos del /public que no entran al precache automático
      includeAssets: ["favicon.svg", "apple-touch-icon.png", "og-image.png"],
      manifest: {
        name: "Rosario Accesible — Mapa de accesibilidad",
        short_name: "Rosario Accesible",
        description:
          "Mapa colaborativo de accesibilidad de Rosario: rampas, baños accesibles, comercios y reseñas para personas con movilidad reducida.",
        lang: "es-AR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#ffffff",
        theme_color: "#0ea5e9",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cachea el shell de la app para que abra incluso sin conexión
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    open: true,
  },
});