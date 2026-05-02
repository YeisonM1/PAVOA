import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './_helpers/auth.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

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
              last_action_at: new Date().toISOString(),
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
      return res.status(200).json({ ok: false });
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
