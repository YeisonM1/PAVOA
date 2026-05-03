import crypto from 'crypto';
import { processMercadoPagoPayment } from './_helpers/mercadopago-order.js';

const validarFirma = (req) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;

  const xSignature = req.headers['x-signature'] || '';
  const xRequestId = req.headers['x-request-id'] || '';
  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;

  const dataId = req.body?.data?.id ?? '';
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

  if (!validarFirma(req)) {
    console.warn('Webhook: firma invalida, request descartado');
    return res.status(200).send('OK');
  }

  const { type, data } = req.body;
  if (type !== 'payment' || !data?.id) {
    return res.status(200).send('OK');
  }

  try {
    const result = await processMercadoPagoPayment(data.id);
    console.log(
      `Webhook MP procesado | payment: ${data.id} | status: ${result.status || 'unknown'} | draft: ${result.draftOrderId || 'n/a'}`
    );
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error.message);
  }

  return res.status(200).send('OK');
}
