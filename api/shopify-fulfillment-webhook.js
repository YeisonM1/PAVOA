import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const verificarFirmaShopify = (req) => {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return true;
  const hmac      = req.headers['x-shopify-hmac-sha256'];
  const rawBody   = JSON.stringify(req.body);
  const generado  = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(generado), Buffer.from(hmac));
  } catch {
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  if (!verificarFirmaShopify(req)) {
    console.warn('⚠️ Shopify webhook: firma inválida');
    return res.status(401).send('Unauthorized');
  }

  const topic = req.headers['x-shopify-topic'] || '';
  const order = req.body;

  if (!order?.id) return res.status(200).send('OK');

  const shopifyOrderId   = String(order.id);
  const fulfillmentStatus = order.fulfillment_status || 'unfulfilled';

  console.log(`📦 Shopify webhook [${topic}] | order: ${shopifyOrderId} | fulfillment: ${fulfillmentStatus}`);

  const { error } = await supabase
    .from('pedidos')
    .update({ fulfillment_status: fulfillmentStatus })
    .eq('shopify_order_id', shopifyOrderId);

  if (error) {
    console.error('⚠️ Error actualizando fulfillment en Supabase:', error.message);
  } else {
    console.log(`✅ Fulfillment actualizado: ${shopifyOrderId} → ${fulfillmentStatus}`);
  }

  return res.status(200).send('OK');
}
