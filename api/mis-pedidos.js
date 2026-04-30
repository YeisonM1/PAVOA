import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './_helpers/auth.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const tokenPayload = verifyToken(req);
  if (!tokenPayload) return res.status(401).json({ error: 'No autorizado. Inicia sesión de nuevo.' });

  const { action } = req.body || {};

  // ── Wishlist: obtener ─────────────────────────────────
  if (action === 'wishlist-get') {
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', tokenPayload.userId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ids: (data || []).map(r => r.product_id) });
  }

  // ── Wishlist: añadir ──────────────────────────────────
  if (action === 'wishlist-add') {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId requerido' });
    const { error } = await supabase
      .from('wishlists')
      .upsert({ user_id: tokenPayload.userId, product_id: productId }, { onConflict: 'user_id,product_id' });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── Wishlist: quitar ──────────────────────────────────
  if (action === 'wishlist-remove') {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId requerido' });
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', tokenPayload.userId)
      .eq('product_id', productId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── Mis pedidos (comportamiento original) ─────────────
  const { email } = req.body;
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
