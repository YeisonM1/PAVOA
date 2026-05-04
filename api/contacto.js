import { createClient } from '@supabase/supabase-js';
import { sendTransactionalEmail } from './_helpers/mail.js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());

const normalizeOptional = (value) => {
  const normalized = String(value || '').trim();
  return normalized || null;
};

const applyOptionalFilter = (query, column, value) => (
  value === null
    ? query.is(column, null)
    : query.eq(column, value)
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  // Stock alert branch
  if (req.body?.type === 'stock-alert') {
    const { email, productId, productNombre, talla, color, variantId } = req.body;
    if (!email || !productId) return res.status(400).json({ error: 'email y productId son requeridos.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Email invalido.' });

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedTalla = normalizeOptional(talla);
    const normalizedColor = normalizeOptional(color);
    const normalizedVariantId = normalizeOptional(variantId);

    try {
      let existingQuery = supabase
        .from('stock_alerts')
        .select('id')
        .eq('email', normalizedEmail)
        .eq('product_id', productId)
        .eq('notified', false);

      existingQuery = applyOptionalFilter(existingQuery, 'talla', normalizedTalla);
      existingQuery = applyOptionalFilter(existingQuery, 'color', normalizedColor);
      existingQuery = applyOptionalFilter(existingQuery, 'variant_id', normalizedVariantId);

      const { data: existingAlerts, error: existingError } = await existingQuery.limit(2);
      if (existingError) throw existingError;
      if ((existingAlerts || []).length > 0) return res.status(200).json({ ok: true, duplicate: true });

      // Compatibilidad con alertas viejas creadas antes de guardar variant_id.
      if (normalizedVariantId !== null) {
        let legacyQuery = supabase
          .from('stock_alerts')
          .select('id')
          .eq('email', normalizedEmail)
          .eq('product_id', productId)
          .eq('notified', false)
          .is('variant_id', null);

        legacyQuery = applyOptionalFilter(legacyQuery, 'talla', normalizedTalla);
        legacyQuery = applyOptionalFilter(legacyQuery, 'color', normalizedColor);

        const { data: legacyAlerts, error: legacyError } = await legacyQuery.limit(2);
        if (legacyError) throw legacyError;
        if ((legacyAlerts || []).length > 0) return res.status(200).json({ ok: true, duplicate: true });
      }

      const { error } = await supabase.from('stock_alerts').insert({
        email: normalizedEmail,
        product_id: productId,
        product_nombre: productNombre || '',
        talla: normalizedTalla,
        color: normalizedColor,
        variant_id: normalizedVariantId,
        notified: false,
        notified_at: null,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error stock alert:', err.message);
      return res.status(500).json({ error: 'No se pudo registrar. Intenta de nuevo.' });
    }
  }

  const { nombre, contacto, asunto, mensaje } = req.body;

  if (!nombre?.trim() || !contacto?.trim() || !asunto?.trim() || !mensaje?.trim()) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  const safeNombre = escapeHtml(nombre);
  const safeContacto = escapeHtml(contacto);
  const safeAsunto = escapeHtml(asunto);
  const safeMensaje = escapeHtml(mensaje);
  const contactoEmail = isValidEmail(contacto) ? contacto.trim().toLowerCase() : null;

  try {
    // Email a la duena (notificacion del mensaje)
    await sendTransactionalEmail({
      from: 'PAVOA Contacto <onboarding@resend.dev>',
      to: ['gyeison184@gmail.com'],
      subject: `Nuevo mensaje - ${safeAsunto}`,
      html: `
          <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: #0e0e0e; padding: 32px 40px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 0.3em; margin: 0;">PAVOA</h1>
            </div>

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

            <div style="background: #f5f4f1; padding: 20px 40px; text-align: center;">
              <p style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin: 0;">
                PAVOA - pavoa.vercel.app
              </p>
            </div>
          </div>
        `,
    });

    if (contactoEmail) {
      // Email al cliente (confirmacion)
      await sendTransactionalEmail({
          from: 'PAVOA <onboarding@resend.dev>',
          to: [contactoEmail],
          subject: 'Recibimos tu mensaje - PAVOA',
          html: `
            <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
              <div style="background: #0e0e0e; padding: 32px 40px; text-align: center;">
                <h1 style="color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 0.3em; margin: 0;">PAVOA</h1>
              </div>

              <div style="padding: 48px 40px; text-align: center;">
                <div style="width: 48px; height: 48px; border: 1px solid #0e0e0e; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                  <span style="font-size: 20px;">&#10003;</span>
                </div>
                <h2 style="font-size: 18px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; color: #0e0e0e; margin-bottom: 16px;">
                  Mensaje recibido
                </h2>
                <p style="font-size: 13px; color: #888; line-height: 1.8; max-width: 360px; margin: 0 auto 32px;">
                  Hola <strong style="color: #0e0e0e;">${safeNombre}</strong>, recibimos tu mensaje sobre <em>${safeAsunto}</em>. Te respondemos en un maximo de 24 horas habiles.
                </p>
                <div style="height: 1px; background: #f0f0f0; margin-bottom: 32px;"></div>
                <p style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #888;">
                  Mientras tanto, explora nuestra coleccion
                </p>
                <a href="https://pavoa.vercel.app/categoria"
                  style="display: inline-block; margin-top: 16px; padding: 14px 32px; background: #0e0e0e; color: #ffffff; font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; text-decoration: none;">
                  Ver coleccion
                </a>
              </div>

              <div style="background: #f5f4f1; padding: 20px 40px; text-align: center;">
                <p style="font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin: 0;">
                  PAVOA - pavoa.vercel.app
                </p>
              </div>
            </div>
          `,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error Resend:', err);
    return res.status(500).json({ error: 'Error al enviar el email' });
  }
}
