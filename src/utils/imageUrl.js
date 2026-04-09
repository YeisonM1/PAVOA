/**
 * Optimiza URLs de imágenes según el contexto de uso.
 * Soporta Unsplash y Shopify CDN.
 */

const isUnsplash = (url) => url?.includes('unsplash.com');
const isShopify  = (url) => url?.includes('cdn.shopify.com');

// Para imágenes de producto (cards) — carga rápida en grid
export const productImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) {
    const base = url.split('?')[0];
    return `${base}?w=600&q=65&fm=webp&auto=format`;
  }
  if (isShopify(url)) {
    const base = url.split('?')[0];
    return `${base}?width=600`;
  }
  return url;
};

// Para el Hero fullscreen — necesita más calidad
export const heroImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) {
    const base = url.split('?')[0];
    return `${base}?w=1400&q=70&fm=webp&auto=format`;
  }
  if (isShopify(url)) {
    const base = url.split('?')[0];
    return `${base}?width=1400`;
  }
  return url;
};

// Para thumbnails (miniaturas en ProductPage)
export const thumbImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) {
    const base = url.split('?')[0];
    return `${base}?w=160&q=75&fm=webp&auto=format`;
  }
  if (isShopify(url)) {
    const base = url.split('?')[0];
    return `${base}?width=150&height=200&crop=center`;
  }
  return url;
};

// Para imágenes de categoría (Diseñado Para Ti)
export const categoryImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) {
    const base = url.split('?')[0];
    return `${base}?w=800&q=65&fm=webp&auto=format`;
  }
  if (isShopify(url)) {
    const base = url.split('?')[0];
    return `${base}?width=800`;
  }
  return url;
};