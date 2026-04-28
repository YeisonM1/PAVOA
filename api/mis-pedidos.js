import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './_helpers/auth.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar JWT — el email solicitado debe coincidir con el del token
  const tokenPayload = verifyToken(req);
  if (!tokenPayload) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión de nuevo.' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  // Protección: solo puedes consultar tus propios pedidos
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
