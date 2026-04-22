const MAX_ITEMS = 6;
const KEY = 'pavoa-recently-viewed';

export function saveRecentlyViewed(producto) {
  try {
    const prev = JSON.parse(localStorage.getItem(KEY) || '[]');
    const filtered = prev.filter(p => p.id !== producto.id);
    const entry = {
      id:      producto.id,
      nombre:  producto.nombre,
      imagen1: producto.imagen1,
      precio:  producto.precio,
    };
    localStorage.setItem(KEY, JSON.stringify([entry, ...filtered].slice(0, MAX_ITEMS)));
  } catch {}
}

export function getRecentlyViewed() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch { return []; }
}
