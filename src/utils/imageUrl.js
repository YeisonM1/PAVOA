/**
 * Optimiza URLs de Unsplash para cada contexto de uso.
 * Reduce peso entre 40-70% según el dispositivo.
 */

// Para imágenes de producto (cards) — carga rápida en grid
export const productImage = (url) => {
  if (!url || !url.includes('unsplash.com')) return url;
  const base = url.split('?')[0];
  return `${base}?w=600&q=65&fm=webp&auto=format`;
};

// Para el Hero fullscreen — necesita más calidad
export const heroImage = (url) => {
  if (!url || !url.includes('unsplash.com')) return url;
  const base = url.split('?')[0];
  return `${base}?w=1400&q=70&fm=webp&auto=format`;
};

// Para thumbnails (miniaturas en ProductPage)
export const thumbImage = (url) => {
  if (!url || !url.includes('unsplash.com')) return url;
  const base = url.split('?')[0];
  return `${base}?w=160&q=60&fm=webp&auto=format`;
};

// Para imágenes de categoría (Diseñado Para Ti)
export const categoryImage = (url) => {
  if (!url || !url.includes('unsplash.com')) return url;
  const base = url.split('?')[0];
  return `${base}?w=800&q=65&fm=webp&auto=format`;
};