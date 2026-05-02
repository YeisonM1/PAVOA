import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import { verifyToken } from './_helpers/auth.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const GUEST_WINDOW_HOURS = 24;

const toHash = (value) =>
  createHash('sha256').update(String(value || '')).digest('hex');

const getClientIp = (req) => {
  const xfwd = req.headers['x-forwarded-for'];
  if (Array.isArray(xfwd) && xfwd.length > 0) return xfwd[0].split(',')[0].trim();
  if (typeof xfwd === 'string' && xfwd.length > 0) return xfwd.split(',')[0].trim();
  const xreal = req.headers['x-real-ip'];
  if (Array.isArray(xreal) && xreal.length > 0) return xreal[0];
  if (typeof xreal === 'string' && xreal.length > 0) return xreal;
  return req.socket?.remoteAddress || '';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body || {};
  const tokenPayload = verifyToken(req);

  // Wishlist analytics events: auth + guest
  if (action === 'wishlist-track') {
    const { productId, actionType, anonId } = req.body || {};

    if (!productId || !['add', 'remove'].includes(actionType)) {
      return res.status(400).json({ error: 'productId y actionType validos son requeridos' });
    }

    const actorType = tokenPayload ? 'auth' : 'guest';
    const actorId = tokenPayload?.userId || anonId || null;
    const userEmail = tokenPayload?.email || null;
    const nowIso = new Date().toISOString();

    if (!actorId) return res.status(400).json({ error: 'actorId requerido' });

    const insertEvent = async () => {
      const { error } = await supabase
        .from('wishlist_events')
        .insert({
          product_id: productId,
          action_type: actionType,
          actor_type: actorType,
          actor_id: actorId,
          user_id: tokenPayload?.userId || null,
          user_email: userEmail,
      });
      if (error) throw error;
    };

    try {
      if (actorType === 'guest' && actionType === 'add') {
        const ip = getClientIp(req);
        const userAgent = req.headers['user-agent'] || '';
        const fingerprintHash = toHash(`${ip}|${userAgent}`);

        const { data: windowRow, error: windowFindError } = await supabase
          .from('wishlist_guest_window')
          .select('last_add_at')
          .eq('fingerprint_hash', fingerprintHash)
          .eq('product_id', productId)
          .limit(1);

        if (windowFindError) {
          console.error('Error wishlist_guest_window select:', windowFindError.message);
        } else if ((windowRow || []).length > 0) {
          const last = new Date(windowRow[0].last_add_at).getTime();
          const diffHours = (Date.now() - last) / (1000 * 60 * 60);
          if (diffHours < GUEST_WINDOW_HOURS) {
            return res.status(200).json({ ok: true, deduped: true, reason: 'guest_window' });
          }
        }

        const { error: windowUpsertError } = await supabase
          .from('wishlist_guest_window')
          .upsert(
            {
              fingerprint_hash: fingerprintHash,
              product_id: productId,
              last_add_at: nowIso,
            },
            { onConflict: 'fingerprint_hash,product_id' }
          );
        if (windowUpsertError) {
          console.error('Error wishlist_guest_window upsert:', windowUpsertError.message);
        }
      }

      if (actionType === 'add') {
        const { data: existing, error: findError } = await supabase
          .from('wishlist_actor_state')
          .select('id')
          .eq('actor_type', actorType)
          .eq('actor_id', actorId)
          .eq('product_id', productId)
          .limit(1);
        if (findError) throw findError;

        // Ya estaba activo: no contamos otro "add"
        if ((existing || []).length > 0) return res.status(200).json({ ok: true, deduped: true });

        const { error: upsertError } = await supabase
          .from('wishlist_actor_state')
          .upsert(
            {
              actor_type: actorType,
              actor_id: actorId,
              product_id: productId,
              user_id: tokenPayload?.userId || null,
              user_email: userEmail,
              last_action_at: nowIso,
            },
            { onConflict: 'actor_type,actor_id,product_id' }
          );
        if (upsertError) throw upsertError;

        await insertEvent();
        return res.status(200).json({ ok: true });
      }

      // remove
      const { data: removed, error: removeStateError } = await supabase
        .from('wishlist_actor_state')
        .delete()
        .eq('actor_type', actorType)
        .eq('actor_id', actorId)
        .eq('product_id', productId)
        .select('id');
      if (removeStateError) throw removeStateError;

      // Si no estaba activo, no contamos otro "remove"
      if ((removed || []).length === 0) return res.status(200).json({ ok: true, deduped: true });

      await insertEvent();
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Error wishlist-track:', error.message);
      return res.status(200).json({ ok: false, error: error.message });
    }
  }

  // From here, auth is required
  if (!tokenPayload) return res.status(401).json({ error: 'No autorizado. Inicia sesion de nuevo.' });

  // Wishlist: get
  if (action === 'wishlist-get') {
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', tokenPayload.userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ids: (data || []).map(r => r.product_id) });
  }

  // Wishlist: add
  if (action === 'wishlist-add') {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId requerido' });
    const { error } = await supabase
      .from('wishlists')
      .upsert({ user_id: tokenPayload.userId, product_id: productId }, { onConflict: 'user_id,product_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // Wishlist: remove
  if (action === 'wishlist-remove') {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId requerido' });
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', tokenPayload.userId)
      .eq('product_id', productId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // Original behavior: fetch user orders
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  if (tokenPayload.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(403).json({ error: 'No autorizado para ver estos pedidos.' });
  }

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('email', email.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pedidos:', error);
    return res.status(500).json({ error: 'Error al obtener pedidos' });
  }

  return res.status(200).json({ pedidos: data || [] });
}
