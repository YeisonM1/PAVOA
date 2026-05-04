import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { emailResetPassword } from './_helpers/email-templates.js';
import { sendTransactionalEmail } from './_helpers/mail.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';

const _forgotAttempts = new Map();
const FORGOT_LIMIT = 3;
const FORGOT_WINDOW = 15 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = _forgotAttempts.get(ip) || { count: 0, resetAt: now + FORGOT_WINDOW };
  if (now > entry.resetAt) {
    _forgotAttempts.set(ip, { count: 1, resetAt: now + FORGOT_WINDOW });
    return false;
  }
  if (entry.count >= FORGOT_LIMIT) return true;
  _forgotAttempts.set(ip, { ...entry, count: entry.count + 1 });
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';

  if (isRateLimited(ip)) {
    return res
      .status(429)
      .json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo es requerido.' });
  }

  try {
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, first_name')
      .eq('email', email.toLowerCase())
      .single();

    if (!usuario) {
      return res.status(200).json({ ok: true });
    }

    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_expires = Date.now() + 1 * 60 * 60 * 1000;

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ reset_token, reset_expires })
      .eq('id', usuario.id);

    if (updateError) throw updateError;

    const resetLink = `${APP_URL}/reset-password?token=${reset_token}&email=${encodeURIComponent(email)}`;

    await sendTransactionalEmail({
      from: 'PAVOA <onboarding@resend.dev>',
      to: email,
      subject: 'Recupera tu contrasena - PAVOA',
      html: emailResetPassword({
        firstName: usuario.first_name,
        resetLink,
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error forgot password:', err);
    return res.status(500).json({ error: 'Ocurrio un error. Intenta de nuevo mas tarde.' });
  }
}
