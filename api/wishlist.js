import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './_helpers/auth.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const payload = verifyToken(req);
  if (!payload) return res.status(401).json({ error: 'No autorizado' });

  const { userId } = payload;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ids: (data || []).map(r => r.product_id) });
  }

  if (req.method === 'POST') {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId requerido' });

    const { error } = await supabase
      .from('wishlists')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { productId } = req.body || {};
    if (!productId) return res.status(400).json({ error: 'productId requerido' });

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
