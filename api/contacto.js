import { createClient } from '@supabase/supabase-js';
import { sendTransactionalEmail } from './_helpers/mail.js';
import { trackFunnelEvent } from './_helpers/funnel.js';
import {
  emailConfirmacion,
  emailDespacho,
  emailEntregado,
  emailPedidoCancelado,
  emailVerificacion,
  emailResetPassword,
  emailContactoCliente,
  emailContactoInterno,
} from './_helpers/email-templates.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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

  if (req.body?.type === 'preview-email') {
    const secret = process.env.PREVIEW_EMAIL_SECRET;
    if (secret && req.headers['x-preview-secret'] !== secret) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const emailType = String(req.body?.emailType || '').trim();
    const dest = String(req.body?.dest || '').trim().toLowerCase();

    if (!emailType || !dest || !isValidEmail(dest)) {
      return res.status(400).json({ error: 'emailType y dest valido son requeridos.' });
    }

    const appUrl = String(process.env.VITE_APP_URL || 'https://www.pavoa.com.co').replace(/\/$/, '');
    const mockOrderName = '#PAVOA-1042';
    const mockFirstName = 'Yeison';

    const SUBJECTS = {
      confirmacion: '[Preview] Confirmación de pedido',
      despacho: '[Preview] Pedido en camino',
      entregado: '[Preview] Pedido entregado',
      cancelado: '[Preview] Pedido cancelado',
      verificacion: '[Preview] Verificación de cuenta',
      'reset-password': '[Preview] Reset de contraseña',
      'contacto-cliente': '[Preview] Confirmación de contacto',
      'contacto-interno': '[Preview] Notificación interna de contacto',
    };

    const buildPreviewHtml = (type) => {
      switch (type) {
        case 'confirmacion':
          return emailConfirmacion({
            firstName: mockFirstName,
            orderName: mockOrderName,
            paymentId: 'MP-123456789',
            lineItems: [
              { title: 'Vestido Siena', variant_title: 'Negro / S', quantity: '1', price: '189900' },
              { title: 'Blusa Alma', variant_title: 'Marfil / M', quantity: '2', price: '124900' },
            ],
            total: '439700',
            totalOriginal: '499700',
            descuentoAplicado: true,
            direccion: 'Calle 10 # 43-25, Apto 302, Medellín, Antioquia',
          });
        case 'despacho':
          return emailDespacho({
            nombreCliente: mockFirstName,
            orderName: mockOrderName,
            subtitulo: 'Actualización de envío',
            cuerpo: 'Tu pedido ya salió de nuestras instalaciones y está en camino. Puedes rastrearlo con la guía a continuación.',
            trackingCompany: 'Coordinadora',
            trackingNumber: 'CRD-9876543210',
            trackingUrl: 'https://coordinadora.com/rastreo?guia=CRD-9876543210',
          });
        case 'entregado':
          return emailEntregado({ nombreCliente: mockFirstName, orderName: mockOrderName });
        case 'cancelado':
          return emailPedidoCancelado({
            nombreCliente: mockFirstName,
            orderName: mockOrderName,
            lineItems: [{ title: 'Vestido Siena', variant_title: 'Negro / S', quantity: '1', price: '189900' }],
            total: '189900',
            cancelReason: 'Solicitud del cliente',
            refundStatus: 'refunded',
          });
        case 'verificacion':
          return emailVerificacion({
            firstName: mockFirstName,
            verifyLink: `${appUrl}/verify?token=PREVIEW_TOKEN_DEMO`,
          });
        case 'reset-password':
          return emailResetPassword({
            firstName: mockFirstName,
            resetLink: `${appUrl}/reset-password?token=PREVIEW_TOKEN_DEMO`,
          });
        case 'contacto-cliente':
          return emailContactoCliente({ nombre: mockFirstName, asunto: 'Consulta sobre disponibilidad' });
        case 'contacto-interno':
          return emailContactoInterno({
            nombre: 'Valentina Rios',
            contacto: 'valentina@ejemplo.com',
            asunto: 'Quiero saber si tienen talla S',
            mensaje: 'Hola, me interesa el Vestido Siena en talla S color negro. Esta disponible para la proxima semana?',
          });
        default:
          return null;
      }
    };

    const subject = SUBJECTS[emailType];
    const html = buildPreviewHtml(emailType);

    if (!subject || !html) {
      return res.status(400).json({ error: `Tipo de correo desconocido: ${emailType}` });
    }

    try {
      await sendTransactionalEmail({
        from: 'PAVOA <onboarding@resend.dev>',
        to: [dest],
        subject,
        html,
      });
      return res.status(200).json({ ok: true, emailType, dest });
    } catch (err) {
      console.error('Error preview email:', err.message);
      return res.status(500).json({ error: err.message || 'No se pudo enviar el correo de prueba.' });
    }
  }

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

  const cleanNombre = String(nombre || '').trim();
  const cleanContacto = String(contacto || '').trim();
  const cleanAsunto = String(asunto || '').trim();
  const cleanMensaje = String(mensaje || '').trim();
  const contactoEmail = isValidEmail(contacto) ? contacto.trim().toLowerCase() : null;

  try {
    await sendTransactionalEmail({
      from: 'PAVOA Contacto <onboarding@resend.dev>',
      to: ['gyeison184@gmail.com'],
      subject: `Nuevo mensaje - ${cleanAsunto}`,
      html: emailContactoInterno({
        nombre: cleanNombre,
        contacto: cleanContacto,
        asunto: cleanAsunto,
        mensaje: cleanMensaje,
      }),
    });

    if (contactoEmail) {
      await sendTransactionalEmail({
        from: 'PAVOA <onboarding@resend.dev>',
        to: [contactoEmail],
        subject: 'Recibimos tu mensaje - PAVOA',
        html: emailContactoCliente({
          nombre: cleanNombre,
          asunto: cleanAsunto,
        }),
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error Resend:', err);
    return res.status(500).json({ error: 'Error al enviar el email' });
  }
}
