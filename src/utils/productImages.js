const uniqueUrls = (values) => [...new Set(values.filter(Boolean))];

export const buildProductImageCollections = (imageNodes = [], variants = []) => {
  const images = uniqueUrls(imageNodes.map((image) => image?.url));
  const colors = new Set(variants.map((variant) => variant?.color).filter(Boolean));
  const imagesByColor = {};

  imageNodes.forEach(({ url, altText } = {}) => {
    if (!url || !altText || !colors.has(altText)) return;
    imagesByColor[altText] = uniqueUrls([...(imagesByColor[altText] || []), url]);
  });

  variants.forEach(({ color, variantImage } = {}) => {
    if (!color || !variantImage) return;
    imagesByColor[color] = uniqueUrls([variantImage, ...(imagesByColor[color] || [])]);
  });

  return { images, imagesByColor };
};
