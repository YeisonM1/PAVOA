/**
 * Parsea un string de precio colombiano a número entero.
 * Soporta formatos: "$89.900", "89900", "89.900"
 */
export const parsePrice = (priceStr) =>
  parseInt(String(priceStr).replace(/[$,.]/g, ''), 10) || 0;

export const formatPrice = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return '';
  return `$${numericAmount.toLocaleString('es-CO')}`;
};
