import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

process.env.JWT_SECRET = 'pavoa-security-test-secret-with-enough-entropy';
process.env.SHOPIFY_WEBHOOK_SECRET = 'shopify-webhook-test-secret';

const { signCheckoutToken, verifyCheckoutToken } = await import('./auth.js');
const { validarFirma } = await import('../webhook-shopify.js');
const { isBogotaDestination } = await import('../pedido.js');

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

test('Bogota shipping only applies to Bogota D.C. destinations', () => {
  assert.equal(isBogotaDestination({ city: 'Bogotá', department: 'Bogotá D.C.' }), true);
  assert.equal(isBogotaDestination({ city: 'Bogota', department: 'Distrito Capital' }), true);
  assert.equal(isBogotaDestination({ city: 'Bogotá', department: 'Cundinamarca' }), false);
  assert.equal(isBogotaDestination({ city: 'Soacha', department: 'Cundinamarca' }), false);
});
