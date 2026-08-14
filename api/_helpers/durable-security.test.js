import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_SECRET = 'pavoa-durable-security-test-secret';

const {
  claimIdempotency,
  completeIdempotency,
  consumeRateLimit,
  failIdempotency,
  getIdempotency,
  hashSecurityValue,
} = await import('./durable-security.js');

// El flujo contra entrega crea la orden en Shopify y solo despues registra,
// envia correo y limpia el draft. Estos dos tests fijan por que un fallo
// posterior debe cerrarse como completado y no liberarse.
test('a claim closed as completed makes a retry reuse the order instead of repeating it', async () => {
  const input = { scope: 'test-cod-completed', key: 'draft-7', ttlMs: 60000, forceMemory: true };

  const claim = await claimIdempotency(input);
  await completeIdempotency({
    ...input,
    claimToken: claim.claimToken,
    response: { ok: true, orderName: '#1063' },
  });

  const retry = await claimIdempotency(input);
  assert.equal(retry.claimed, false);
  assert.equal(retry.state, 'completed');
  assert.equal(retry.response.orderName, '#1063');
});

test('a released claim is claimable again, which after creating the order means a duplicate', async () => {
  const input = { scope: 'test-cod-released', key: 'draft-8', ttlMs: 60000, forceMemory: true };

  const claim = await claimIdempotency(input);
  await failIdempotency({ ...input, claimToken: claim.claimToken });

  assert.equal((await claimIdempotency(input)).claimed, true);
});

test('a lock that requires durable storage fails instead of degrading to memory', async () => {
  const input = {
    scope: 'test-cod-order',
    key: 'draft-4242',
    ttlMs: 60000,
    forceMemory: true,
  };

  // Sin requireDurable el respaldo en memoria sigue siendo válido.
  assert.equal((await claimIdempotency(input)).claimed, true);

  // Con requireDurable, degradar a memoria dejaría pasar órdenes duplicadas
  // entre instancias de Vercel, así que debe fallar y pedir reintento.
  await assert.rejects(
    () => claimIdempotency({ ...input, key: 'draft-4243', requireDurable: true }),
    (error) => error.code === 'durable_lock_unavailable',
  );
});

test('memory rate limiter enforces the configured window and resets after expiry', async () => {
  const input = {
    scope: 'test-login-window',
    identifier: '203.0.113.10',
    limit: 2,
    windowMs: 60000,
    forceMemory: true,
  };

  assert.equal((await consumeRateLimit({ ...input, now: 1000 })).allowed, true);
  assert.equal((await consumeRateLimit({ ...input, now: 2000 })).allowed, true);
  const blocked = await consumeRateLimit({ ...input, now: 3000 });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfter, 58);
  assert.equal((await consumeRateLimit({ ...input, now: 62000 })).allowed, true);
});

test('idempotency allows one owner and reuses only the completed response', async () => {
  const input = {
    scope: 'test-draft-order',
    key: 'owner-hash:request-key',
    ttlMs: 60000,
    forceMemory: true,
  };

  const first = await claimIdempotency(input);
  const concurrent = await claimIdempotency(input);
  assert.equal(first.claimed, true);
  assert.equal(concurrent.claimed, false);
  assert.equal(concurrent.state, 'processing');

  await completeIdempotency({
    ...input,
    claimToken: first.claimToken,
    response: { draftOrderId: '12345', shippingCost: 18900 },
  });

  const completed = await getIdempotency(input);
  assert.equal(completed.state, 'completed');
  assert.equal(completed.response.draftOrderId, '12345');
  assert.equal((await claimIdempotency(input)).claimed, false);
});

test('security hashes are stable without exposing their source value', () => {
  const source = 'cliente@example.com';
  const hash = hashSecurityValue('order-owner', source);
  assert.equal(hash, hashSecurityValue('order-owner', source));
  assert.equal(hash.includes(source), false);
  assert.equal(hash.length, 64);
});
