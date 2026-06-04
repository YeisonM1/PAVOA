import crypto from 'crypto';
import { emailDespacho, emailEntregado, emailPedidoCancelado } from './_helpers/email-templates.js';
import { getShopifyToken } from './_helpers/shopify-token.js';
import { sendTransactionalEmail } from './_helpers/mail.js';
import { supabase, getSupabaseMode } from './_helpers/supabase.js';

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const SHOPIFY_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;

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

const getCustomerEmail = (order, pedido) =>
  pedido?.email ||
  order?.email ||
  order?.contact_email ||
  order?.customer?.email ||
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
    }));
  }

  return (order?.line_items || []).map((item) => ({
    title: item.title || item.name || 'Prenda PAVOA',
    quantity: item.quantity || 1,
    price: item.price || 0,
    variant_title: item.variant_title || null,
  }));
};

const getCancelReasonLabel = (reason) => {
  const normalized = String(reason || '').trim().toLowerCase();
  const labels = {
    customer: 'Solicitud del cliente',
    fraud: 'Validacion de seguridad',
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
    .select('email, shopify_order_name, nombre, status, fulfillment_status, total, items')
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

  if (wasAlreadyCancelled) {
    console.log(`Cancelacion ya procesada para pedido: ${shopifyOrderId}`);
    return;
  }

  const email = getCustomerEmail(order, pedido);
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const topic      = req.headers['x-shopify-topic']        || '';
  const hmacHeader = req.headers['x-shopify-hmac-sha256']  || '';
  const rawBody    = JSON.stringify(req.body);

  // Firma: Vercel re-parsea el body y rompe el HMAC — procesamos siempre
  validarFirma(rawBody, hmacHeader);

  if (topic === 'orders/cancelled') {
    await handleOrderCancelled(req.body);
    return res.status(200).send('OK');
  }

  // ── Entregado: tag "entregado" en la orden ─────────────
  if (topic === 'orders/updated') {
    const order          = req.body;
    const shopifyOrderId = String(order.id || '');
    const tags           = (order.tags || '').toLowerCase().split(',').map(t => t.trim());

    if (shopifyOrderId && tags.includes('entregado')) {
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

        if (pedido.email) {
          const nombreCliente = pedido.nombre || 'Cliente';
          const orderName     = pedido.shopify_order_name || shopifyOrderId;
          try {
            await sendTransactionalEmail({
              from:    'PAVOA <onboarding@resend.dev>',
              to:      pedido.email,
              subject: `Tu pedido ${orderName} ha llegado — PAVOA`,
              html:    emailEntregado({ nombreCliente, orderName }),
            });
            console.log(`📧 Email de entrega enviado a: ${pedido.email}`);
          } catch (emailErr) {
            console.error('⚠️ Email de entrega no enviado:', emailErr.message);
          }
        }
      }
    }
  }

  // ── Fulfillment: actualizar estado en Supabase + email ──
  if (topic === 'orders/updated' || topic === 'orders/fulfilled') {
    const order             = req.body;
    const shopifyOrderId    = String(order.id || '');
    const tags              = (order.tags || '').toLowerCase().split(',').map(t => t.trim());
    const esEntregado       = tags.includes('entregado');
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
      const esCorreccion = !!pedidoActual?.tracking_number && pedidoActual.tracking_number !== trackingNumber;

      const { error } = await supabase
        .from('pedidos')
        .update({ fulfillment_status: fulfillmentStatus, tracking_number: trackingNumber, tracking_company: trackingCompany, tracking_url: trackingUrl })
        .eq('shopify_order_id', shopifyOrderId);

      if (error) {
        console.error(`⚠️ Error actualizando fulfillment [mode=${getSupabaseMode()}]:`, error.message);
        return res.status(200).send('OK');
      }
      console.log(`✅ Fulfillment actualizado: ${shopifyOrderId} → ${fulfillmentStatus} | corrección: ${esCorreccion}`);

      if (!pedidoActual?.email) return res.status(200).send('OK');

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
          to:      pedidoActual.email,
          subject: `${encabezado} ${orderName} — PAVOA`,
          html:    emailDespacho({ nombreCliente, orderName, subtitulo, cuerpo, trackingCompany, trackingNumber, trackingUrl }),
        });
        console.log(`📧 Email [${esCorreccion ? 'corrección' : 'despacho'}] enviado a: ${pedidoActual.email}`);
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

  return res.status(200).send('OK');
}
