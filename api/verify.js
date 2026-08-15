import { supabase } from './_helpers/supabase.js';
import { consumeRateLimit, getClientIp } from './_helpers/durable-security.js';

const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.com.co';

const VERIFY_LIMIT = 20;
const VERIFY_WINDOW = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // El token son 32 bytes aleatorios, así que adivinarlo es inviable de todos
  // modos; el límite es alto para no estorbar a quien recarga su enlace.
  const rateLimit = await consumeRateLimit({
    scope: 'verify-email',
    identifier: getClientIp(req),
    limit: VERIFY_LIMIT,
    windowMs: VERIFY_WINDOW,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
  }

  const { token, email } = req.query;

  if (!token || !email) {
    return res.status(400).json({ error: 'invalid' });
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
      return res.status(400).json({ error: 'expired' });
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
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error verify:', err);
    return res.status(500).json({ error: 'server' });
  }
}
