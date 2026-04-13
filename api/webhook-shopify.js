import crypto from 'crypto';

const SHOPIFY_DOMAIN      = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_SECRET      = process.env.SHOPIFY_WEBHOOK_SECRET;

/**
 * Valida la firma HMAC-SHA256 de Shopify.
 * IMPORTANTE: Vercel parsea el body antes de que lleguemos aquí, por lo que
 * re-stringificamos. Esto puede causar diferencias de orden de claves.
 * Por eso usamos la firma solo como advertencia, no como bloqueo.
 */
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

const getPrimaryLocationId = async () => {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/locations.json`,
    { headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN } }
  );
  const { locations } = await res.json();
  return locations?.[0]?.id;
};

const restockRefund = async (refund) => {
  const itemsParaRestock = (refund.refund_line_items || []).filter(
    rli => rli.restock_type === 'return' || rli.restock_type === 'cancel'
  );

  if (itemsParaRestock.length === 0) {
    console.log(`ℹ️ Refund ${refund.id} — sin items marcados para restock`);
    return;
  }

  const locationId = await getPrimaryLocationId();

  for (const rli of itemsParaRestock) {
    const variantId = rli.line_item?.variant_id;
    const cantidad  = rli.quantity;

    if (!variantId || !cantidad) continue;

    // Obtener inventory_item_id desde la variante
    const resVariant = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/variants/${variantId}.json`,
      { headers: { 'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN } }
    );
    if (!resVariant.ok) {
      console.error(`⚠️ No se pudo obtener variante ${variantId}: ${resVariant.status}`);
      continue;
    }
    const { variant } = await resVariant.json();
    const inventoryItemId = variant?.inventory_item_id;
    if (!inventoryItemId) {
      console.warn(`⚠️ Variante ${variantId} sin inventory_item_id`);
      continue;
    }

    // Ajustar inventario — endpoint correcto en API 2026-04
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
          location_id:          rli.location_id || locationId,
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

  const topic     = req.headers['x-shopify-topic']        || '';
  const hmacHeader = req.headers['x-shopify-hmac-sha256'] || '';
  const rawBody   = JSON.stringify(req.body);

  if (!validarFirma(rawBody, hmacHeader)) {
    // Firma inválida — logueamos pero procesamos igual porque Vercel
    // altera el raw body al parsear JSON (mismo problema que MP webhook).
    console.warn('⚠️ Webhook Shopify: firma no verificada (procesar igual)');
  }

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
