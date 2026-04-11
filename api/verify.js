import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { token, email } = req.query;

  if (!token || !email) {
    return res.redirect(`${APP_URL}/login?error=invalid`);
  }

  try {
    // 1. Buscar usuario con ese token
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', decodeURIComponent(email).toLowerCase())
      .eq('verify_token', token)
      .single();

    if (error || !usuario) {
      return res.redirect(`${APP_URL}/login?error=invalid`);
    }

    // 2. Verificar que el token no haya expirado
    if (Date.now() > usuario.verify_expires) {
      return res.redirect(`${APP_URL}/login?error=expired`);
    }

    // 3. Marcar email como verificado
    await supabase
      .from('usuarios')
      .update({
        email_verified: true,
        verify_token:   null,
        verify_expires: null,
      })
      .eq('id', usuario.id);

    // 4. Redirigir al login con éxito
    return res.redirect(`${APP_URL}/login?verified=true`);

  } catch (err) {
    console.error('Error verify:', err);
    return res.redirect(`${APP_URL}/login?error=server`);
  }
}