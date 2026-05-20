import { createClient } from '@supabase/supabase-js';
import { sendTransactionalEmail } from './_helpers/mail.js';
import { trackFunnelEvent } from './_helpers/funnel.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const EMAIL_FONT_LINK = 'https://fonts.googleapis.com/css2?family=Raleway:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap';
const EMAIL_FONT_PRIMARY = "'Raleway', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const EMAIL_FONT_SECONDARY = "'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const LOGO_URL = `${process.env.VITE_APP_URL || 'https://www.pavoa.com.co'}/logo-pavoa.png`;
const MARK_URL = `${process.env.VITE_APP_URL || 'https://www.pavoa.com.co'}/pavoa-mark.png`;
const EMAIL_COLOR_BG = '#F2E4E1';
const EMAIL_COLOR_IVORY = '#F6F1EA';
const EMAIL_COLOR_GOLD = '#DFCDB4';
const EMAIL_COLOR_GOLD_SOFT = '#EEE5D8';
const EMAIL_COLOR_BORDER = '#E0D8CE';
const EMAIL_COLOR_BLACK = '#0B0B0B';
const EMAIL_COLOR_CHARCOAL = '#3A3A3A';
const EMAIL_COLOR_MUTED = '#8A8175';

const renderEmailDocument = (content) => `
  <!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${EMAIL_FONT_LINK}" rel="stylesheet">
      <title>PAVOA</title>
    </head>
    <body style="margin:0;padding:24px 0;background:${EMAIL_COLOR_BG};font-family:${EMAIL_FONT_PRIMARY};color:${EMAIL_COLOR_BLACK};">
      ${content}
    </body>
  </html>
`;

const renderBrandLockup = () => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="vertical-align:middle;">
        <img src="${LOGO_URL}" alt="PAVOA" width="164" style="display:block;width:164px;max-width:100%;height:auto;">
      </td>
      <td style="padding:0 0 0 8px;vertical-align:middle;">
        <img src="${MARK_URL}" alt="" width="22" style="display:block;width:22px;height:auto;">
      </td>
    </tr>
  </table>
`;

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

const getErrorText = (error) =>
  String(error?.message || error?.details || error?.hint || error || '').trim();

const isMissingColumnError = (error, columns = []) => {
  const text = getErrorText(error).toLowerCase();
  if (!text || !text.includes('column')) return false;

  return columns.some((column) => text.includes(String(column).toLowerCase()));
};

const isPermissionError = (error) => {
  const text = getErrorText(error).toLowerCase();
  return (
    error?.code === '42501' ||
    text.includes('row-level security') ||
    text.includes('permission denied') ||
    text.includes('insufficient_privilege')
  );
};

const buildStockAlertErrorMessage = (error) => {
  if (isPermissionError(error)) {
    return 'Permiso denegado en stock alerts. Revisa la policy de Supabase o configura SUPABASE_SERVICE_ROLE_KEY en Vercel.';
  }

  if (isMissingColumnError(error, ['variant_id', 'notified_at', 'notified', 'product_nombre', 'created_at'])) {
    return 'La tabla stock_alerts en Supabase no coincide con la estructura esperada del backend.';
  }

  return 'No se pudo registrar. Intenta de nuevo.';
};

const buildStockAlertErrorDetail = (error) => {
  const text = getErrorText(error);
  return text || 'Error desconocido en stock alerts.';
};

const isStockAlertUniqueConflict = (error) => {
  const text = getErrorText(error).toLowerCase();
  return (
    error?.code === '23505' &&
    (
      text.includes('stock_alerts_unique_variant_alert') ||
      text.includes('stock_alerts_unique_pending_variant_alert')
    )
  );
};

const findPendingStockAlerts = async ({
  email,
  productId,
  talla,
  color,
  variantId,
  useVariantColumn = true,
}) => {
  let query = supabase
    .from('stock_alerts')
    .select('id')
    .eq('email', email)
    .eq('product_id', productId)
    .eq('notified', false);

  query = applyOptionalFilter(query, 'talla', talla);
  query = applyOptionalFilter(query, 'color', color);

  if (useVariantColumn) {
    query = applyOptionalFilter(query, 'variant_id', variantId);
  }

  const { data, error } = await query.limit(2);
  if (error) throw error;
  return data || [];
};

const insertStockAlert = async ({
  email,
  productId,
  productNombre,
  talla,
  color,
  variantId,
  useVariantColumn = true,
  useNotifiedAtColumn = true,
}) => {
  const payload = {
    email,
    product_id: productId,
    product_nombre: productNombre || '',
    talla,
    color,
    notified: false,
    created_at: new Date().toISOString(),
  };

  if (useVariantColumn) {
    payload.variant_id = variantId;
  }

  if (useNotifiedAtColumn) {
    payload.notified_at = null;
  }

  return supabase.from('stock_alerts').insert(payload);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  if (req.body?.type === 'funnel-event') {
    const {
      eventKey,
      eventType,
      source = 'frontend',
      sessionId,
      userId,
      userEmail,
      productId,
      productName,
      variantId,
      color,
      size,
      orderId,
      paymentId,
      amount,
      meta,
    } = req.body;

    if (!eventType) {
      return res.status(400).json({ error: 'eventType es requerido.' });
    }

    try {
      const ok = await trackFunnelEvent({
        eventKey: normalizeOptional(eventKey),
        eventType: String(eventType).trim(),
        source: normalizeOptional(source) || 'frontend',
        sessionId: normalizeOptional(sessionId),
        userId: normalizeOptional(userId),
        userEmail: normalizeOptional(userEmail)?.toLowerCase() || null,
        productId: normalizeOptional(productId),
        productName: normalizeOptional(productName),
        variantId: normalizeOptional(variantId),
        color: normalizeOptional(color),
        size: normalizeOptional(size),
        orderId: normalizeOptional(orderId),
        paymentId: normalizeOptional(paymentId),
        amount: amount === null || amount === undefined || amount === '' ? null : Number(amount),
        meta: meta && typeof meta === 'object' ? meta : {},
        createdAt: new Date().toISOString(),
      });

      if (!ok) throw new Error('No se pudo registrar el evento.');
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error funnel event:', err.message);
      return res.status(500).json({ error: 'No se pudo registrar el evento.' });
    }
  }

  if (req.body?.type === 'newsletter-subscribe') {
    const normalizedEmail = String(req.body?.email || '').trim().toLowerCase();
    const normalizedSource = normalizeOptional(req.body?.source) || 'storefront_footer';

    if (!normalizedEmail) {
      return res.status(400).json({ error: 'Email requerido.' });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Email invalido.' });
    }

    try {
      const { error } = await supabase.from('newsletter_subscribers').insert({
        email: normalizedEmail,
        source: normalizedSource,
        subscribed_at: new Date().toISOString(),
      });

      if (error?.code === '23505') {
        return res.status(200).json({ ok: true, duplicate: true });
      }

      if (error) throw error;

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error newsletter subscribe:', err.message);
      return res.status(500).json({ error: 'No se pudo registrar. Intenta de nuevo.' });
    }
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
      let supportsVariantColumn = true;

      try {
        const existingAlerts = await findPendingStockAlerts({
          email: normalizedEmail,
          productId,
          talla: normalizedTalla,
          color: normalizedColor,
          variantId: normalizedVariantId,
          useVariantColumn: true,
        });

        if (existingAlerts.length > 0) {
          return res.status(200).json({ ok: true, duplicate: true });
        }

        // Compatibilidad con alertas viejas creadas antes de guardar variant_id.
        if (normalizedVariantId !== null) {
          const legacyAlerts = await findPendingStockAlerts({
            email: normalizedEmail,
            productId,
            talla: normalizedTalla,
            color: normalizedColor,
            variantId: null,
            useVariantColumn: false,
          });

          if (legacyAlerts.length > 0) {
            return res.status(200).json({ ok: true, duplicate: true });
          }
        }
      } catch (queryError) {
        if (!isMissingColumnError(queryError, ['variant_id'])) throw queryError;
        supportsVariantColumn = false;
        console.warn('Stock alerts: tabla legacy sin variant_id. Se usa compatibilidad.');

        const legacyAlerts = await findPendingStockAlerts({
          email: normalizedEmail,
          productId,
          talla: normalizedTalla,
          color: normalizedColor,
          variantId: null,
          useVariantColumn: false,
        });

        if (legacyAlerts.length > 0) {
          return res.status(200).json({ ok: true, duplicate: true });
        }
      }

      let { error } = await insertStockAlert({
        email: normalizedEmail,
        productId,
        productNombre,
        talla: normalizedTalla,
        color: normalizedColor,
        variantId: normalizedVariantId,
        useVariantColumn: supportsVariantColumn,
        useNotifiedAtColumn: true,
      });

      if (error && isMissingColumnError(error, ['notified_at'])) {
        console.warn('Stock alerts: tabla legacy sin notified_at. Se reintenta sin esa columna.');
        ({ error } = await insertStockAlert({
          email: normalizedEmail,
          productId,
          productNombre,
          talla: normalizedTalla,
          color: normalizedColor,
          variantId: normalizedVariantId,
          useVariantColumn: supportsVariantColumn,
          useNotifiedAtColumn: false,
        }));
      }

      if (error && isStockAlertUniqueConflict(error)) {
        return res.status(200).json({ ok: true, duplicate: true });
      }

      if (error) throw error;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error('Error stock alert:', {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
      });
      return res.status(500).json({
        error: buildStockAlertErrorMessage(err),
        detail: buildStockAlertErrorDetail(err),
      });
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
      html: renderEmailDocument(`
          <div style="font-family:${EMAIL_FONT_PRIMARY};max-width:620px;margin:0 auto;background:${EMAIL_COLOR_IVORY};border:1px solid ${EMAIL_COLOR_BORDER};padding:10px;">
            <div style="border:1px solid ${EMAIL_COLOR_BORDER};background:#ffffff;">
            <div style="background:${EMAIL_COLOR_IVORY};padding:30px 40px 26px;text-align:center;border-bottom:1px solid ${EMAIL_COLOR_BORDER};">
              ${renderBrandLockup()}
            </div>

            <div style="padding:36px 40px 10px;background:${EMAIL_COLOR_BG};">
              <p style="font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};margin:0 0 14px;font-family:${EMAIL_FONT_SECONDARY};">
                Nuevo mensaje de contacto
              </p>
              <h2 style="margin:0 0 16px;font-size:28px;line-height:1.2;font-weight:600;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">Te escribieron desde la tienda</h2>
              <div style="width:36px;height:1px;background:${EMAIL_COLOR_BORDER};margin:0 0 22px;"></div>
              <p style="margin:0;font-size:14px;line-height:1.8;color:${EMAIL_COLOR_CHARCOAL};font-family:${EMAIL_FONT_PRIMARY};">
                Recibiste un nuevo mensaje desde el formulario de contacto de PAVOA.
              </p>
            </div>

            <div style="padding:28px 40px 0;">
              <table style="width:100%;border-collapse:collapse;border:1px solid ${EMAIL_COLOR_BORDER};background:${EMAIL_COLOR_IVORY};border-radius:16px;">
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};width:30%;font-family:${EMAIL_FONT_SECONDARY};">Nombre</td>
                  <td style="padding:16px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:13px;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">${safeNombre}</td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_SECONDARY};">Contacto</td>
                  <td style="padding:16px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:13px;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">${safeContacto}</td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_SECONDARY};">Asunto</td>
                  <td style="padding:16px 18px;border-bottom:1px solid ${EMAIL_COLOR_BORDER};font-size:13px;color:${EMAIL_COLOR_BLACK};font-family:${EMAIL_FONT_PRIMARY};">${safeAsunto}</td>
                </tr>
                <tr>
                  <td style="padding:16px 18px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};vertical-align:top;font-family:${EMAIL_FONT_SECONDARY};">Mensaje</td>
                  <td style="padding:16px 18px;font-size:13px;color:${EMAIL_COLOR_BLACK};line-height:1.7;font-family:${EMAIL_FONT_PRIMARY};">${safeMensaje}</td>
                </tr>
              </table>
            </div>

            <div style="padding:32px 40px 40px;">
              <div style="border-top:1px solid ${EMAIL_COLOR_BORDER};padding-top:24px;text-align:center;">
              <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};margin:0;font-family:${EMAIL_FONT_SECONDARY};">
                PAVOA - www.pavoa.com.co
              </p>
              </div>
            </div>
            </div>
          </div>
        `),
    });

    if (contactoEmail) {
      // Email al cliente (confirmacion)
      await sendTransactionalEmail({
          from: 'PAVOA <onboarding@resend.dev>',
          to: [contactoEmail],
          subject: 'Recibimos tu mensaje - PAVOA',
          html: renderEmailDocument(`
            <div style="font-family:${EMAIL_FONT_PRIMARY};max-width:620px;margin:0 auto;background:${EMAIL_COLOR_IVORY};border:1px solid ${EMAIL_COLOR_BORDER};padding:10px;">
              <div style="border:1px solid ${EMAIL_COLOR_BORDER};background:#ffffff;">
              <div style="background:${EMAIL_COLOR_IVORY};padding:30px 40px 26px;text-align:center;border-bottom:1px solid ${EMAIL_COLOR_BORDER};">
                ${renderBrandLockup()}
              </div>

              <div style="padding:40px;background:${EMAIL_COLOR_BG};text-align:center;">
                <div style="width:52px;height:52px;border:1px solid ${EMAIL_COLOR_BLACK};background:${EMAIL_COLOR_IVORY};display:flex;align-items:center;justify-content:center;margin:0 auto 24px;">
                  <span style="font-size: 20px;">&#10003;</span>
                </div>
                <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.25em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_SECONDARY};">
                  Confirmacion de contacto
                </p>
                <h2 style="font-size:26px;font-weight:600;letter-spacing:0.04em;color:${EMAIL_COLOR_BLACK};margin:0 0 16px;font-family:${EMAIL_FONT_PRIMARY};">
                  Mensaje recibido
                </h2>
                <div style="width:36px;height:1px;background:${EMAIL_COLOR_BORDER};margin:0 auto 22px;"></div>
                <p style="font-size:14px;color:${EMAIL_COLOR_CHARCOAL};line-height:1.8;max-width:380px;margin:0 auto 32px;font-family:${EMAIL_FONT_PRIMARY};">
                  Hola <strong style="color:${EMAIL_COLOR_BLACK};">${safeNombre}</strong>, recibimos tu mensaje sobre <em>${safeAsunto}</em>. Te respondemos en un máximo de 24 horas hábiles.
                </p>
                <div style="height:1px;background:${EMAIL_COLOR_BORDER};margin:0 auto 28px;max-width:420px;"></div>
                <p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};font-family:${EMAIL_FONT_SECONDARY};">
                  Mientras tanto, explora nuestra colección
                </p>
                <a href="https://www.pavoa.com.co/categoria"
                  style="display:inline-block;min-width:232px;margin-top:16px;padding:17px 34px;background:${EMAIL_COLOR_BLACK};color:#ffffff;font-size:10px;font-weight:700;letter-spacing:0.28em;text-transform:uppercase;text-align:center;text-decoration:none;border-radius:3px;font-family:${EMAIL_FONT_SECONDARY};border:1px solid ${EMAIL_COLOR_BLACK};">
                  Ver colección
                </a>
              </div>

              <div style="padding:0 40px 40px;">
                <div style="border-top:1px solid ${EMAIL_COLOR_BORDER};padding-top:24px;text-align:center;">
                  <p style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${EMAIL_COLOR_MUTED};margin:0;font-family:${EMAIL_FONT_SECONDARY};">
                    PAVOA - www.pavoa.com.co
                  </p>
                </div>
              </div>
              </div>
            </div>
          `),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error Resend:', err);
    return res.status(500).json({ error: 'Error al enviar el email' });
  }
}

