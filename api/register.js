import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const resend  = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="margin:0;padding:0;background-color:#F2E4E1;font-family:Georgia,serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:48px 40px;">
                  <tr>
                    <td align="center" style="padding-bottom:32px;border-bottom:1px solid #F2E4E1;">
                      <p style="font-size:24px;font-weight:300;letter-spacing:0.3em;color:#0B0B0B;margin:0;text-transform:uppercase;">PAVOA</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding-top:32px;padding-bottom:24px;">
                      <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">Bienvenida</p>
                      <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                        Hola, ${firstName}
                      </h1>
                      <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:24px;"></div>
                      <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0 0 32px 0;">
                        Gracias por unirte a PAVOA. Para activar tu cuenta y comenzar a explorar nuestra colección, verifica tu dirección de correo electrónico.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:32px;">
                      <a href="${verifyLink}"
                         style="display:inline-block;background-color:#0B0B0B;color:#ffffff;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;padding:16px 40px;">
                        Verificar correo
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #F2E4E1;padding-top:24px;">
                      <p style="font-size:11px;color:#9ca3af;line-height:1.6;margin:0;text-align:center;">
                        Este enlace expira en 24 horas.<br>
                        Si no creaste esta cuenta, ignora este correo.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-top:32px;">
                      <p style="font-size:9px;letter-spacing:0.2em;color:#d1d5db;text-transform:uppercase;margin:0;">
                        © 2026 PAVOA. Todos los derechos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
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