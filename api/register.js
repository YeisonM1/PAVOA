import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { emailVerificacion } from './_helpers/email-templates.js';
import { sendTransactionalEmail } from './_helpers/mail.js';
import { consumeRateLimit, getClientIp } from './_helpers/durable-security.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.com.co';

const REG_LIMIT = 5;
const REG_WINDOW = 15 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'register',
    identifier: getClientIp(req),
    limit: REG_LIMIT,
    windowMs: REG_WINDOW,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    return res
      .status(429)
      .json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
  }

  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contrasena debe tener al menos 8 caracteres.' });
  }

  try {
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (existing?.email_verified) {
      return res.status(400).json({ error: 'Este correo ya esta registrado.' });
    }

    const verify_token = crypto.randomBytes(32).toString('hex');
    const verify_expires = Date.now() + 24 * 60 * 60 * 1000;

    if (existing && !existing.email_verified) {
      await supabase
        .from('usuarios')
        .update({ verify_token, verify_expires })
        .eq('email', email.toLowerCase());
    } else {
      const password_hash = await bcrypt.hash(password, 12);
      const { error: insertError } = await supabase.from('usuarios').insert({
        first_name: firstName,
        last_name: lastName || '',
        email: email.toLowerCase(),
        password_hash,
        verify_token,
        verify_expires,
        email_verified: false,
      });

      if (insertError) throw insertError;
    }

    const verifyLink = `${APP_URL}/verify?token=${verify_token}&email=${encodeURIComponent(email)}`;

    try {
      const emailResult = await sendTransactionalEmail({
        from: 'PAVOA <onboarding@resend.dev>',
        to: email,
        subject: 'Activa tu cuenta PAVOA',
        html: emailVerificacion({ firstName, verifyLink }),
      });
      console.info('[PAVOA] Email de verificacion enviado:', emailResult?.id || 'sin-id');
    } catch (emailErr) {
      console.error('Email de verificacion no enviado:', emailErr.message);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error register:', err);
    return res.status(500).json({ error: 'Error al crear la cuenta. Intenta de nuevo.' });
  }
}
