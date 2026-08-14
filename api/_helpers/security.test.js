import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'pavoa-security-test-secret-with-enough-entropy';
process.env.SHOPIFY_WEBHOOK_SECRET = 'shopify-webhook-test-secret';
process.env.MP_WEBHOOK_SECRET = 'mercadopago-webhook-test-secret';
process.env.MP_ACCESS_TOKEN = 'TEST-access-token-solo-para-pruebas';

const { signCheckoutToken, signToken, verifyCheckoutToken, verifyToken } = await import('./auth.js');
const { validarFirma } = await import('../webhook-shopify.js');
const { isBogotaDestination } = await import('../pedido.js');
const { extractNotification, validarFirmaWebhook } = await import('../webhook-mercadopago.js');
const { esPagoInsuficiente } = await import('./mercadopago-order.js');

const bearer = (token) => ({ headers: { authorization: `Bearer ${token}` } });

const firmaMercadoPago = ({ dataId, requestId, ts }) => {
  const hmac = crypto
    .createHmac('sha256', process.env.MP_WEBHOOK_SECRET)
    .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
    .digest('hex');
  return `ts=${ts},v1=${hmac}`;
};

test('checkout token is bound to the draft order and email', () => {
  const token = signCheckoutToken({
    draftOrderId: '12345',
    email: 'cliente@example.com',
    shippingCost: 18900,
  });

  const payload = verifyCheckoutToken(token, { draftOrderId: '12345' });
  assert.equal(payload.email, 'cliente@example.com');
  assert.equal(payload.shippingCost, 18900);
  assert.equal(verifyCheckoutToken(token, { draftOrderId: '99999' }), null);
  assert.equal(verifyCheckoutToken(`${token}tampered`, { draftOrderId: '12345' }), null);
});

test('Shopify webhook signature validates the exact raw body', () => {
  const rawBody = Buffer.from(JSON.stringify({ id: 12345, topic: 'orders/updated' }));
  const signature = crypto
    .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('base64');

  assert.equal(validarFirma(rawBody, signature), true);
  assert.equal(validarFirma(Buffer.from('{"id":54321}'), signature), false);
  assert.equal(validarFirma(rawBody, ''), false);
});

test('a checkout token cannot be used as a session token', () => {
  // Un invitado obtiene este token escribiendo el correo de otra persona en el
  // formulario de checkout. Si valiera como sesion, leeria sus pedidos.
  const checkoutToken = signCheckoutToken({
    draftOrderId: '999',
    email: 'victima@example.com',
    shippingCost: 15000,
  });

  assert.equal(verifyCheckoutToken(checkoutToken, { draftOrderId: '999' }).email, 'victima@example.com');
  assert.equal(verifyToken(bearer(checkoutToken)), null);
});

test('verifyToken accepts real sessions, including legacy ones keyed by id', () => {
  const session = verifyToken(bearer(signToken({ userId: 'user-1', email: 'cliente@example.com' })));
  assert.equal(session.userId, 'user-1');
  assert.equal(session.purpose, 'session');

  const legacy = jwt.sign({ id: 'user-2', email: 'viejo@example.com' }, process.env.JWT_SECRET);
  assert.equal(verifyToken(bearer(legacy)).id, 'user-2');

  assert.equal(verifyToken(bearer('no-es-un-token')), null);
  assert.equal(verifyToken({ headers: {} }), null);
  // Sin dueño identificable no autoriza, aunque la firma sea válida.
  assert.equal(verifyToken(bearer(jwt.sign({ email: 'x@y.z' }, process.env.JWT_SECRET))), null);
});

test('Mercado Pago signature covers the same data.id that gets processed', () => {
  const ts = '1700000000';
  const requestId = 'req-abc';

  const legitimo = {
    headers: { 'x-signature': firmaMercadoPago({ dataId: '111', requestId, ts }), 'x-request-id': requestId },
    body: { type: 'payment', data: { id: '111' } },
    query: { 'data.id': '111', type: 'payment' },
  };
  assert.equal(extractNotification(legitimo).dataId, '111');
  assert.equal(validarFirmaWebhook(legitimo, extractNotification(legitimo).dataId), true);

  // Firma capturada para el pago 111, reapuntada al pago 999 por la query.
  // El body sin `type` hace que se procese el id de la query, no el del body.
  const suplantado = {
    headers: { 'x-signature': firmaMercadoPago({ dataId: '111', requestId, ts }), 'x-request-id': requestId },
    body: { data: { id: '111' } },
    query: { 'data.id': '999', type: 'payment' },
  };
  assert.equal(extractNotification(suplantado).dataId, '999');
  assert.equal(validarFirmaWebhook(suplantado, extractNotification(suplantado).dataId), false);

  assert.equal(validarFirmaWebhook(legitimo, ''), false);
  assert.equal(validarFirmaWebhook({ headers: {}, body: {}, query: {} }, '111'), false);
});

test('an order is refused only when the payment falls short', () => {
  // Pagó lo que debía, o de más: la orden se crea.
  assert.equal(esPagoInsuficiente(120000, 120000), false);
  assert.equal(esPagoInsuficiente(130000, 120000), false);

  // Diferencia de redondeo del descuento porcentual: no debe tumbar la orden.
  assert.equal(esPagoInsuficiente(119999, 120000), false);
  assert.equal(esPagoInsuficiente(119900, 120000), false);

  // Pagó de menos de verdad.
  assert.equal(esPagoInsuficiente(25000, 120000), true);
  assert.equal(esPagoInsuficiente(119899, 120000), true);
});

test('the amount check stays out of the way when there is nothing to compare', () => {
  // Sin total del draft (Shopify no respondió) la orden sigue su curso:
  // completarDraftOrder falla igual un momento después.
  assert.equal(esPagoInsuficiente(1000, null), false);
  assert.equal(esPagoInsuficiente(1000, undefined), false);
  assert.equal(esPagoInsuficiente(1000, 0), false);
  assert.equal(esPagoInsuficiente(null, 120000), false);
});

test('Bogota shipping only applies to Bogota D.C. destinations', () => {
  assert.equal(isBogotaDestination({ city: 'Bogotá', department: 'Bogotá D.C.' }), true);
  assert.equal(isBogotaDestination({ city: 'Bogota', department: 'Distrito Capital' }), true);
  assert.equal(isBogotaDestination({ city: 'Bogotá', department: 'Cundinamarca' }), false);
  assert.equal(isBogotaDestination({ city: 'Soacha', department: 'Cundinamarca' }), false);
});
