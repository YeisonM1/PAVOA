/**
 * Optimiza URLs de imágenes según el contexto de uso.
 * Soporta Unsplash y Shopify CDN.
 */

const isUnsplash = (url) => url?.includes('unsplash.com');
const isShopify  = (url) => url?.includes('cdn.shopify.com');
const base       = (url) => url.split('?')[0];

// Para imágenes de producto (cards) — carga rápida en grid
export const productImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) return `${base(url)}?w=400&q=65&fm=webp&auto=format`;
  if (isShopify(url))  return `${base(url)}?width=400&format=webp`;
  return url;
};

// Para el Hero fullscreen — desktop 1400px, móvil 600px
export const heroImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) return `${base(url)}?w=1400&q=70&fm=webp&auto=format`;
  if (isShopify(url))  return `${base(url)}?width=1400&format=webp`;
  return url;
};

export const heroImageMobile = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) return `${base(url)}?w=600&q=70&fm=webp&auto=format`;
  if (isShopify(url))  return `${base(url)}?width=600&format=webp`;
  return url;
};

// Para thumbnails (miniaturas en ProductPage)
export const thumbImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) return `${base(url)}?w=160&q=75&fm=webp&auto=format`;
  if (isShopify(url))  return `${base(url)}?width=150&height=200&crop=center&format=webp`;
  return url;
};

// Para imágenes de categoría protagonista (grande) — 800px
// Para nicho1/nicho2 (pequeñas) — 300px
export const categoryImage = (url, size = 'large') => {
  if (!url) return url;
  const w = size === 'small' ? 300 : 420;
  if (isUnsplash(url)) return `${base(url)}?w=${w}&q=65&fm=webp&auto=format`;
  if (isShopify(url))  return `${base(url)}?width=${w}&format=webp`;
  return url;
};

// Para posts de Instagram — 300px máximo
export const instagramImage = (url) => {
  if (!url) return url;
  if (isUnsplash(url)) return `${base(url)}?w=300&q=60&fm=webp&auto=format`;
  if (isShopify(url))  return `${base(url)}?width=300&format=webp`;
  return url;
};
