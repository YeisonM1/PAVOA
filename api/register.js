import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import crypto from 'crypto';
import { emailVerificacion } from './_helpers/email-templates.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';

// Rate limiter — 5 registros por IP cada 15 minutos
const _registerAttempts = new Map();
const REG_LIMIT  = 5;
const REG_WINDOW = 15 * 60 * 1000;

function isRateLimited(ip) {
  const now   = Date.now();
  const entry = _registerAttempts.get(ip) || { count: 0, resetAt: now + REG_WINDOW };
  if (now > entry.resetAt) {
    _registerAttempts.set(ip, { count: 1, resetAt: now + REG_WINDOW });
    return false;
  }
  if (entry.count >= REG_LIMIT) return true;
  _registerAttempts.set(ip, { ...entry, count: entry.count + 1 });
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
  }

  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  }

  try {
    // 1. Verificar si el email ya existe
    const { data: existing } = await supabase
      .from('usuarios')
      .select('id, email_verified')
      .eq('email', email.toLowerCase())
      .single();

    if (existing?.email_verified) {
      return res.status(400).json({ error: 'Este correo ya está registrado.' });
    }

    // 2. Generar token de verificación
    const verify_token   = crypto.randomBytes(32).toString('hex');
    const verify_expires = Date.now() + 24 * 60 * 60 * 1000;

    if (existing && !existing.email_verified) {
      // Cuenta existe pero no verificada — actualizar token y reenviar correo
      await supabase
        .from('usuarios')
        .update({ verify_token, verify_expires })
        .eq('email', email.toLowerCase());
    } else {
      // 3. Hashear contraseña e insertar usuario nuevo
      const password_hash = await bcrypt.hash(password, 12);
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          first_name:     firstName,
          last_name:      lastName || '',
          email:          email.toLowerCase(),
          password_hash,
          verify_token,
          verify_expires,
          email_verified: false,
        });
      if (insertError) throw insertError;
    }

    // 4. Enviar email de verificación
    const verifyLink = `${APP_URL}/verify?token=${verify_token}&email=${encodeURIComponent(email)}`;

    try {
      await resend.emails.send({
      from:    'PAVOA <onboarding@resend.dev>',
      to:      email,
      subject: 'Verifica tu correo — PAVOA',
      html:    emailVerificacion({ firstName, verifyLink }),
      });
    } catch (emailErr) {
      console.error('⚠️ Email de verificación no enviado:', emailErr.message);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error register:', err);
    return res.status(500).json({ error: 'Error al crear la cuenta. Intenta de nuevo.' });
  }
}