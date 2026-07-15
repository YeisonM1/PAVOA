import crypto from 'crypto';

import { getSupabaseMode, supabase } from './supabase.js';

const memoryRateLimits = new Map();
const memoryIdempotency = new Map();
const warnedFallbacks = new Set();

const warnFallback = (feature, error) => {
  if (warnedFallbacks.has(feature)) return;
  warnedFallbacks.add(feature);
  console.warn(`[PAVOA] ${feature} usa respaldo en memoria:`, error?.message || error || 'Supabase durable no disponible');
};

const securityHash = (scope, identifier) => crypto
  .createHmac(
    'sha256',
    process.env.RATE_LIMIT_HASH_SECRET || process.env.JWT_SECRET || 'pavoa-memory-only',
  )
  .update(`${String(scope || '').trim()}:${String(identifier || '').trim()}`)
  .digest('hex');

export const hashSecurityValue = (scope, value) => securityHash(scope, value);

const canUseDurableStorage = (forceMemory = false) => (
  !forceMemory && Boolean(supabase) && getSupabaseMode() === 'service_role'
);

const pruneMemory = (map, now = Date.now()) => {
  for (const [key, entry] of map.entries()) {
    if (Number(entry?.expiresAt || 0) <= now) map.delete(key);
  }
};

export const getClientIp = (req) => (
  String(req?.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  || req?.socket?.remoteAddress
  || 'unknown'
);

export const consumeRateLimit = async ({
  scope,
  identifier,
  limit,
  windowMs,
  forceMemory = false,
  now = Date.now(),
}) => {
  const normalizedLimit = Math.max(1, Number(limit) || 1);
  const normalizedWindowMs = Math.max(1000, Number(windowMs) || 60000);
  const identifierHash = securityHash(scope, identifier);

  if (canUseDurableStorage(forceMemory)) {
    const { data, error } = await supabase.rpc('pavoa_consume_rate_limit', {
      p_scope: String(scope),
      p_identifier_hash: identifierHash,
      p_limit: normalizedLimit,
      p_window_seconds: Math.ceil(normalizedWindowMs / 1000),
    });

    if (!error && data) {
      return {
        allowed: Boolean(data.allowed),
        remaining: Math.max(0, Number(data.remaining || 0)),
        retryAfter: Math.max(0, Number(data.retry_after || 0)),
        durable: true,
      };
    }

    warnFallback('rate-limit durable', error);
  }

  pruneMemory(memoryRateLimits, now);
  const key = `${scope}:${identifierHash}`;
  const current = memoryRateLimits.get(key);
  const entry = !current || current.expiresAt <= now
    ? { count: 1, expiresAt: now + normalizedWindowMs }
    : { ...current, count: current.count + 1 };
  memoryRateLimits.set(key, entry);

  return {
    allowed: entry.count <= normalizedLimit,
    remaining: Math.max(0, normalizedLimit - entry.count),
    retryAfter: Math.max(0, Math.ceil((entry.expiresAt - now) / 1000)),
    durable: false,
  };
};

const memoryIdempotencyKey = (scope, key) => `${scope}:${securityHash(scope, key)}`;

const claimMemoryIdempotency = ({ scope, key, ttlMs, claimToken, now }) => {
  pruneMemory(memoryIdempotency, now);
  const memoryKey = memoryIdempotencyKey(scope, key);
  const current = memoryIdempotency.get(memoryKey);

  if (!current || current.state === 'failed') {
    const next = {
      state: 'processing',
      response: null,
      claimToken,
      expiresAt: now + ttlMs,
    };
    memoryIdempotency.set(memoryKey, next);
    return { claimed: true, ...next, durable: false };
  }

  return { claimed: false, ...current, durable: false };
};

export const claimIdempotency = async ({
  scope,
  key,
  ttlMs,
  forceMemory = false,
  now = Date.now(),
}) => {
  if (!key) return null;
  const normalizedTtlMs = Math.max(10000, Number(ttlMs) || 30 * 60 * 1000);
  const claimToken = crypto.randomUUID();
  const keyHash = securityHash(scope, key);

  if (canUseDurableStorage(forceMemory)) {
    const { data, error } = await supabase.rpc('pavoa_claim_idempotency', {
      p_scope: String(scope),
      p_key_hash: keyHash,
      p_claim_token: claimToken,
      p_ttl_seconds: Math.ceil(normalizedTtlMs / 1000),
    });

    if (!error && data) {
      return {
        claimed: Boolean(data.claimed),
        state: data.state || 'processing',
        response: data.response || null,
        claimToken,
        expiresAt: data.expires_at ? Date.parse(data.expires_at) : now + normalizedTtlMs,
        durable: true,
      };
    }

    warnFallback('idempotencia durable', error);
  }

  return claimMemoryIdempotency({
    scope,
    key,
    ttlMs: normalizedTtlMs,
    claimToken,
    now,
  });
};

export const getIdempotency = async ({ scope, key, forceMemory = false }) => {
  if (!key) return null;
  const keyHash = securityHash(scope, key);

  if (canUseDurableStorage(forceMemory)) {
    const { data, error } = await supabase
      .from('pavoa_idempotency')
      .select('state,response,expires_at')
      .eq('scope', String(scope))
      .eq('key_hash', keyHash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!error) {
      return data ? {
        state: data.state,
        response: data.response || null,
        expiresAt: Date.parse(data.expires_at),
        durable: true,
      } : null;
    }

    warnFallback('lectura de idempotencia durable', error);
  }

  const memoryKey = memoryIdempotencyKey(scope, key);
  const entry = memoryIdempotency.get(memoryKey);
  if (!entry || entry.expiresAt <= Date.now()) {
    memoryIdempotency.delete(memoryKey);
    return null;
  }
  return { ...entry, durable: false };
};

export const waitForIdempotency = async ({ scope, key, timeoutMs = 5000, forceMemory = false }) => {
  const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
  let record = await getIdempotency({ scope, key, forceMemory });

  while (record?.state === 'processing' && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    record = await getIdempotency({ scope, key, forceMemory });
  }

  return record;
};

export const completeIdempotency = async ({ scope, key, claimToken, response, ttlMs, forceMemory = false }) => {
  if (!key || !claimToken) return false;
  const keyHash = securityHash(scope, key);
  const normalizedTtlMs = Math.max(10000, Number(ttlMs) || 30 * 60 * 1000);

  if (canUseDurableStorage(forceMemory)) {
    const { data, error } = await supabase.rpc('pavoa_complete_idempotency', {
      p_scope: String(scope),
      p_key_hash: keyHash,
      p_claim_token: claimToken,
      p_response: response || {},
      p_ttl_seconds: Math.ceil(normalizedTtlMs / 1000),
    });
    if (error) warnFallback('finalizacion de idempotencia durable', error);
    if (!error && data === true) return true;
  }

  const memoryKey = memoryIdempotencyKey(scope, key);
  const current = memoryIdempotency.get(memoryKey);
  if (current && current.claimToken !== claimToken) return false;
  memoryIdempotency.set(memoryKey, {
    state: 'completed',
    response: response || {},
    claimToken,
    expiresAt: Date.now() + normalizedTtlMs,
  });
  return true;
};

export const failIdempotency = async ({ scope, key, claimToken, forceMemory = false }) => {
  if (!key || !claimToken) return false;
  const keyHash = securityHash(scope, key);

  if (canUseDurableStorage(forceMemory)) {
    const { data, error } = await supabase.rpc('pavoa_fail_idempotency', {
      p_scope: String(scope),
      p_key_hash: keyHash,
      p_claim_token: claimToken,
    });
    if (error) warnFallback('liberacion de idempotencia durable', error);
    if (!error && data === true) return true;
  }

  const memoryKey = memoryIdempotencyKey(scope, key);
  const current = memoryIdempotency.get(memoryKey);
  if (current?.claimToken === claimToken) {
    memoryIdempotency.set(memoryKey, { ...current, state: 'failed' });
    return true;
  }
  return false;
};

export const clearIdempotency = async ({ scope, key, forceMemory = false }) => {
  if (!key) return;
  const keyHash = securityHash(scope, key);
  if (canUseDurableStorage(forceMemory)) {
    const { error } = await supabase
      .from('pavoa_idempotency')
      .delete()
      .eq('scope', String(scope))
      .eq('key_hash', keyHash);
    if (error) warnFallback('limpieza de idempotencia durable', error);
  }
  memoryIdempotency.delete(memoryIdempotencyKey(scope, key));
};
