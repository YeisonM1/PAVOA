import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './_helpers/auth.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verificar JWT — solo usuarios autenticados pueden consultar descuentos
  const tokenPayload = verifyToken(req);
  if (!tokenPayload) {
    return res.status(200).json({ disponible: false });
  }

  const { email } = req.body;
  if (!email) return res.status(200).json({ disponible: false });

  // Solo puedes consultar tu propio descuento
  if (tokenPayload.email.toLowerCase() !== email.toLowerCase()) {
    return res.status(200).json({ disponible: false });
  }

  try {
    const { data } = await supabase
      .from('usuarios')
      .select('descuento_bienvenida_usado')
      .eq('email', email.toLowerCase())
      .eq('email_verified', true)
      .single();

    return res.status(200).json({ disponible: data ? !data.descuento_bienvenida_usado : false });
  } catch {
    return res.status(200).json({ disponible: false });
  }
}
