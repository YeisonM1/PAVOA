import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const normalizeOptional = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

const normalizeAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

export const trackFunnelEvent = async ({
  eventKey = null,
  eventType,
  source = 'backend',
  sessionId = null,
  userId = null,
  userEmail = null,
  productId = null,
  productName = null,
  variantId = null,
  color = null,
  size = null,
  orderId = null,
  paymentId = null,
  amount = null,
  meta = {},
} = {}) => {
  if (!supabase || !eventType) return false;

  const payload = {
    event_key: normalizeOptional(eventKey),
    event_type: normalizeOptional(eventType),
    source: normalizeOptional(source) || 'backend',
    session_id: normalizeOptional(sessionId),
    user_id: normalizeOptional(userId),
    user_email: normalizeOptional(userEmail)?.toLowerCase() || null,
    product_id: normalizeOptional(productId),
    product_name: normalizeOptional(productName),
    variant_id: normalizeOptional(variantId),
    color: normalizeOptional(color),
    size: normalizeOptional(size),
    order_id: normalizeOptional(orderId),
    payment_id: normalizeOptional(paymentId),
    amount: normalizeAmount(amount),
    meta: meta && typeof meta === 'object' ? meta : {},
  };

  try {
    const query = payload.event_key
      ? supabase.from('funnel_events').upsert(payload, { onConflict: 'event_key' })
      : supabase.from('funnel_events').insert(payload);

    const { error } = await query;
    if (error) {
      console.warn('[PAVOA] No se pudo registrar evento de embudo:', error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('[PAVOA] Error registrando evento de embudo:', error?.message || error);
    return false;
  }
};
