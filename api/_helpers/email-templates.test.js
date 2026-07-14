import assert from 'node:assert/strict';
import test from 'node:test';

import { emailConfirmacion, emailEntregado, formatMoney } from './email-templates.js';
import { resolveFinalOrderAmounts, resolveLineItemAmounts } from './order-amounts.js';

test('formatMoney preserves raw and localized COP amounts', () => {
  assert.equal(formatMoney(18900), '18.900');
  assert.equal(formatMoney('18900.00'), '18.900');
  assert.equal(formatMoney('18.900'), '18.900');
  assert.equal(formatMoney('$40.000'), '40.000');
});

test('cash on delivery email shows consistent product, shipping and total values', () => {
  const html = emailConfirmacion({
    firstName: 'Laura',
    orderName: '#1063',
    lineItems: [{ title: 'BODY MIST', quantity: 1, price: '40000.00' }],
    total: 58900,
    descuentoAplicado: false,
    tipoPago: 'contraentrega',
    envio: 18900,
  });

  assert.match(html, /\$40\.000/);
  assert.match(html, /\$18\.900/);
  assert.match(html, /\$58\.900/);
  assert.match(html, /Subtotal/);
  assert.match(html, /Envío/);
  assert.doesNotMatch(html, /\$18,9/);
  assert.doesNotMatch(html, /\$58,9/);
});

test('online payments separate the shipping line from the product subtotal', () => {
  const amounts = resolveLineItemAmounts({
    items: [
      { id: 'variant-1', unit_price: 40000, quantity: 1 },
      { id: 'envio', title: 'Envio a domicilio', unit_price: 18900, quantity: 1 },
    ],
    total: 58900,
  });

  assert.deepEqual(amounts, {
    subtotal: 40000,
    shippingCost: 18900,
    total: 58900,
  });

  const html = emailConfirmacion({
    firstName: 'Laura',
    orderName: '#1064',
    lineItems: [{ title: 'BODY MIST', quantity: 1, price: 40000 }],
    subtotal: amounts.subtotal,
    envio: amounts.shippingCost,
    total: amounts.total,
    tipoPago: 'mercadopago',
  });

  assert.match(html, /Mercado Pago/);
  assert.match(html, /Subtotal/);
  assert.match(html, /Envío/);
  assert.match(html, /Total pagado/);
});

test('delivered email thanks the customer with the current PAVOA message', () => {
  const html = emailEntregado({ nombreCliente: 'Laura', orderName: '#1065' });

  assert.match(html, /Gracias por confiar en PAVOA/);
  assert.doesNotMatch(html, /Esperamos que lo disfrutes mucho/);
});

test('cash on delivery trusts final Shopify amounts over a stale browser cart', () => {
  const amounts = resolveFinalOrderAmounts({
    shopifyOrder: {
      total_price: '58900.00',
      shipping_lines: [{ price: '18900.00' }],
    },
    cartTotal: 25000,
    shippingCost: 18900,
  });

  assert.deepEqual(amounts, {
    subtotal: 40000,
    shippingCost: 18900,
    total: 58900,
  });
});
