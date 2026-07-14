import crypto from 'crypto';
import { emailDespacho, emailEntregado, emailPedidoCancelado } from './_helpers/email-templates.js';
import { getShopifyToken } from './_helpers/shopify-token.js';
import { sendTransactionalEmail } from './_helpers/mail.js';
import { supabase, getSupabaseMode } from './_helpers/supabase.js';

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const SHOPIFY_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;
const MAX_WEBHOOK_BYTES = 1024 * 1024;

export const config = {
  api: {
    bodyParser: false,
  },
};

// Deduplicación en memoria: evita emails dobles cuando Shopify dispara
// orders/fulfilled + orders/updated para la misma acción de fulfillment.
// Funciona porque ambas llamadas llegan con milisegundos de diferencia y
// casi siempre tocan la misma instancia de Vercel.
const _despachoCache = new Map();
const DESPACHO_TTL = 90 * 1000;

function isDespachoDuplicado(shopifyOrderId, trackingNumber) {
  const key = `${shopifyOrderId}:${trackingNumber}`;
  const now = Date.now();
  const lastTs = _despachoCache.get(key);
  if (lastTs && now - lastTs < DESPACHO_TTL) return true;
  _despachoCache.set(key, now);
  if (_despachoCache.size > 200) {
    for (const [k, ts] of _despachoCache) {
      if (now - ts > DESPACHO_TTL * 2) _despachoCache.delete(k);
    }
  }
  return false;
}

const TRANSPORTADORAS = [
  { nombre: 'Servientrega',    dominios: ['servientrega.com.co', 'servientrega.com'],     claves: ['servientrega']                       },
  { nombre: 'Coordinadora',    dominios: ['coordinadora.com'],                             claves: ['coordinadora']                       },
  { nombre: 'Interrapidísimo', dominios: ['interrapidisimo.com'],                          claves: ['interrapidisimo', 'interrapidísimo'] },
  { nombre: 'TCC',             dominios: ['tcc.com.co', 'tcc.com'],                        claves: ['tcc']                                },
];

const normalizarTransportadora = (rawCompany, rawUrl) => {
  const texto = (rawCompany || '').toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // 1. Intentar por nombre (cuando la empresa no es "Other"/"Otro")
  let encontrada = TRANSPORTADORAS.find(t => t.claves.some(c => texto.includes(c)));

  // 2. Si no se encontró (ej: "Other"), detectar por dominio de la URL
  if (!encontrada && rawUrl) {
    try {
      const dominio = new URL(rawUrl).hostname.replace(/^www\./, '');
      encontrada = TRANSPORTADORAS.find(t => t.dominios.some(d => dominio.includes(d)));
    } catch { /* URL inválida — ignorar */ }
  }

  return {
    nombre: encontrada?.nombre || rawCompany || null,
    url:    rawUrl || null,
  };
};

export const validarFirma = (rawBody, hmacHeader) => {
  if (!SHOPIFY_SECRET || !hmacHeader) return false;
  const hmac = crypto
    .createHmac('sha256', SHOPIFY_SECRET)
    .update(rawBody)
    .digest();
  try {
    return crypto.timingSafeEqual(
      hmac,
      Buffer.from(hmacHeader, 'base64')
    );
  } catch {
    return false;
  }
};

const readRawBody = async (req) => {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_WEBHOOK_BYTES) throw new Error('Webhook demasiado grande');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
};

const restockRefund = async (refund) => {
  const itemsParaRestock = (refund.refund_line_items || []).filter(
    rli => rli.quantity > 0
  );

  if (itemsParaRestock.length === 0) {
    console.log(`ℹ️ Refund ${refund.id} — sin items con cantidad para restock`);
    return;
  }

  const token = await getShopifyToken();

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
          'X-Shopify-Access-Token': token,
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

const formatMoney = (value) => Number(value || 0).toLocaleString('es-CO');

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const toNumber = (value) => {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
};

const getRefundAmount = (refund) =>
  (refund?.transactions || []).reduce((sum, transaction) => {
    const kind = String(transaction?.kind || '').toLowerCase();
    const status = String(transaction?.status || '').toLowerCase();
    if (kind !== 'refund' || (status && status !== 'success')) return sum;
    return sum + toNumber(transaction?.amount);
  }, 0);

const maybeReactivateWelcomeDiscount = async ({ email, shopifyOrderId, reason }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const { data: pedidos, error } = await supabase
    .from('pedidos')
    .select('shopify_order_id, status, descuento_aplicado')
    .ilike('email', normalizedEmail);

  if (error) {
    console.error(`Error revisando descuento de bienvenida [mode=${getSupabaseMode()}]:`, error.message);
    return;
  }

  const currentOrderId = String(shopifyOrderId || '');
  const currentOrder = (pedidos || []).find((pedido) => String(pedido.shopify_order_id || '') === currentOrderId);
  const usedWelcomeDiscount = currentOrder?.descuento_aplicado === true;
  const hasOtherActiveApprovedOrder = (pedidos || []).some((pedido) => {
    const pedidoOrderId = String(pedido.shopify_order_id || '');
    const status = String(pedido.status || '').trim().toLowerCase();
    return pedidoOrderId !== currentOrderId && status === 'approved';
  });

  if (!usedWelcomeDiscount || hasOtherActiveApprovedOrder) return;

  const { error: updateError } = await supabase
    .from('usuarios')
    .update({ descuento_bienvenida_usado: false })
    .ilike('email', normalizedEmail);

  if (updateError) {
    console.error(`Error reactivando descuento de bienvenida [mode=${getSupabaseMode()}]:`, updateError.message);
    return;
  }

  console.log(`Descuento de bienvenida reactivado para ${normalizedEmail} por ${reason || 'pedido no vigente'}`);
};

const getCustomerEmail = (order, pedido) =>
  pedido?.email ||
  order?.email ||
  order?.contact_email ||
  order?.customer?.email ||
  null;

const getContactEmail = (order, pedido) =>
  order?.email ||
  order?.contact_email ||
  order?.customer?.email ||
  pedido?.email ||
  null;

const getCustomerName = (order, pedido) => {
  const fromPedido = String(pedido?.nombre || '').trim();
  if (fromPedido) return fromPedido;

  const shipping = order?.shipping_address;
  const customer = order?.customer;
  const name = [
    shipping?.first_name || customer?.first_name || '',
    shipping?.last_name || customer?.last_name || '',
  ].filter(Boolean).join(' ').trim();

  return name || 'Cliente';
};

const mapOrderLineItems = (order, pedido) => {
  if (Array.isArray(pedido?.items) && pedido.items.length > 0) {
    return pedido.items.map((item) => ({
      title: item.nombre || item.title || 'Prenda PAVOA',
      quantity: item.cantidad || item.quantity || 1,
      price: item.precio || item.price || 0,
      variant_title: item.talla || item.variant_title || item.color || null,
      imagen: item.imagen || item.image || item.image_url || item.imageUrl || null,
    }));
  }

  return (order?.line_items || []).map((item) => ({
    title: item.title || item.name || 'Prenda PAVOA',
    quantity: item.quantity || 1,
    price: item.price || 0,
    variant_title: item.variant_title || null,
    imagen: item.image_url || item.imagen || item?.image?.src || null,
  }));
};

const getCancelReasonLabel = (reason) => {
  const normalized = String(reason || '').trim().toLowerCase();
  const labels = {
    customer: 'Solicitud del cliente',
    fraud: 'Validación de seguridad',
    inventory: 'Disponibilidad de inventario',
    declined: 'Pago rechazado',
    other: 'Otro motivo',
  };
  return labels[normalized] || normalized || '';
};

const handleOrderCancelled = async (order) => {
  const shopifyOrderId = String(order?.id || '');
  if (!shopifyOrderId) return;

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('email, shopify_order_name, nombre, status, fulfillment_status, total, items, descuento_aplicado')
    .eq('shopify_order_id', shopifyOrderId)
    .maybeSingle();

  if (error) {
    console.error(`Error consultando pedido cancelado [mode=${getSupabaseMode()}]:`, error.message);
  }

  const wasAlreadyCancelled = String(pedido?.status || '').trim().toLowerCase() === 'cancelled';

  const { error: updateError } = await supabase
    .from('pedidos')
    .update({
      status: 'cancelled',
      fulfillment_status: 'cancelled',
      tracking_number: null,
      tracking_company: null,
      tracking_url: null,
    })
    .eq('shopify_order_id', shopifyOrderId);

  if (updateError) {
    console.error(`Error marcando pedido cancelado [mode=${getSupabaseMode()}]:`, updateError.message);
  } else {
    console.log(`Pedido marcado como cancelado: ${shopifyOrderId}`);
  }

  await maybeReactivateWelcomeDiscount({
    email: getCustomerEmail(order, pedido),
    shopifyOrderId,
    reason: 'order_cancelled',
  });

  if (wasAlreadyCancelled) {
    console.log(`Cancelacion ya procesada para pedido: ${shopifyOrderId}`);
    return;
  }

  const email = getContactEmail(order, pedido);
  if (!email) {
    console.warn(`Pedido cancelado sin email disponible: ${shopifyOrderId}`);
    return;
  }

  const orderName = pedido?.shopify_order_name || order?.name || `#${order?.order_number || shopifyOrderId}`;
  const nombreCliente = getCustomerName(order, pedido);
  const total = formatMoney(pedido?.total || order?.total_price || 0);
  const lineItems = mapOrderLineItems(order, pedido);
  const cancelReason = getCancelReasonLabel(order?.cancel_reason);
  const refundStatus = order?.financial_status || '';

  try {
    await sendTransactionalEmail({
      from: 'PAVOA <onboarding@resend.dev>',
      to: email,
      subject: `Tu pedido ${orderName} fue cancelado - PAVOA`,
      html: emailPedidoCancelado({
        nombreCliente,
        orderName,
        lineItems,
        total,
        cancelReason,
        refundStatus,
      }),
    });
    console.log(`Email de cancelacion enviado a: ${email}`);
  } catch (emailErr) {
    console.error('Email de cancelacion no enviado:', emailErr.message);
  }
};

const handleOrderDeleted = async (order) => {
  const shopifyOrderId = String(order?.id || '');
  if (!shopifyOrderId) return;

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('email, status, descuento_aplicado')
    .eq('shopify_order_id', shopifyOrderId)
    .maybeSingle();

  if (error) {
    console.error(`Error consultando pedido eliminado [mode=${getSupabaseMode()}]:`, error.message);
  }

  const { error: updateError } = await supabase
    .from('pedidos')
    .update({
      status: 'cancelled',
      fulfillment_status: 'cancelled',
      tracking_number: null,
      tracking_company: null,
      tracking_url: null,
    })
    .eq('shopify_order_id', shopifyOrderId);

  if (updateError) {
    console.error(`Error marcando pedido eliminado [mode=${getSupabaseMode()}]:`, updateError.message);
  } else {
    console.log(`Pedido eliminado en Shopify marcado como cancelado: ${shopifyOrderId}`);
  }

  await maybeReactivateWelcomeDiscount({
    email: pedido?.email || order?.email || order?.contact_email || order?.customer?.email,
    shopifyOrderId,
    reason: 'order_deleted',
  });
};

const handleRefundCreated = async (refund) => {
  const shopifyOrderId = String(refund?.order_id || '');
  if (!shopifyOrderId) return;

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select('email, total, status, descuento_aplicado')
    .eq('shopify_order_id', shopifyOrderId)
    .maybeSingle();

  if (error) {
    console.error(`Error consultando pedido reembolsado [mode=${getSupabaseMode()}]:`, error.message);
    return;
  }

  if (!pedido) return;

  const refundAmount = getRefundAmount(refund);
  const orderTotal = toNumber(pedido.total);
  const isFullRefund = orderTotal > 0 && refundAmount >= orderTotal - 1;

  if (!isFullRefund) {
    console.log(`Reembolso parcial recibido para ${shopifyOrderId}: ${refundAmount}/${orderTotal}`);
    return;
  }

  const { error: updateError } = await supabase
    .from('pedidos')
    .update({ status: 'refunded' })
    .eq('shopify_order_id', shopifyOrderId);

  if (updateError) {
    console.error(`Error marcando pedido reembolsado [mode=${getSupabaseMode()}]:`, updateError.message);
  } else {
    console.log(`Pedido marcado como reembolsado: ${shopifyOrderId}`);
  }

  await maybeReactivateWelcomeDiscount({
    email: pedido.email,
    shopifyOrderId,
    reason: 'full_refund',
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const topic      = req.headers['x-shopify-topic']        || '';
  const hmacHeader = req.headers['x-shopify-hmac-sha256']  || '';
  if (!SHOPIFY_SECRET) {
    console.error('Webhook Shopify rechazado: SHOPIFY_WEBHOOK_SECRET no configurado');
    return res.status(503).send('Webhook not configured');
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    return res.status(413).send(error.message);
  }

  if (!validarFirma(rawBody, hmacHeader)) {
    console.warn(`Webhook Shopify rechazado por firma invalida: ${topic || 'sin topic'}`);
    return res.status(401).send('Invalid signature');
  }

  try {
    req.body = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  if (topic === 'orders/cancelled') {
    await handleOrderCancelled(req.body);
    return res.status(200).send('OK');
  }

  if (topic === 'orders/delete') {
    await handleOrderDeleted(req.body);
    return res.status(200).send('OK');
  }

  // ── Entregado: tag "entregado" o shipment_status delivered ─
  if (topic === 'orders/updated') {
    const order               = req.body;
    const shopifyOrderId      = String(order.id || '');
    const tags                = (order.tags || '').toLowerCase().split(',').map(t => t.trim());
    const fulfillments        = order.fulfillments || [];
    const hasDeliveredShipment = fulfillments.some(f => String(f.shipment_status || '').toLowerCase() === 'delivered');

    if (shopifyOrderId && (tags.includes('entregado') || hasDeliveredShipment)) {
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('email, shopify_order_name, nombre, fulfillment_status')
        .eq('shopify_order_id', shopifyOrderId)
        .single();

      if (pedido && pedido.fulfillment_status !== 'delivered') {
        await supabase
          .from('pedidos')
          .update({ fulfillment_status: 'delivered' })
          .eq('shopify_order_id', shopifyOrderId);

        console.log(`✅ Pedido marcado como entregado: ${shopifyOrderId}`);

        const deliveryEmail = getContactEmail(order, pedido);
        if (deliveryEmail) {
          const nombreCliente = pedido.nombre || 'Cliente';
          const orderName     = pedido.shopify_order_name || shopifyOrderId;
          try {
            await sendTransactionalEmail({
              from:    'PAVOA <onboarding@resend.dev>',
              to:      deliveryEmail,
              subject: `Tu pedido ${orderName} ha llegado — PAVOA`,
              html:    emailEntregado({ nombreCliente, orderName }),
            });
            console.log(`📧 Email de entrega enviado a: ${deliveryEmail}`);
          } catch (emailErr) {
            console.error('⚠️ Email de entrega no enviado:', emailErr.message);
          }
        }
      }

      // El tag "entregado" ya fue procesado — no continuar al bloque de fulfillment
      return res.status(200).send('OK');
    }
  }

  // ── Fulfillment: actualizar estado en Supabase + email ──
  if (topic === 'orders/updated' || topic === 'orders/fulfilled') {
    const order             = req.body;
    const shopifyOrderId    = String(order.id || '');
    const tags              = (order.tags || '').toLowerCase().split(',').map(t => t.trim());
    const esEntregado       = tags.includes('entregado') || (order.fulfillments || []).some(f => String(f.shipment_status || '').toLowerCase() === 'delivered');
    const fulfillmentStatus = order.fulfillment_status || 'unfulfilled';
    const fulfillment       = (order.fulfillments || []).find(f => f.status !== 'cancelled') || null;
    const trackingNumber    = fulfillment?.tracking_number || null;
    const { nombre: trackingCompany, url: trackingUrl } = normalizarTransportadora(
      fulfillment?.tracking_company,
      fulfillment?.tracking_url,
    );

    if (!shopifyOrderId) return res.status(200).send('OK');

    console.log(`📦 Shopify [${topic}] | order: ${shopifyOrderId} | fulfillment: ${fulfillmentStatus} | guía: ${trackingNumber}`);

    // Leer estado actual del pedido para comparar guía
    const { data: pedidoActual } = await supabase
      .from('pedidos')
      .select('email, shopify_order_name, nombre, status, tracking_number')
      .eq('shopify_order_id', shopifyOrderId)
      .single();

    if (String(pedidoActual?.status || '').trim().toLowerCase() === 'cancelled') {
      console.log(`Pedido cancelado: se ignora update de fulfillment para ${shopifyOrderId}`);
      return res.status(200).send('OK');
    }

    // Si ya está marcado como entregado, no sobreescribir el estado
    if (esEntregado) return res.status(200).send('OK');

    // ── Caso 1: fulfillment cancelado — limpiar guía ────────
    if (fulfillmentStatus === 'unfulfilled' && !trackingNumber) {
      const { error } = await supabase
        .from('pedidos')
        .update({ fulfillment_status: 'unfulfilled', tracking_number: null, tracking_company: null, tracking_url: null })
        .eq('shopify_order_id', shopifyOrderId);
      if (error) console.error(`⚠️ Error limpiando guía [mode=${getSupabaseMode()}]:`, error.message);
      else console.log(`🔄 Fulfillment cancelado — guía limpiada: ${shopifyOrderId}`);
      return res.status(200).send('OK');
    }

    // ── Casos 2 y 3: hay guía — actualizar Supabase ─────────
    if (trackingNumber) {
      // Primera línea de defensa: caché en memoria (cubre el 99 % de los duplicados)
      if (isDespachoDuplicado(shopifyOrderId, trackingNumber)) {
        console.log(`🔄 Despacho duplicado (cache): guía ${trackingNumber} para ${shopifyOrderId}`);
        return res.status(200).send('OK');
      }

      const esCorreccion = !!pedidoActual?.tracking_number && pedidoActual.tracking_number !== trackingNumber;

      // Segunda línea de defensa: actualización condicional en Supabase (cubre instancias distintas).
      // Si Shopify dispara orders/fulfilled + orders/updated para la misma acción,
      // el segundo webhook encuentra el tracking ya registrado y retorna sin enviar email.
      const { data: actualizados, error } = await supabase
        .from('pedidos')
        .update({ fulfillment_status: fulfillmentStatus, tracking_number: trackingNumber, tracking_company: trackingCompany, tracking_url: trackingUrl })
        .eq('shopify_order_id', shopifyOrderId)
        .or(`tracking_number.is.null,tracking_number.neq.${trackingNumber}`)
        .select('shopify_order_id');

      if (error) {
        console.error(`⚠️ Error actualizando fulfillment [mode=${getSupabaseMode()}]:`, error.message);
        return res.status(200).send('OK');
      }

      if (!actualizados || actualizados.length === 0) {
        console.log(`🔄 Fulfillment duplicado ignorado: guía ${trackingNumber} ya estaba registrada para ${shopifyOrderId}`);
        return res.status(200).send('OK');
      }

      console.log(`✅ Fulfillment actualizado: ${shopifyOrderId} → ${fulfillmentStatus} | corrección: ${esCorreccion}`);

      const deliveryEmail = getContactEmail(order, pedidoActual);
      if (!deliveryEmail) return res.status(200).send('OK');

      const nombreCliente = pedidoActual.nombre || 'Cliente';
      const orderName     = pedidoActual.shopify_order_name || shopifyOrderId;

      const encabezado = esCorreccion
        ? 'Actualización de tu envío'
        : 'Tu pedido está en camino';
      const subtitulo = esCorreccion
        ? 'Actualización de guía de envío'
        : 'Tu pedido está en camino';
      const cuerpo = esCorreccion
        ? `Queremos informarte que hemos actualizado la información de envío de tu pedido <strong>${orderName}</strong>. Lamentamos cualquier inconveniente ocasionado.`
        : `Tu pedido <strong>${orderName}</strong> ha sido despachado y está en camino hacia ti.`;

      try {
        await sendTransactionalEmail({
          from:    'PAVOA <onboarding@resend.dev>',
          to:      deliveryEmail,
          subject: `${encabezado} ${orderName} — PAVOA`,
          html:    emailDespacho({ nombreCliente, orderName, subtitulo, cuerpo, trackingCompany, trackingNumber, trackingUrl }),
        });
        console.log(`📧 Email [${esCorreccion ? 'corrección' : 'despacho'}] enviado a: ${deliveryEmail}`);
      } catch (emailErr) {
        console.error('⚠️ Email no enviado:', emailErr.message);
      }
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

  try {
    await handleRefundCreated(refund);
  } catch (err) {
    console.error('Error procesando reembolso:', err.message);
  }

  return res.status(200).send('OK');
}
