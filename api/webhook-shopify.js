import crypto from 'crypto';

const SHOPIFY_DOMAIN      = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_SECRET      = process.env.SHOPIFY_WEBHOOK_SECRET;

/**
 * Valida la firma HMAC-SHA256 que Shopify envía en el header X-Shopify-Hmac-Sha256.
 * La firma se calcula sobre el raw body con el webhook secret del app.
 */
const validarFirma = (rawBody, hmacHeader) => {
  if (!SHOPIFY_SECRET) return true; // Sin secret, skip en dev local
  const hmac = crypto
    .createHmac('sha256', SHOPIFY_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(hmacHeader || ''));
  } catch {
    return false;
  }
};

/**
 * Dado un refund de Shopify, reabastece cada line item que tenga
 * restock_type === 'return' o 'cancel' (los que deben volver al inventario).
 * Shopify ya debería hacerlo si el webhook viene de un refund con restock:true,
 * pero este handler lo garantiza explícitamente vía Inventory API.
 */
const restockRefund = async (orderId, refund) => {
  const itemsParaRestock = (refund.refund_line_items || []).filter(
    rli => rli.restock_type === 'return' || rli.restock_type === 'cancel'
  );

  if (itemsParaRestock.length === 0) {
    console.log(`ℹ️ Refund ${refund.id} — sin items para restockear`);
    return;
  }

  for (const rli of itemsParaRestock) {
    const variantId  = rli.line_item?.variant_id;
    const cantidad   = rli.quantity;
    const locationId = rli.location_id;

    if (!variantId || !cantidad) continue;

    // Obtener inventory_item_id desde la variante
    const resVariant = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/variants/${variantId}.json`,
      { headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN } }
    );
    if (!resVariant.ok) {
      console.error(`⚠️ No se pudo obtener variante ${variantId}`);
      continue;
    }
    const { variant } = await resVariant.json();
    const inventoryItemId = variant.inventory_item_id;

    // Ajustar inventario
    const resAdj = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/inventory_adjustments.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type':           'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
        },
        body: JSON.stringify({
          inventory_item_id:   inventoryItemId,
          location_id:         locationId || await getPrimaryLocationId(),
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

const getPrimaryLocationId = async () => {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/locations.json`,
    { headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN } }
  );
  const { locations } = await res.json();
  return locations?.[0]?.id;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const topic    = req.headers['x-shopify-topic']     || '';
  const hmac     = req.headers['x-shopify-hmac-sha256'] || '';
  const rawBody  = JSON.stringify(req.body);

  if (!validarFirma(rawBody, hmac)) {
    console.warn('⚠️ Webhook Shopify: firma inválida');
    return res.status(401).send('Unauthorized');
  }

  if (topic !== 'refunds/create') {
    return res.status(200).send('OK');
  }

  const refund  = req.body;
  const orderId = refund.order_id;

  console.log(`📩 Refund recibido | orden: ${orderId} | refund: ${refund.id}`);

  try {
    await restockRefund(orderId, refund);
  } catch (err) {
    console.error('❌ Error procesando restock:', err.message);
  }

  return res.status(200).send('OK');
}
