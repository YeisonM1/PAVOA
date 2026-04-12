import mercadopago from 'mercadopago';
import crypto from 'crypto';

const client = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;

const getShopifyToken = () => {
  const token = process.env.SHOPIFY_ADMIN_TOKEN;
  if (!token) throw new Error('SHOPIFY_ADMIN_TOKEN no configurado');
  return token;
};

/**
 * Valida la firma X-Signature que Mercado Pago envía en cada webhook.
 * Formato del header: ts=TIMESTAMP,v1=HMAC_HEX
 * Plantilla firmada: id:{data.id};request-id:{x-request-id};ts:{ts};
 */
const validarFirma = (req) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Sin secret configurado, skip (solo en dev local)

  const xSignature = req.headers['x-signature'] || '';
  const xRequestId = req.headers['x-request-id'] || '';

  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1];

  if (!ts || !v1) return false;

  const dataId   = req.body?.data?.id ?? '';
  const plantilla = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac     = crypto.createHmac('sha256', secret).update(plantilla).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
  } catch {
    return false;
  }
};

const completarDraftOrder = async (draftOrderId) => {
  const shopifyToken = getShopifyToken();
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}/complete.json?payment_pending=false`,
    {
      method: 'PUT',
      headers: {
        'Content-Type':           'application/json',
        'X-Shopify-Access-Token': shopifyToken,
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shopify ${res.status}: ${err}`);
  }

  return await res.json();
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  // Mercado Pago requiere respuesta 200 para no reintentar.
  // Validamos la firma ANTES de procesar, pero siempre retornamos 200.
  if (!validarFirma(req)) {
    console.warn('⚠️ Webhook: firma inválida — procesando igual (pago verificado vía API)');
  }

  const { type, data } = req.body;

  if (type !== 'payment' || !data?.id) {
    return res.status(200).send('OK');
  }

  try {
    const paymentClient = new mercadopago.Payment(client);
    const pagoInfo      = await paymentClient.get({ id: data.id });

    const draftOrderId = pagoInfo.external_reference;

    if (!draftOrderId) {
      console.warn('⚠️ Webhook: pago sin external_reference', data.id);
      return res.status(200).send('OK');
    }

    console.log(`📩 Webhook | pago: ${data.id} | estado: ${pagoInfo.status} | draft: ${draftOrderId}`);

    if (pagoInfo.status === 'approved') {
      await completarDraftOrder(draftOrderId);
      console.log(`✅ Orden completada en Shopify: ${draftOrderId}`);

    } else if (pagoInfo.status === 'rejected' || pagoInfo.status === 'cancelled') {
      // El draft order queda abierto; el admin puede limpiarlo manualmente.
      console.log(`❌ Pago ${pagoInfo.status} | ID: ${data.id} | Draft: ${draftOrderId}`);

    } else {
      // 'pending', 'in_process', 'authorized' — MP enviará otra notificación cuando cambie.
      console.log(`⏳ Pago ${pagoInfo.status} | ID: ${data.id} | Draft: ${draftOrderId}`);
    }

  } catch (error) {
    // Logueamos el error pero nunca relanzamos — siempre retornamos 200 a MP.
    console.error('❌ Error en webhook:', error.message);
  }

  return res.status(200).send('OK');
}
