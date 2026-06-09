// Puente para `window.storage` usado en App.jsx.
// La app original corría en un entorno que ofrecía un `window.storage` asíncrono.
// En un navegador normal eso no existe, así que lo recreamos sobre localStorage
// para que las reseñas y los cambios de accesibilidad sigan persistiendo.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return value === null ? null : { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
    async delete(key) {
      localStorage.removeItem(key);
    },
  };
}
