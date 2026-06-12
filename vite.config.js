import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Abrir el navegador Google Chrome automáticamente al iniciar `npm run dev`
process.env.BROWSER = "chrome";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true,
  },
});