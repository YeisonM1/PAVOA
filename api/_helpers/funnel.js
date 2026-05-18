import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const JOURNEY_ERROR_EVENTS = new Set([
  'draft_order_failed',
  'payment_preference_failed',
  'checkout_error',
]);

const normalizeOptional = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized || null;
};

const normalizeAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
};

const normalizeLineItem = (item = {}) => ({
  product_id: normalizeOptional(item?.product_id || item?.productId || item?.sku || item?.variant_id || item?.id),
  product_name: normalizeOptional(item?.product_name || item?.productName || item?.product_nombre || item?.product || item?.nombre || item?.title || item?.name),
  variant_id: normalizeOptional(item?.variant_id || item?.variantId),
  color: normalizeOptional(item?.color),
  size: normalizeOptional(item?.size || item?.talla || item?.variant_title || item?.variantTitle),
  quantity: Number(item?.quantity || item?.cantidad || 0),
  amount: normalizeAmount(item?.amount || item?.precio || item?.price || item?.unit_price),
});

const getLineItemsFromMeta = (meta = {}) => (
  Array.isArray(meta?.line_items)
    ? meta.line_items.map(normalizeLineItem).filter((item) => item.product_id || item.product_name)
    : []
);

const buildFallbackLineItems = (payload) => {
  if (!payload.productId && !payload.productName) return [];
  return [{
    product_id: normalizeOptional(payload.productId),
    product_name: normalizeOptional(payload.productName),
    variant_id: normalizeOptional(payload.variantId),
    color: normalizeOptional(payload.color),
    size: normalizeOptional(payload.size),
    quantity: 1,
    amount: normalizeAmount(payload.amount),
  }];
};

const getEffectiveLineItems = (payload = {}) => {
  const fromMeta = getLineItemsFromMeta(payload.meta);
  return fromMeta.length > 0 ? fromMeta : buildFallbackLineItems(payload);
};

const getPrimaryItem = (payload = {}) => {
  if (payload.productId || payload.productName) {
    return {
      productId: normalizeOptional(payload.productId),
      productName: normalizeOptional(payload.productName),
      variantId: normalizeOptional(payload.variantId),
      color: normalizeOptional(payload.color),
      size: normalizeOptional(payload.size),
    };
  }

  const [firstItem] = getEffectiveLineItems(payload);
  if (!firstItem) return null;

  return {
    productId: firstItem.product_id || null,
    productName: firstItem.product_name || null,
    variantId: firstItem.variant_id || null,
    color: firstItem.color || null,
    size: firstItem.size || null,
  };
};

const getVariantLabel = ({ color = null, size = null } = {}) =>
  [normalizeOptional(color), normalizeOptional(size)].filter(Boolean).join(' / ') || null;

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const maxIso = (left, right) => {
  const leftMs = left ? new Date(left).getTime() : 0;
  const rightMs = right ? new Date(right).getTime() : 0;
  if (!leftMs) return right || null;
  if (!rightMs) return left || null;
  return rightMs > leftMs ? right : left;
};

const diffSeconds = (start, end) => {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return null;
  return Math.round((endMs - startMs) / 1000);
};

const buildTimelineEntry = (payload, createdAt) => ({
  event_type: normalizeOptional(payload.eventType),
  created_at: createdAt,
  product_name: normalizeOptional(payload.productName),
  product_id: normalizeOptional(payload.productId),
  color: normalizeOptional(payload.color),
  size: normalizeOptional(payload.size),
  amount: normalizeAmount(payload.amount),
});

const appendTimeline = (existingTimeline = [], nextEntry) => {
  const safeTimeline = Array.isArray(existingTimeline) ? existingTimeline : [];
  const dedupeKey = `${nextEntry.event_type}:${nextEntry.created_at}:${nextEntry.product_id || ''}:${nextEntry.product_name || ''}`;
  const filtered = safeTimeline.filter((entry) => {
    const currentKey = `${entry?.event_type || ''}:${entry?.created_at || ''}:${entry?.product_id || ''}:${entry?.product_name || ''}`;
    return currentKey !== dedupeKey;
  });

  return [...filtered, nextEntry]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .slice(-24);
};

const incrementEventTypes = (currentValue = {}, eventType) => {
  const next = currentValue && typeof currentValue === 'object' && !Array.isArray(currentValue)
    ? { ...currentValue }
    : {};
  next[eventType] = Number(next[eventType] || 0) + 1;
  return next;
};

const chooseStatus = (journey, eventType) => {
  if (eventType === 'purchase_completed' || journey.completed_at) return 'purchase_completed';
  if (eventType === 'payment_approved') return 'payment_approved';
  if (eventType === 'payment_rejected') return 'payment_rejected';
  if (eventType === 'payment_pending') return 'payment_pending';
  if (eventType === 'checkout_abandon') return 'checkout_abandoned';
  if (JOURNEY_ERROR_EVENTS.has(eventType)) return 'checkout_error';
  if (journey.payment_click_at || journey.begin_checkout_at || journey.order_id || journey.payment_id) {
    return 'in_checkout';
  }
  if (journey.add_to_cart_at) return 'in_cart';
  if (journey.viewed_at || journey.first_variant_at) return 'browsing';
  return 'interest_only';
};

const buildJourneyKey = (payload, primaryItem) => {
  if (payload.paymentId) return `payment:${payload.paymentId}`;
  if (payload.orderId) return `order:${payload.orderId}`;
  if (payload.sessionId && primaryItem?.productId) {
    return `session:${payload.sessionId}:product:${primaryItem.productId}`;
  }
  if (payload.sessionId) return `session:${payload.sessionId}:general`;
  if (payload.userEmail && primaryItem?.productId) {
    return `email:${payload.userEmail}:product:${primaryItem.productId}`;
  }
  return `journey:${Date.now()}:${Math.random().toString(16).slice(2)}`;
};

const pickOpenJourney = (journeys = []) => {
  if (!Array.isArray(journeys) || journeys.length === 0) return null;
  const active = journeys.find((journey) => !journey.completed_at && journey.status !== 'payment_rejected');
  return active || journeys[0] || null;
};

const findExistingJourney = async (payload, primaryItem) => {
  if (!supabase) return null;

  if (payload.paymentId) {
    const { data } = await supabase
      .from('funnel_journeys')
      .select('*')
      .eq('payment_id', payload.paymentId)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  if (payload.orderId) {
    const { data } = await supabase
      .from('funnel_journeys')
      .select('*')
      .eq('order_id', payload.orderId)
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }

  if (payload.sessionId) {
    let query = supabase
      .from('funnel_journeys')
      .select('*')
      .eq('session_id', payload.sessionId)
      .order('last_event_at', { ascending: false })
      .limit(10);

    if (primaryItem?.productId) {
      query = query.eq('primary_product_id', primaryItem.productId);
    }

    const { data } = await query;
    const picked = pickOpenJourney(data);
    if (picked) return picked;
  }

  return null;
};

const buildJourneyPayload = ({ existingJourney, payload, createdAt }) => {
  const primaryItem = getPrimaryItem(payload);
  const incomingLineItems = getEffectiveLineItems(payload);
  const eventType = normalizeOptional(payload.eventType);
  const timelineEntry = buildTimelineEntry(payload, createdAt);
  const lineItems = incomingLineItems.length > 0
    ? incomingLineItems
    : (Array.isArray(existingJourney?.line_items) ? existingJourney.line_items : []);

  const primaryLineItem = primaryItem || (
    lineItems[0]
      ? {
          productId: lineItems[0]?.product_id || null,
          productName: lineItems[0]?.product_name || null,
          variantId: lineItems[0]?.variant_id || null,
          color: lineItems[0]?.color || null,
          size: lineItems[0]?.size || null,
        }
      : null
  );

  const startedAt = existingJourney?.started_at || createdAt;
  const next = {
    journey_key: existingJourney?.journey_key || buildJourneyKey(payload, primaryLineItem),
    session_id: normalizeOptional(payload.sessionId) || existingJourney?.session_id || null,
    user_id: normalizeOptional(payload.userId) || existingJourney?.user_id || null,
    user_email: normalizeOptional(payload.userEmail)?.toLowerCase() || existingJourney?.user_email || null,
    actor_type: normalizeOptional(payload.userId) || existingJourney?.user_id ? 'auth' : 'guest',
    primary_product_id: primaryLineItem?.productId || existingJourney?.primary_product_id || null,
    primary_product_name: primaryLineItem?.productName || existingJourney?.primary_product_name || null,
    primary_variant_id: primaryLineItem?.variantId || existingJourney?.primary_variant_id || null,
    primary_variant_label:
      getVariantLabel({ color: primaryLineItem?.color, size: primaryLineItem?.size }) ||
      existingJourney?.primary_variant_label ||
      null,
    is_multi_product: lineItems.length > 1,
    product_count: lineItems.length > 0 ? lineItems.length : Number(existingJourney?.product_count || 0),
    started_at: startedAt,
    viewed_at: existingJourney?.viewed_at || (eventType === 'view_product' ? createdAt : null),
    first_variant_at:
      existingJourney?.first_variant_at ||
      ((eventType === 'select_color' || eventType === 'select_size') ? createdAt : null),
    add_to_cart_at: existingJourney?.add_to_cart_at || (eventType === 'add_to_cart' ? createdAt : null),
    begin_checkout_at:
      existingJourney?.begin_checkout_at ||
      ((eventType === 'begin_checkout' || eventType === 'draft_order_created') ? createdAt : null),
    payment_click_at:
      existingJourney?.payment_click_at ||
      ((eventType === 'payment_click' || eventType === 'payment_preference_created') ? createdAt : null),
    payment_result_at:
      eventType === 'payment_approved' || eventType === 'payment_pending' || eventType === 'payment_rejected'
        ? createdAt
        : (existingJourney?.payment_result_at || null),
    completed_at: eventType === 'purchase_completed' ? createdAt : (existingJourney?.completed_at || null),
    last_event_at: maxIso(existingJourney?.last_event_at, createdAt) || createdAt,
    order_id: normalizeOptional(payload.orderId) || existingJourney?.order_id || null,
    payment_id: normalizeOptional(payload.paymentId) || existingJourney?.payment_id || null,
    amount: normalizeAmount(payload.amount) ?? existingJourney?.amount ?? null,
    line_items: lineItems,
    timeline: appendTimeline(existingJourney?.timeline, timelineEntry),
    event_types: incrementEventTypes(existingJourney?.event_types, eventType),
    event_count: Number(existingJourney?.event_count || 0) + 1,
    error_count: Number(existingJourney?.error_count || 0) + (JOURNEY_ERROR_EVENTS.has(eventType) ? 1 : 0),
    created_at: existingJourney?.created_at || createdAt,
    updated_at: createdAt,
  };

  next.status = chooseStatus(next, eventType);
  next.time_to_variant_seconds = diffSeconds(next.viewed_at, next.first_variant_at);
  next.time_to_cart_seconds = diffSeconds(next.viewed_at || next.started_at, next.add_to_cart_at);
  next.time_in_cart_seconds = diffSeconds(next.add_to_cart_at, next.begin_checkout_at);
  next.time_in_checkout_seconds = diffSeconds(
    next.begin_checkout_at,
    next.completed_at || next.payment_result_at || next.payment_click_at,
  );
  next.time_to_purchase_seconds = diffSeconds(next.payment_click_at, next.completed_at);
  next.total_duration_seconds = diffSeconds(
    next.started_at,
    next.completed_at || next.payment_result_at || next.last_event_at,
  );

  return next;
};

const syncJourney = async (payload, createdAt) => {
  if (!supabase) return false;

  const primaryItem = getPrimaryItem(payload);
  const existingJourney = await findExistingJourney(payload, primaryItem);
  const journeyPayload = buildJourneyPayload({ existingJourney, payload, createdAt });

  const { error } = await supabase
    .from('funnel_journeys')
    .upsert(journeyPayload, { onConflict: 'journey_key' });

  if (error) {
    console.warn('[PAVOA] No se pudo sincronizar funnel_journeys:', error.message);
    return false;
  }

  return true;
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
  createdAt = null,
} = {}) => {
  if (!supabase || !eventType) return false;

  const normalizedEventKey = normalizeOptional(eventKey);
  let existingEvent = null;

  if (normalizedEventKey) {
    const { data } = await supabase
      .from('funnel_events')
      .select('id')
      .eq('event_key', normalizedEventKey)
      .limit(1)
      .maybeSingle();
    existingEvent = data || null;
  }

  const eventTimestamp = toIsoOrNull(createdAt) || new Date().toISOString();
  const payload = {
    event_key: normalizedEventKey,
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
    created_at: eventTimestamp,
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

    if (!existingEvent) {
      await syncJourney({
        eventType: payload.event_type,
        source: payload.source,
        sessionId: payload.session_id,
        userId: payload.user_id,
        userEmail: payload.user_email,
        productId: payload.product_id,
        productName: payload.product_name,
        variantId: payload.variant_id,
        color: payload.color,
        size: payload.size,
        orderId: payload.order_id,
        paymentId: payload.payment_id,
        amount: payload.amount,
        meta: payload.meta,
      }, eventTimestamp);
    }

    return true;
  } catch (error) {
    console.warn('[PAVOA] Error registrando evento de embudo:', error?.message || error);
    return false;
  }
};
