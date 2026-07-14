export const parseOrderAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const normalized = String(value).trim().replace(/[^\d,.-]/g, '');
  if (!normalized) return null;

  let numeric;
  if (/^-?\d{1,3}(?:[.,]\d{3})+$/.test(normalized)) {
    numeric = Number(normalized.replace(/[.,]/g, ''));
  } else if (/^-?\d+[.,]\d{1,2}$/.test(normalized)) {
    numeric = Number(normalized.replace(',', '.'));
  } else {
    numeric = Number(normalized.replace(/[.,]/g, ''));
  }

  return Number.isFinite(numeric) ? numeric : null;
};

export const isShippingLineItem = (item) => {
  const id = String(item?.id || '').trim().toLowerCase();
  const title = String(item?.title || item?.nombre || '').trim().toLowerCase();
  return id === 'envio' || id === 'shipping' || /env[ií]o/.test(title);
};

export const resolveLineItemAmounts = ({ items = [], total, shippingCost }) => {
  const lines = Array.isArray(items) ? items : [];
  const lineAmount = (item) => {
    const price = parseOrderAmount(item?.price ?? item?.precio ?? item?.unit_price) || 0;
    const quantity = Math.max(0, Number(item?.quantity ?? item?.cantidad ?? 1) || 0);
    return price * quantity;
  };
  const productsSubtotal = lines
    .filter((item) => !isShippingLineItem(item))
    .reduce((sum, item) => sum + lineAmount(item), 0);
  const shippingFromLine = lines
    .filter(isShippingLineItem)
    .reduce((sum, item) => sum + lineAmount(item), 0);
  const finalTotal = parseOrderAmount(total);
  const explicitShipping = parseOrderAmount(shippingCost);
  const finalShippingCost = explicitShipping
    ?? (shippingFromLine > 0
      ? shippingFromLine
      : Math.max(0, (finalTotal ?? productsSubtotal) - productsSubtotal));

  return {
    subtotal: productsSubtotal || Math.max(0, (finalTotal || 0) - finalShippingCost),
    shippingCost: finalShippingCost,
    total: finalTotal ?? (productsSubtotal + finalShippingCost),
  };
};

export const resolveFinalOrderAmounts = ({ shopifyOrder, cartTotal, shippingCost }) => {
  const requestedShippingCost = Math.max(0, parseOrderAmount(shippingCost) || 0);
  const shopifyShippingCost = parseOrderAmount(
    shopifyOrder?.total_shipping_price_set?.shop_money?.amount
    ?? shopifyOrder?.shipping_lines?.[0]?.price
  );
  const finalShippingCost = shopifyShippingCost === null
    ? requestedShippingCost
    : Math.max(0, shopifyShippingCost);
  const shopifyOrderTotal = parseOrderAmount(shopifyOrder?.total_price);
  const total = shopifyOrderTotal === null
    ? (parseOrderAmount(cartTotal) || 0) + finalShippingCost
    : shopifyOrderTotal;
  const shopifySubtotal = parseOrderAmount(
    shopifyOrder?.current_subtotal_price ?? shopifyOrder?.subtotal_price
  );
  const subtotal = shopifySubtotal === null
    ? Math.max(0, total - finalShippingCost)
    : shopifySubtotal;

  return { subtotal, shippingCost: finalShippingCost, total };
};
