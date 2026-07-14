const toFiniteNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

export const resolveFinalOrderAmounts = ({ shopifyOrder, cartTotal, shippingCost }) => {
  const requestedShippingCost = Math.max(0, toFiniteNumber(shippingCost) || 0);
  const shopifyShippingCost = toFiniteNumber(
    shopifyOrder?.total_shipping_price_set?.shop_money?.amount
    ?? shopifyOrder?.shipping_lines?.[0]?.price
  );
  const finalShippingCost = shopifyShippingCost === null
    ? requestedShippingCost
    : Math.max(0, shopifyShippingCost);
  const shopifyOrderTotal = toFiniteNumber(shopifyOrder?.total_price);
  const total = shopifyOrderTotal === null
    ? (toFiniteNumber(cartTotal) || 0) + finalShippingCost
    : shopifyOrderTotal;
  const shopifySubtotal = toFiniteNumber(
    shopifyOrder?.current_subtotal_price ?? shopifyOrder?.subtotal_price
  );
  const subtotal = shopifySubtotal === null
    ? Math.max(0, total - finalShippingCost)
    : shopifySubtotal;

  return { subtotal, shippingCost: finalShippingCost, total };
};
