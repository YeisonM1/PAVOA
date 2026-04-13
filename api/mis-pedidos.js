import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

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
