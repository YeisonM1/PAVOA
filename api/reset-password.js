import bcrypt from 'bcryptjs';
import { supabase } from './_helpers/supabase.js';
import { consumeRateLimit, getClientIp } from './_helpers/durable-security.js';

// Alineado con register.js: cambiar la contraseña no puede ser la vía para
// dejarla más débil de lo que se exige al crear la cuenta.
const MIN_PASSWORD_LENGTH = 8;
const RESET_LIMIT = 5;
const RESET_WINDOW = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Login, registro y forgot-password ya limitaban intentos; este endpoint no,
  // y es el que efectivamente cambia la contraseña.
  const rateLimit = await consumeRateLimit({
    scope: 'reset-password',
    identifier: getClientIp(req),
    limit: RESET_LIMIT,
    windowMs: RESET_WINDOW,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
  }

  const { email, token, newPassword } = req.body;

  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Datos incompletos.' });
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res.status(400).json({ error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` });
  }

  try {
    // 1. Buscar usuario y verificar token
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('id, reset_token, reset_expires')
      .eq('email', email.toLowerCase())
      .single();

    // Un mensaje distinto para "el correo no existe" y para "el token no
    // coincide" revelaba qué correos tienen cuenta, que es justo lo que el
    // login evita al responder siempre lo mismo. Aquí no cuesta nada: para
    // quien llega con un enlace, ambos casos significan lo mismo.
    const enlaceInvalido = () =>
      res.status(400).json({ error: 'El enlace es inválido o ya se usó. Solicita uno nuevo.' });

    if (error || !usuario) return enlaceInvalido();
    if (!usuario.reset_token || usuario.reset_token !== token) return enlaceInvalido();

    if (Date.now() > usuario.reset_expires) {
      return res.status(400).json({ error: 'El enlace ha expirado. Solicita uno nuevo.' });
    }

    // 2. Hashear nueva contraseña
    const password_hash = await bcrypt.hash(newPassword, 12);

    // 3. Actualizar contraseña y limpiar tokens
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ 
        password_hash,
        reset_token: null,
        reset_expires: null 
      })
      .eq('id', usuario.id);

    if (updateError) throw updateError;

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error reset password:', err);
    return res.status(500).json({ error: 'Error al actualizar contraseña. Intenta de nuevo.' });
  }
}