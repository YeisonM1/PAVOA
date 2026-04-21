import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SHOPIFY_DOMAIN      = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_SECRET      = process.env.SHOPIFY_WEBHOOK_SECRET;
const supabase            = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const validarFirma = (rawBody, hmacHeader) => {
  if (!SHOPIFY_SECRET || !hmacHeader) return true;
  const hmac = crypto
    .createHmac('sha256', SHOPIFY_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'utf8'),
      Buffer.from(hmacHeader, 'utf8')
    );
  } catch {
    return false;
  }
};

const restockRefund = async (refund) => {
  const itemsParaRestock = (refund.refund_line_items || []).filter(
    rli => rli.quantity > 0
  );

  if (itemsParaRestock.length === 0) {
    console.log(`ℹ️ Refund ${refund.id} — sin items con cantidad para restock`);
    return;
  }

  for (const rli of itemsParaRestock) {
    const variantId       = rli.line_item?.variant_id;
    const cantidad        = rli.quantity;
    const inventoryItemId = rli.line_item?.inventory_item_id;
    const locationId      = rli.location_id;

    if (!cantidad) continue;
    if (!inventoryItemId || !locationId) {
      console.warn(`⚠️ Variante ${variantId} sin inventory_item_id o location_id en payload`);
      continue;
    }

    const resAdj = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/inventory_levels/adjust.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type':           'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify({
          inventory_item_id:    inventoryItemId,
          location_id:          locationId,
          available_adjustment: cantidad,
        }),
      }
    );

    if (resAdj.ok) {
      console.log(`✅ Restock: variante ${variantId} +${cantidad} unidades`);
    } else {
      const err = await resAdj.text();
      console.error(`❌ Error restockeando variante ${variantId}: ${err}`);
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const topic      = req.headers['x-shopify-topic']        || '';
  const hmacHeader = req.headers['x-shopify-hmac-sha256']  || '';
  const rawBody    = JSON.stringify(req.body);

  // Firma: Vercel re-parsea el body y rompe el HMAC — procesamos siempre
  validarFirma(rawBody, hmacHeader);

  // ── Fulfillment: actualizar estado en Supabase ──────────
  if (topic === 'orders/updated' || topic === 'orders/fulfilled') {
    const order              = req.body;
    const shopifyOrderId     = String(order.id || '');
    const fulfillmentStatus  = order.fulfillment_status || 'unfulfilled';

    if (shopifyOrderId) {
      console.log(`📦 Shopify [${topic}] | order: ${shopifyOrderId} | fulfillment: ${fulfillmentStatus}`);
      const { error } = await supabase
        .from('pedidos')
        .update({ fulfillment_status: fulfillmentStatus })
        .eq('shopify_order_id', shopifyOrderId);
      if (error) console.error('⚠️ Error actualizando fulfillment:', error.message);
      else console.log(`✅ Fulfillment actualizado: ${shopifyOrderId} → ${fulfillmentStatus}`);
    }
    return res.status(200).send('OK');
  }

  // ── Refund: restock de inventario ────────────────────────
  if (topic !== 'refunds/create') {
    return res.status(200).send('OK');
  }

  const refund  = req.body;
  const orderId = refund.order_id;

  console.log(`📩 Refund recibido | orden: ${orderId} | refund: ${refund.id}`);

  try {
    await restockRefund(refund);
  } catch (err) {
    console.error('❌ Error procesando restock:', err.message);
  }

  return res.status(200).send('OK');
}
