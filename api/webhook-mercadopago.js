import crypto from 'crypto';
import { processMercadoPagoPayment } from './_helpers/mercadopago-order.js';

const getQueryValue = (value) => {
  if (Array.isArray(value)) return value[0] || '';
  return value || '';
};

export const extractNotification = (req) => {
  const bodyType = String(req.body?.type || '').trim();
  const bodyDataId = String(req.body?.data?.id || '').trim();
  const queryType = String(
    getQueryValue(req.query?.type) ||
    getQueryValue(req.query?.topic)
  ).trim();
  const queryDataId = String(
    getQueryValue(req.query?.['data.id']) ||
    getQueryValue(req.query?.id) ||
    getQueryValue(req.query?.['data[id]'])
  ).trim();

  if (bodyType && bodyDataId) {
    return { source: 'webhook', type: bodyType, dataId: bodyDataId };
  }

  if (queryType && queryDataId) {
    return { source: 'ipn', type: queryType, dataId: queryDataId };
  }

  return { source: 'unknown', type: bodyType || queryType, dataId: bodyDataId || queryDataId };
};

/**
 * La firma debe cubrir exactamente el `data.id` que se va a procesar. Antes se
 * derivaba aquí con una precedencia propia (body sobre query) distinta a la de
 * `extractNotification`, así que body y query podían discrepar y terminábamos
 * validando un pago y procesando otro.
 */
export const validarFirmaWebhook = (req, dataId) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;
  if (!dataId) return false;

  const xSignature = req.headers['x-signature'] || '';
  const xRequestId = req.headers['x-request-id'] || '';
  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;

  const plantilla = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac = crypto.createHmac('sha256', secret).update(plantilla).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
  } catch {
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const notification = extractNotification(req);
  if (!process.env.MP_WEBHOOK_SECRET) {
    console.error('Webhook MP rechazado: MP_WEBHOOK_SECRET no configurado');
    return res.status(503).send('Webhook not configured');
  }
  if (!validarFirmaWebhook(req, notification.dataId)) {
    console.warn('Webhook MP: firma invalida, request descartado');
    return res.status(401).send('Invalid signature');
  }

  if (notification.type !== 'payment' || !notification.dataId) {
    return res.status(200).send('OK');
  }

  try {
    const result = await processMercadoPagoPayment(notification.dataId);
    console.log(
      `Webhook MP procesado | source: ${notification.source} | payment: ${notification.dataId} | status: ${result.status || 'unknown'} | draft: ${result.draftOrderId || 'n/a'}`
    );
  } catch (error) {
    // Responder 200 aquí daba la notificación por entregada y Mercado Pago no
    // reintentaba: un pago cobrado podía quedarse sin orden en Shopify si
    // Supabase estaba caído. Con 5xx, Mercado Pago reintenta.
    console.error('Error en webhook Mercado Pago:', error.message);
    return res.status(500).send('Processing failed');
  }

  return res.status(200).send('OK');
}
