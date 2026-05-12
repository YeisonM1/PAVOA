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

