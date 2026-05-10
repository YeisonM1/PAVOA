import { getCliente } from '../services/authService';

const FUNNEL_ENDPOINT = '/api/contacto';
const FUNNEL_SESSION_KEY = 'pavoa-funnel-session-id';

const normalizeOptional = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

const getSessionId = () => {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(FUNNEL_SESSION_KEY);
  if (stored) return stored;

  const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(FUNNEL_SESSION_KEY, generated);
  return generated;
};

export const trackFunnelEvent = (eventType, payload = {}) => {
  if (typeof window === 'undefined' || !eventType) return;

  const cliente = getCliente();
  const body = {
    type: 'funnel-event',
    eventType,
    source: 'frontend',
    sessionId: getSessionId(),
    userId: normalizeOptional(cliente?.id),
    userEmail: normalizeOptional(cliente?.email),
    productId: normalizeOptional(payload.productId),
    productName: normalizeOptional(payload.productName),
    variantId: normalizeOptional(payload.variantId),
    color: normalizeOptional(payload.color),
    size: normalizeOptional(payload.size),
    orderId: normalizeOptional(payload.orderId),
    paymentId: normalizeOptional(payload.paymentId),
    amount: payload.amount ?? null,
    meta: {
      path: window.location.pathname,
      ...(payload.meta && typeof payload.meta === 'object' ? payload.meta : {}),
    },
  };

  fetch(FUNNEL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
};
