export const HOME_PRODUCT_TAB_KEYS = ['nuevo', 'bestseller', 'tendencia'];

export const HOME_PRODUCT_TAG_LABELS = {
  nuevo: 'NUEVO',
  bestseller: 'MÁS VENDIDO',
  tendencia: 'TENDENCIA',
};

export const HOME_PRODUCT_SLOT_COUNT = 2;

export const normalizeProductTag = (value) => String(value || '').trim().toLowerCase();

export const getNormalizedProductTags = (tags = []) => {
  const rawTags = Array.isArray(tags) ? tags : [];
  return [...new Set(rawTags.map(normalizeProductTag).filter(Boolean))];
};

export const getGlobalHomeProductTag = (tags = []) => {
  const normalizedTags = getNormalizedProductTags(tags);
  return HOME_PRODUCT_TAB_KEYS.find((tagKey) => normalizedTags.includes(tagKey)) || '';
};

export const getHomeSlotTag = (tabKey, slotNumber) =>
  `home-${normalizeProductTag(tabKey)}-${Number(slotNumber)}`;

export const getCuratedProductsForTab = (products = [], tabKey, slotCount = HOME_PRODUCT_SLOT_COUNT) => {
  const normalizedTabKey = normalizeProductTag(tabKey);
  if (!normalizedTabKey) return [];

  const curatedProducts = [];
  const curatedIds = new Set();

  for (let slot = 1; slot <= slotCount; slot += 1) {
    const slotTag = getHomeSlotTag(normalizedTabKey, slot);
    const selectedProduct = products.find((product) => {
      const tags = getNormalizedProductTags(product?.tags);
      return tags.includes(normalizedTabKey) && tags.includes(slotTag) && !curatedIds.has(product.id);
    });

    if (selectedProduct) {
      curatedProducts.push(selectedProduct);
      curatedIds.add(selectedProduct.id);
    }
  }

  if (curatedProducts.length >= slotCount) {
    return curatedProducts.slice(0, slotCount);
  }

  const fallbackProducts = products.filter((product) => {
    const tags = getNormalizedProductTags(product?.tags);
    return tags.includes(normalizedTabKey) && !curatedIds.has(product.id);
  });

  return [...curatedProducts, ...fallbackProducts].slice(0, slotCount);
};
