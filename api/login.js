import bcrypt from 'bcryptjs';
import { signToken } from './_helpers/auth.js';
import { supabase } from './_helpers/supabase.js';
import { consumeRateLimit, getClientIp } from './_helpers/durable-security.js';

const RATE_LIMIT  = 10;
const RATE_WINDOW = 15 * 60 * 1000; // 15 minutos

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rateLimit = await consumeRateLimit({
    scope: 'login',
    identifier: getClientIp(req),
    limit: RATE_LIMIT,
    windowMs: RATE_WINDOW,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  try {
    // 1. Buscar usuario en Supabase
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    // 2. Verificar que el email esté verificado
    if (!usuario.email_verified) {
      return res.status(401).json({ error: 'Debes verificar tu correo antes de iniciar sesión.' });
    }

    // 3. Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    // 4. Generar token JWT firmado
    const token = signToken({
      userId: usuario.id,
      email:  usuario.email,
    });
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 días

    return res.status(200).json({
      ok: true,
      token,
      expiresAt,
      usuario: {
        id:         usuario.id,
        firstName:  usuario.first_name,
        lastName:   usuario.last_name,
        email:      usuario.email,
      },
    });

  } catch (err) {
    console.error('Error login:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión. Intenta de nuevo.' });
  }
}
