import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, productId, productNombre, talla, color } = req.body;
  if (!email || !productId) return res.status(400).json({ error: 'email y productId son requeridos.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return res.status(400).json({ error: 'Email inválido.' });

  try {
    const { error } = await supabase.from('stock_alerts').insert({
      email:          email.toLowerCase().trim(),
      product_id:     productId,
      product_nombre: productNombre || '',
      talla:          talla || null,
      color:          color || null,
      notified:       false,
      created_at:     new Date().toISOString(),
    });

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error stock alert:', err.message);
    return res.status(500).json({ error: 'No se pudo registrar. Intenta de nuevo.' });
  }
}
