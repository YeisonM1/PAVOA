const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { nombre, contacto, asunto, mensaje } = req.body;

  if (!nombre?.trim() || !contacto?.trim() || !asunto?.trim() || !mensaje?.trim()) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const safeNombre   = escapeHtml(nombre);
  const safeContacto = escapeHtml(contacto);
  const safeAsunto   = escapeHtml(asunto);
  const safeMensaje  = escapeHtml(mensaje);

  try {
    // ── Email a la dueña (notificación del mensaje) ──
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: 'PAVOA Contacto <onboarding@resend.dev>',
        to: ['gyeison184@gmail.com'],
        subject: `Nuevo mensaje — ${safeAsunto}`,
        html: `
          <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            
            <!-- Header -->
            <div style="background: #0e0e0e; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 0.3em; margin: 0;">PAVOA</h1>
            </div>

            <!-- Body -->
            <div style="padding: 40px;">
              <p style="font-size: 11px; font-weight: 600; letter-spacing: 0.25em; text-transform: uppercase; color: #888; margin-bottom: 24px;">
                Nuevo mensaje de contacto
              </p>

              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #888; width: 30%;">Nombre</td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #0e0e0e;">${safeNombre}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #888;">Contacto</td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #0e0e0e;">${safeContacto}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #888;">Asunto</td>
                  <td style="padding: 14px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #0e0e0e;">${safeAsunto}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #888; vertical-align: top;">Mensaje</td>
                  <td style="padding: 14px 0; font-size: 13px; color: #0e0e0e; line-height: 1.7;">${safeMensaje}</td>
                </tr>
              </table>
            </div>

            <!-- Footer -->
            <div style="background: #f5f4f1; padding: 20px 40px; text-align: center;">
              <p style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin: 0;">
                PAVOA · pavoa.vercel.app
              </p>
            </div>
          </div>
        `,
      }),
    });

    // ── Email al cliente (confirmación) ──
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: 'PAVOA <onboarding@resend.dev>',
        to: ['gyeison184@gmail.com'],
        subject: 'Recibimos tu mensaje — PAVOA',
        html: `
          <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">

            <!-- Header -->
            <div style="background: #0e0e0e; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 0.3em; margin: 0;">PAVOA</h1>
            </div>

            <!-- Body -->
            <div style="padding: 48px 40px; text-align: center;">
              <div style="width: 48px; height: 48px; border: 1px solid #0e0e0e; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                <span style="font-size: 20px;">✓</span>
              </div>
              <h2 style="font-size: 18px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: #0e0e0e; margin-bottom: 16px;">
                Mensaje recibido
              </h2>
              <p style="font-size: 13px; color: #888; line-height: 1.8; max-width: 360px; margin: 0 auto 32px;">
                Hola <strong style="color: #0e0e0e;">${safeNombre}</strong>, recibimos tu mensaje sobre <em>${safeAsunto}</em>. Te respondemos en un máximo de 24 horas hábiles.
              </p>
              <div style="height: 1px; background: #f0f0f0; margin-bottom: 32px;"></div>
              <p style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #888;">
                Mientras tanto, explora nuestra colección
              </p>
              <a href="https://pavoa.vercel.app/categoria" 
                style="display: inline-block; margin-top: 16px; padding: 14px 32px; background: #0e0e0e; color: #ffffff; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none;">
                Ver colección
              </a>
            </div>

            <!-- Footer -->
            <div style="background: #f5f4f1; padding: 20px 40px; text-align: center;">
              <p style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin: 0;">
                PAVOA · pavoa.vercel.app
              </p>
            </div>
          </div>
        `,
      }),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('❌ Error Resend:', err);
    return res.status(500).json({ error: 'Error al enviar el email' });
  }
}