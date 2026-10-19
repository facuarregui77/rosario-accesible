/** @type {import('tailwindcss').Config} */

// Colores de la app con la identidad de Auckland (aucklandturismo.com): azul marino profundo, azul marino,
// celeste brillante y blanco grisáceo. Se cambian acá las tres familias que usa toda la app, así cada
// botón, borde y fondo toma la paleta nueva sin tocar los componentes:
//   sky    → azul Auckland (fondos claros, bordes, textos y botones principales)
//   blue   → azul marino Auckland (botones oscuros, títulos)
//   orange → celeste Auckland (el color de acento: filtros, botón activo, detalles)
// Los colores con significado (verde/ámbar/rojo de accesibilidad y los de cada rubro) no cambian.
const sky = {
  50: "#F1F7F7", 100: "#E2ECF5", 200: "#C7D7EA", 300: "#84A6CC", 400: "#5B82B5",
  500: "#3B6AA5", 600: "#1D4F94", 700: "#0B3A7E", 800: "#032761", 900: "#06153D", 950: "#040D27",
};
const blue = {
  50: "#EEF2FA", 100: "#D9E1F2", 200: "#B3C3E4", 300: "#8099CC", 400: "#4D6BAD",
  500: "#24468F", 600: "#0F3578", 700: "#032761", 800: "#06153D", 900: "#040D27", 950: "#02081A",
};
const orange = {
  50: "#EAF5FF", 100: "#D3EAFF", 200: "#A6D4FF", 300: "#75BDFF", 400: "#33A0FF",
  500: "#1E8FD9", 600: "#007DAE", 700: "#00668F", 800: "#034F70", 900: "#053B54", 950: "#032536",
};

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { sky, blue, orange },
    },
  },
  plugins: [],
};
