import { getShopifyToken } from './shopify-token.js';

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;

const variantNumericId = (variantId) => {
  const raw = String(variantId || '');
  const value = raw.includes('gid://') ? raw.split('/').pop() : raw;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const normalizeMoney = (value) => Math.round(Number(value || 0));

const fetchVariant = async (token, variantId) => {
  const numericId = variantNumericId(variantId);
  if (!numericId) throw new Error('Variante invalida en el carrito');

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/variants/${numericId}.json`,
    { headers: { 'X-Shopify-Access-Token': token } }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`No se pudo validar una variante (${res.status}): ${err}`);
  }

  const { variant } = await res.json();
  if (!variant) throw new Error('Variante no encontrada en Shopify');
  return { ...variant, numericId };
};

export const validateCartWithShopify = async (cartItems = []) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('El carrito esta vacio');
  }

  const token = await getShopifyToken();
  const trustedItems = [];

  for (const item of cartItems) {
    const quantity = Number(item?.cantidad || 0);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Cantidad invalida en el carrito');
    }

    const selectedVariantId = item?.producto?.selectedVariantId;
    if (!selectedVariantId) {
      throw new Error(`Selecciona nuevamente talla/color para "${item?.producto?.nombre || 'un producto'}"`);
    }

    const variant = await fetchVariant(token, selectedVariantId);
    const stock = Number(variant.inventory_quantity ?? 0);
    const title = item?.producto?.nombre || variant.title || `Variante ${variant.numericId}`;
    const unitPrice = normalizeMoney(variant.price);

    if (stock < quantity) {
      throw new Error(
        stock <= 0
          ? `"${title}" ya no tiene stock disponible.`
          : `"${title}" solo tiene ${stock} unidad${stock === 1 ? '' : 'es'} disponible${stock === 1 ? '' : 's'}.`
      );
    }

    trustedItems.push({
      variantId: variant.numericId,
      storefrontVariantId: selectedVariantId,
      title,
      quantity,
      unitPrice,
      talla: item?.talla || '',
      color: item?.producto?.colorSeleccionado || '',
      image: item?.producto?.imagen1 || '',
    });
  }

  const total = trustedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  return { trustedItems, total };
};
