import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_SECRET = 'pavoa-durable-security-test-secret';

const {
  claimIdempotency,
  completeIdempotency,
  consumeRateLimit,
  getIdempotency,
  hashSecurityValue,
} = await import('./durable-security.js');

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
