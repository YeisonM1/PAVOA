import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';

// Rate limiter — 3 solicitudes por IP cada 15 minutos
const _forgotAttempts = new Map();
const FORGOT_LIMIT  = 3;
const FORGOT_WINDOW = 15 * 60 * 1000;

function isRateLimited(ip) {
  const now   = Date.now();
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

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos e intenta de nuevo.' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo es requerido.' });
  }

  try {
    // 1. Buscar si el usuario existe
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id, first_name')
      .eq('email', email.toLowerCase())
      .single();

    // Por seguridad, si no existe no devolvemos error, simulamos éxito para evitar enum de correos
    if (!usuario) {
      return res.status(200).json({ ok: true });
    }

    // 2. Generar token y expiración (1 hora)
    const reset_token = crypto.randomBytes(32).toString('hex');
    const reset_expires = Date.now() + 1 * 60 * 60 * 1000;

    // 3. Guardar en Supabase
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ reset_token, reset_expires })
      .eq('id', usuario.id);

    if (updateError) throw updateError;

    // 4. Enviar email con Resend (manteniendo el template de PAVOA)
    const resetLink = `${APP_URL}/reset-password?token=${reset_token}&email=${encodeURIComponent(email)}`;

    await resend.emails.send({
      from: 'PAVOA <onboarding@resend.dev>',
      to: email,
      subject: 'Recupera tu contraseña — PAVOA',
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
                      <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">Seguridad</p>
                      <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                        Hola, ${usuario.first_name}
                      </h1>
                      <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:24px;"></div>
                      <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0 0 32px 0;">
                        Hemos recibido una solicitud para restablecer tu contraseña. Si fuiste tú, haz clic en el botón de abajo para crear una nueva.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding-bottom:32px;">
                      <a href="${resetLink}"
                         style="display:inline-block;background-color:#0B0B0B;color:#ffffff;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.3em;text-transform:uppercase;padding:16px 40px;">
                        Restablecer Contraseña
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="border-top:1px solid #F2E4E1;padding-top:24px;">
                      <p style="font-size:11px;color:#9ca3af;line-height:1.6;margin:0;text-align:center;">
                        Este enlace expira en 1 hora.<br>
                        Si no solicitaste este cambio, ignora este correo.
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

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('Error forgot password:', err);
    return res.status(500).json({ error: 'Ocurrió un error. Intenta de nuevo más tarde.' });
  }
}
