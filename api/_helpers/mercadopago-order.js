import mercadopago from 'mercadopago';
import { getShopifyToken, eliminarDraftOrder } from './shopify-token.js';
import { emailConfirmacion } from './email-templates.js';
import { sendTransactionalEmail } from './mail.js';
import { trackFunnelEvent } from './funnel.js';
import { supabase, getSupabaseMode } from './supabase.js';
import {
  claimIdempotency,
  clearIdempotency,
  completeIdempotency,
  failIdempotency,
  waitForIdempotency,
} from './durable-security.js';
import {
  isShippingLineItem,
  resolveFinalOrderAmounts,
  resolveLineItemAmounts,
} from './order-amounts.js';

const client = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const _paymentInflight = new Map();
const MP_PAYMENT_SCOPE = 'mp-payment';
const MP_PAYMENT_TTL = 30 * 60 * 1000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Estados desde los que el cliente todavía puede pagar con otra tarjeta sobre
 * la misma preferencia. Mientras eso sea posible, el draft debe seguir vivo:
 * es lo único que el pago aprobado tiene para convertirse en orden.
 */
export const permiteReintento = (status) =>
  status === 'rejected' || status === 'cancelled';

// Margen en pesos para no rechazar por redondeo: completarDraftOrder reparte el
// descuento porcentual sobre cada línea con toFixed(2), así que el total puede
// diferir en unos centavos del que cobró Mercado Pago.
const TOLERANCIA_PAGO_COP = 100;

/**
 * Solo se rechaza el pago de menos. Un pago de más no perjudica al negocio y
 * bloquear una orden ya cobrada por una diferencia de redondeo sería peor que
 * el riesgo que se busca evitar.
 */
export const esPagoInsuficiente = (pagado, esperado, tolerancia = TOLERANCIA_PAGO_COP) => {
  const montoPagado = Number(pagado);
  const montoEsperado = Number(esperado);
  // Solo se compara cuando ambos montos se conocen. Que Mercado Pago no reporte
  // el importe de un pago ya aprobado es una anomalía suya, y perder una orden
  // real por eso sería peor que el riesgo que esta función cubre.
  if (!Number.isFinite(montoPagado) || montoPagado <= 0) return false;
  if (!Number.isFinite(montoEsperado) || montoEsperado <= 0) return false;
  return montoPagado < montoEsperado - Math.abs(Number(tolerancia) || 0);
};

/**
 * El total que el cliente debía, leído del draft antes de crear la orden. Si no
 * se puede leer se devuelve null y la validación se omite: completarDraftOrder
 * va a fallar igual un momento después, así que no hace falta bloquear aquí.
 */
const getDraftOrderTotal = async (draftOrderId) => {
  try {
    const token = await getShopifyToken();
    const res = await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}.json`,
      { headers: { 'X-Shopify-Access-Token': token } },
    );
    if (!res.ok) return null;
    const { draft_order: draft } = await res.json();
    const total = Number(draft?.total_price);
    return Number.isFinite(total) ? total : null;
  } catch (error) {
    console.warn(`No se pudo leer el total del draft ${draftOrderId}:`, error.message);
    return null;
  }
};

const isDraftAlreadyProcessingError = (message = '') =>
  /another staff member is processing this draft order/i.test(String(message));

const isDuplicatePaymentError = (message = '') =>
  /duplicate key value violates unique constraint/i.test(String(message)) ||
  /23505/.test(String(message));

const getExistingOrderByPaymentId = async (paymentId) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('payment_id, shopify_order_name, shopify_order_id')
    .eq('payment_id', String(paymentId))
    .maybeSingle();

  if (error) {
    console.error('Error verificando pedido existente en Supabase:', error.message);
    return null;
  }

  return data || null;
};

export const completarDraftOrder = async (draftOrderId, { financialStatus = 'pending' } = {}) => {
  const token = await getShopifyToken();
  const base = `https://${SHOPIFY_DOMAIN}/admin/api/2026-04`;

  const resDraft = await fetch(`${base}/draft_orders/${draftOrderId}.json`, {
    headers: { 'X-Shopify-Access-Token': token },
  });
  if (!resDraft.ok) {
    const err = await resDraft.text();
    throw new Error(`Shopify ${resDraft.status}: no se pudo leer draft ${draftOrderId}: ${err}`);
  }
  const { draft_order: draft } = await resDraft.json();

  const emailCliente = draft?.note_attributes?.find((a) => a.name === 'customer_email')?.value || null;
  const payerEmail = draft?.note_attributes?.find((a) => a.name === 'payer_email')?.value || null;
  const accountEmail = draft?.note_attributes?.find((a) => a.name === 'account_email')?.value || null;
  const customerName = draft?.note_attributes?.find((a) => a.name === 'customer_name')?.value || null;
  let cartItems = null;
  try {
    const raw = draft?.note_attributes?.find((a) => a.name === 'cart_items')?.value;
    if (raw) cartItems = JSON.parse(raw);
  } catch {}
  const draftLineItemImages = (draft?.line_items || []).map((li) => li?.image?.src || null);

  // Pre-apply percentage discount to item prices so the order total matches what the customer paid.
  // draft_orders/complete ignores send_receipt; POST /orders.json + send_receipt:false is the only
  // reliable way to suppress Shopify's native confirmation email.
  const discountPct =
    draft.applied_discount?.value_type === 'percentage'
      ? Number(draft.applied_discount.value || 0) / 100
      : 0;

  const lineItems = (draft.line_items || []).map((li) => ({
    variant_id: li.variant_id,
    title: li.title,
    quantity: li.quantity,
    price: discountPct > 0
      ? (Number(li.price) * (1 - discountPct)).toFixed(2)
      : li.price,
  }));

  const shippingLines = draft.shipping_line
    ? [{
        title: draft.shipping_line.title || 'Envío',
        price: draft.shipping_line.price || '0',
        code: draft.shipping_line.code || 'SHIPPING',
      }]
    : [];

  const orderBody = {
    order: {
      email: draft.email || emailCliente,
      send_receipt: false,
      send_fulfillment_receipt: false,
      line_items: lineItems,
      shipping_lines: shippingLines,
      note: draft.note,
      note_attributes: draft.note_attributes,
      tags: draft.tags,
      financial_status: financialStatus,
      ...(draft.shipping_address ? { shipping_address: draft.shipping_address } : {}),
      ...(draft.billing_address ? { billing_address: draft.billing_address } : {}),
      ...(draft.customer?.id ? { customer: { id: draft.customer.id } } : {}),
    },
  };

  const res = await fetch(`${base}/orders.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify(orderBody),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shopify ${res.status}: ${err}`);
  }

  const { order } = await res.json();

  return {
    order,
    _shopifyOrder: order,
    _emailCliente: emailCliente,
    _payerEmail: payerEmail,
    _accountEmail: accountEmail,
    _customerName: customerName,
    _cartItems: cartItems,
    _draftLineItemImages: draftLineItemImages,
  };
};

export const enviarEmailConfirmacion = async (order, paymentId, totalReal, descuentoAplicado = false, tipoPago = 'mercadopago', shippingCost = 0) => {
  const email = order.email;
  if (!email) return;

  const firstName = order.shipping_address?.first_name || order.customer?.first_name || 'Cliente';
  const orderName = order.name || `#${order.order_number}`;
  const totalNum = Number(totalReal || order.total_price);
  const requestedShippingCost = Math.max(0, Number(shippingCost) || 0);
  const fallbackTotal = Number.isFinite(totalNum) ? totalNum : 0;
  const inferredAmounts = resolveLineItemAmounts({
    items: order.line_items,
    total: fallbackTotal,
    shippingCost: requestedShippingCost > 0 ? requestedShippingCost : undefined,
  });
  const {
    subtotal,
    shippingCost: envio,
    total,
  } = resolveFinalOrderAmounts({
    shopifyOrder: order,
    cartTotal: inferredAmounts.subtotal,
    shippingCost: inferredAmounts.shippingCost,
  });
  const totalOriginal = descuentoAplicado
    ? Math.round(subtotal / 0.9)
    : null;
  // Cambio #9: Dirección estructurada completa (objeto para el template)
  const notaAtributos = order.note ? Object.fromEntries(
    String(order.note).split(' | ').map(part => {
      const colonIdx = part.indexOf(':');
      if (colonIdx < 0) return [part.trim(), ''];
      return [part.slice(0, colonIdx).trim().toLowerCase(), part.slice(colonIdx + 1).trim()];
    })
  ) : {};
  const direccion = order.shipping_address ? {
    'dirección': order.shipping_address.address1 || '',
    barrio: order.shipping_address.address2 || notaAtributos['barrio'] || '',
    ciudad: order.shipping_address.city || '',
    departamento: order.shipping_address.province || '',
    telefono: order.shipping_address.phone || '',
    horario: notaAtributos['horario de entrega'] || '',
    referencia: notaAtributos['punto de referencia'] || '',
    observaciones: notaAtributos['observaciones'] || '',
  } : '';
  await sendTransactionalEmail({
    from: 'PAVOA <onboarding@resend.dev>',
    to: email,
    subject: `Pedido confirmado ${orderName} - PAVOA`,
    html: emailConfirmacion({
      firstName,
      orderName,
      paymentId,
      lineItems: (order.line_items || []).filter((item) => !isShippingLineItem(item)),
      subtotal,
      total,
      totalOriginal,
      descuentoAplicado,
      direccion,
      tipoPago,
      envio,
    }),
  });
};

const toLineItemSummary = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    product_id: item?.product_id || item?.sku || item?.variant_id || item?.id || null,
    product_name: item?.nombre || item?.title || item?.name || null,
    variant_id: item?.variant_id || null,
    color: item?.color || null,
    size: item?.talla || item?.variant_title || null,
    quantity: Number(item?.cantidad || item?.quantity || 0),
    amount: Number(item?.precio || item?.price || item?.unit_price || 0),
  }));

const getSingleLineItem = (items = []) => {
  const lineItems = toLineItemSummary(items);
  if (lineItems.length !== 1) return null;
  const [item] = lineItems;
  return {
    productId: item.product_id || null,
    productName: item.product_name || null,
    variantId: item.variant_id || null,
    color: item.color || null,
    size: item.size || null,
  };
};

const processMercadoPagoPaymentInternal = async (paymentId) => {
  const paymentClient = new mercadopago.Payment(client);
  const pagoInfo = await paymentClient.get({ id: paymentId });
  const [draftOrderId, accountEmailRef, descuentoRef] = (pagoInfo.external_reference || '').split('|');

  if (!draftOrderId) {
    return {
      ok: false,
      code: 'missing_external_reference',
      status: pagoInfo.status || null,
      paymentId: String(paymentId),
    };
  }

  if (pagoInfo.status === 'approved') {
    const existingOrder = await getExistingOrderByPaymentId(pagoInfo.id);

    // Una fila sin `shopify_order_id` es la que dejó un intento donde Shopify
    // falló: se persiste el pedido igual para no perder el registro. Darla por
    // procesada aquí borraba el draft, y sin draft la orden ya no se puede
    // crear nunca — quedaba cobrada, sin orden en Shopify y sin recuperación.
    // Solo se cierra cuando hay referencia real; si no, se reintenta abajo.
    if (existingOrder?.shopify_order_id) {
      await eliminarDraftOrder(draftOrderId);
      return {
        ok: true,
        status: 'approved',
        paymentId: String(pagoInfo.id),
        draftOrderId,
        alreadyProcessed: true,
        shopifyCompleted: true,
        shopifyOrderName: existingOrder.shopify_order_name || null,
      };
    }

    const emailMP = pagoInfo.payer?.email || accountEmailRef || null;
    let primerNombre = pagoInfo.payer?.first_name || 'Cliente';
    const itemsMP = (pagoInfo.additional_info?.items || []).map((i) => ({
      nombre: i.title,
      cantidad: Number(i.quantity),
      precio: i.unit_price,
      imagen: i.picture_url || null,
    }));
    const totalMP = pagoInfo.transaction_amount || 0;

    const esDescuento = descuentoRef === '1';
    const totalPagado = pagoInfo.transaction_amount || totalMP;
    const totalOriginalV = esDescuento ? Math.round(totalPagado / 0.9) : totalPagado;

    // El monto cobrado no se comparaba con el que se debía: la orden se marcaba
    // pagada por lo que dijera el draft, sin importar cuánto entró. Hoy la
    // preferencia se arma en el servidor y deberían coincidir, pero nada lo
    // obligaba. Se verifica antes de crear la orden, no después.
    const totalEsperado = await getDraftOrderTotal(draftOrderId);
    if (esPagoInsuficiente(totalPagado, totalEsperado)) {
      console.error(
        `Pago insuficiente, orden no creada | payment: ${pagoInfo.id} | draft: ${draftOrderId} | pagado: ${totalPagado} | esperado: ${totalEsperado}`,
      );
      return {
        ok: true,
        status: 'underpaid',
        code: 'underpaid',
        paymentId: String(pagoInfo.id),
        draftOrderId,
        paid: totalPagado,
        expected: totalEsperado,
      };
    }

    let order = null;
    let emailCliente = emailMP;
    let accountEmail = accountEmailRef || emailMP;
    let cartItemsFromDraft = null;
    let draftLineItemImages = [];
    let shouldPersistOrder = true;
    try {
      const shopifyResponse = await completarDraftOrder(draftOrderId, { financialStatus: 'paid' });
      order = shopifyResponse._shopifyOrder || shopifyResponse.order || shopifyResponse.draft_order;
      emailCliente = shopifyResponse._emailCliente || shopifyResponse._payerEmail || emailMP;
      accountEmail = shopifyResponse._accountEmail || accountEmailRef || emailCliente;
      cartItemsFromDraft = shopifyResponse._cartItems || null;
      draftLineItemImages = shopifyResponse._draftLineItemImages || [];
      if (shopifyResponse._customerName) primerNombre = shopifyResponse._customerName.trim().split(/\s+/)[0] || primerNombre;
      await eliminarDraftOrder(draftOrderId);
    } catch (shopifyErr) {
      if (isDraftAlreadyProcessingError(shopifyErr.message)) {
        console.info(`Shopify ya esta completando el draft ${draftOrderId} desde otro request.`);
        shouldPersistOrder = false;
        await wait(1200);
        await eliminarDraftOrder(draftOrderId);
      } else {
        console.error(`Shopify fallo al completar draft ${draftOrderId}: ${shopifyErr.message}`);
      }
    }

    let insertedOrder = false;
    let itemsFinales = order?.line_items
      ? order.line_items.map((i, idx) => {
          const cart = cartItemsFromDraft?.[idx] || null;
          return {
            nombre: i.title,
            cantidad: i.quantity,
            precio: i.price,
            product_id: i.product_id || null,
            variant_id: i.variant_id || null,
            variant_title: i.variant_title || null,
            sku: i.sku || null,
            talla: cart?.talla || i.variant_title || null,
            color: cart?.color || null,
            imagen: cart?.imagen || draftLineItemImages[idx] || i.image_url || null,
            detalles: cart?.detalles || '',
          };
        })
      : itemsMP;
    const orderOwnerEmail = accountEmail || emailCliente;
    if (orderOwnerEmail) {
      const addr = order?.shipping_address;
      if (shouldPersistOrder) {
        const { error: sbError } = await supabase.from('pedidos').insert({
          email: orderOwnerEmail.toLowerCase(),
          payment_id: String(pagoInfo.id),
          shopify_order_name: order?.name || `MP-${pagoInfo.id}`,
          shopify_order_id: String(order?.order_id || order?.id || ''),
          total: totalPagado,
          total_original: totalOriginalV,
          descuento_aplicado: esDescuento,
          status: 'approved',
          fulfillment_status: 'unfulfilled',
          nombre: addr ? `${addr.first_name || ''} ${addr.last_name || ''}`.trim() : primerNombre,
          telefono: addr?.phone || order?.phone || '',
          ciudad: addr?.city || '',
          direccion: addr ? [addr.address1, addr.address2].filter(Boolean).join(', ') : '',
          items: itemsFinales,
        });
        if (sbError) {
          if (isDuplicatePaymentError(sbError.message)) {
            console.info(`Pedido ya persistido para payment ${pagoInfo.id}; omitiendo insercion duplicada.`);
            shouldPersistOrder = false;

            // La fila del intento anterior quedó sin datos de Shopify porque
            // entonces no había orden. Si este intento sí la creó, se completa:
            // saltársela la dejaba para siempre en "Sin referencia Shopify" del
            // panel aunque la orden ya existiera.
            if (order) {
              const filaPrevia = await getExistingOrderByPaymentId(pagoInfo.id);
              if (filaPrevia && !filaPrevia.shopify_order_id) {
                const { error: updErr } = await supabase
                  .from('pedidos')
                  .update({
                    shopify_order_name: order.name || `MP-${pagoInfo.id}`,
                    shopify_order_id: String(order.order_id || order.id || ''),
                    nombre: addr ? `${addr.first_name || ''} ${addr.last_name || ''}`.trim() : primerNombre,
                    telefono: addr?.phone || order?.phone || '',
                    ciudad: addr?.city || '',
                    direccion: addr ? [addr.address1, addr.address2].filter(Boolean).join(', ') : '',
                    items: itemsFinales,
                  })
                  .eq('payment_id', String(pagoInfo.id));

                if (updErr) {
                  console.error(`No se pudo completar el pedido ${pagoInfo.id} con datos de Shopify:`, updErr.message);
                } else {
                  console.info(`Pedido ${pagoInfo.id} completado con la orden Shopify creada en este intento.`);
                }
              }
            }
          } else {
            console.error(
              `Error guardando pedido en Supabase [mode=${getSupabaseMode()}]:`,
              sbError.message,
            );
          }
        } else {
          insertedOrder = true;
        }
      }

      if (descuentoRef === '1' && insertedOrder && accountEmail) {
        const { error: descErr } = await supabase
          .from('usuarios')
          .update({ descuento_bienvenida_usado: true })
          .eq('email', accountEmail.toLowerCase());
        if (descErr) {
          console.error('Error marcando descuento:', descErr.message);
        }
      }
    }

    if (insertedOrder) {
      try {
        const orderParaEmail = order
          ? {
              ...order,
              email: emailCliente || order.email,
              line_items: itemsFinales.map((item) => ({
                title: item?.nombre || item?.title || 'Prenda PAVOA',
                quantity: item?.cantidad || item?.quantity || 1,
                price: item?.precio || item?.price || 0,
                variant_title: item?.variant_title || item?.talla || null,
                imagen: item?.imagen || null,
                detalles: item?.detalles || '',
              })),
            }
          : {
              email: emailCliente,
              name: `MP-${pagoInfo.id}`,
              total_price: totalPagado,
              line_items: (pagoInfo.additional_info?.items || []).map((i) => ({
                title: i.title,
                quantity: i.quantity,
                price: i.unit_price,
                variant_title: null,
                imagen: i.picture_url || null,
                detalles: '',
              })),
              shipping_address: null,
              customer: { first_name: primerNombre },
            };
        const orderShippingCost = Number(
          order?.total_shipping_price_set?.shop_money?.amount ||
          order?.shipping_lines?.[0]?.price ||
          0
        );
        await enviarEmailConfirmacion(orderParaEmail, pagoInfo.id, totalPagado, esDescuento, 'mercadopago', orderShippingCost);
      } catch (emailErr) {
        console.error('Email no enviado:', emailErr.message);
      }
    }

    const latestOrder = await getExistingOrderByPaymentId(pagoInfo.id);
    const shopifyCompleted = Boolean(order || latestOrder?.shopify_order_id);
    const shopifyOrderName = order?.name || latestOrder?.shopify_order_name || null;
    const singleItem = getSingleLineItem(itemsFinales);
    await trackFunnelEvent({
      eventKey: `payment_approved:${pagoInfo.id}`,
      eventType: 'payment_approved',
      source: 'backend',
      userEmail: accountEmail || emailCliente || pagoInfo.payer?.email || null,
      productId: singleItem?.productId || null,
      productName: singleItem?.productName || null,
      variantId: singleItem?.variantId || null,
      color: singleItem?.color || null,
      size: singleItem?.size || null,
      orderId: draftOrderId,
      paymentId: String(pagoInfo.id),
      amount: totalPagado,
      meta: {
        shopify_order_name: shopifyOrderName,
        shopify_completed: shopifyCompleted,
        already_processed: !insertedOrder,
        first_name: pagoInfo.payer?.first_name || null,
        line_items: toLineItemSummary(itemsFinales),
      },
    });

    if (shopifyCompleted) {
      await trackFunnelEvent({
        eventKey: `purchase_completed:${pagoInfo.id}`,
        eventType: 'purchase_completed',
        source: 'backend',
        userEmail: accountEmail || emailCliente || pagoInfo.payer?.email || null,
        productId: singleItem?.productId || null,
        productName: singleItem?.productName || null,
        variantId: singleItem?.variantId || null,
        color: singleItem?.color || null,
        size: singleItem?.size || null,
        orderId: draftOrderId,
        paymentId: String(pagoInfo.id),
        amount: totalPagado,
        meta: {
          shopify_order_name: shopifyOrderName,
          shopify_completed: true,
          mirror_persisted: Boolean(insertedOrder || latestOrder),
          already_processed: !insertedOrder,
          first_name: pagoInfo.payer?.first_name || null,
          line_items: toLineItemSummary(itemsFinales),
        },
      });
    }

    return {
      ok: true,
      status: 'approved',
      paymentId: String(pagoInfo.id),
      draftOrderId,
      shopifyCompleted,
      shopifyOrderName,
      alreadyProcessed: !insertedOrder,
    };
  }

  if (permiteReintento(pagoInfo.status)) {
    // Antes se borraba el draft aquí. Un rechazo no cierra el checkout: el
    // cliente sigue en Mercado Pago y puede reintentar con otra tarjeta sobre
    // la misma preferencia. Sin draft, ese segundo pago —ya aprobado y
    // cobrado— se quedaba sin nada que completar. El draft lo limpia el
    // storefront cuando el cliente vuelve al checkout.
    await trackFunnelEvent({
      eventKey: `payment_rejected:${pagoInfo.id}`,
      eventType: 'payment_rejected',
      source: 'backend',
      userEmail: accountEmailRef || pagoInfo.payer?.email || null,
      orderId: draftOrderId,
      paymentId: String(pagoInfo.id),
      amount: pagoInfo.transaction_amount || null,
      meta: {
        status: pagoInfo.status,
        status_detail: pagoInfo.status_detail || null,
      },
    });
    return {
      ok: true,
      status: pagoInfo.status,
      paymentId: String(pagoInfo.id),
      draftOrderId,
    };
  }

  await trackFunnelEvent({
    eventKey: `payment_pending:${pagoInfo.id}`,
    eventType: 'payment_pending',
    source: 'backend',
    userEmail: accountEmailRef || pagoInfo.payer?.email || null,
    orderId: draftOrderId,
    paymentId: String(pagoInfo.id),
    amount: pagoInfo.transaction_amount || null,
    meta: {
      status: pagoInfo.status || 'unknown',
      status_detail: pagoInfo.status_detail || null,
    },
  });

  return {
    ok: true,
    status: pagoInfo.status || 'unknown',
    paymentId: String(pagoInfo.id),
    draftOrderId,
  };
};

// Un resultado es terminal cuando ya no tiene sentido reprocesar el pago:
// rechazado/cancelado, o aprobado con la orden ya creada. Un "approved" sin
// orden en Shopify o un "pending" deben poder reintentarse con el proximo
// webhook, asi que en esos casos se libera el lock en vez de completarlo.
const isTerminalPaymentResult = (result) =>
  Boolean(result?.ok) && (
    result.status === 'rejected'
    || result.status === 'cancelled'
    // Un pago insuficiente no se arregla reintentando: sin esto el lock se
    // liberaría y cada webhook volvería a intentar crear la misma orden.
    || result.status === 'underpaid'
    || (result.status === 'approved' && (result.shopifyCompleted || result.alreadyProcessed))
  );

const runWithPaymentClaim = async (key, claim) => {
  try {
    const result = await processMercadoPagoPaymentInternal(key);
    if (isTerminalPaymentResult(result)) {
      await completeIdempotency({
        scope: MP_PAYMENT_SCOPE,
        key,
        claimToken: claim.claimToken,
        response: result,
        ttlMs: MP_PAYMENT_TTL,
      });
    } else {
      await failIdempotency({ scope: MP_PAYMENT_SCOPE, key, claimToken: claim.claimToken });
    }
    return result;
  } catch (error) {
    await failIdempotency({ scope: MP_PAYMENT_SCOPE, key, claimToken: claim.claimToken });
    throw error;
  }
};

const processWithDurableLock = async (key) => {
  const claim = await claimIdempotency({
    scope: MP_PAYMENT_SCOPE,
    key,
    ttlMs: MP_PAYMENT_TTL,
    requireDurable: true,
  });
  if (!claim) return processMercadoPagoPaymentInternal(key);
  if (claim.claimed) return runWithPaymentClaim(key, claim);

  const record = claim.state === 'processing'
    ? await waitForIdempotency({ scope: MP_PAYMENT_SCOPE, key, timeoutMs: 8000 })
    : claim;

  if (record?.state === 'completed' && record.response) {
    console.info(`Pago ${key} ya procesado en otra instancia; devolviendo resultado registrado.`);
    return record.response;
  }

  if (record?.state !== 'processing') {
    await clearIdempotency({ scope: MP_PAYMENT_SCOPE, key });
    const retryClaim = await claimIdempotency({
      scope: MP_PAYMENT_SCOPE,
      key,
      ttlMs: MP_PAYMENT_TTL,
      requireDurable: true,
    });
    if (retryClaim?.claimed) return runWithPaymentClaim(key, retryClaim);
    if (retryClaim?.state === 'completed' && retryClaim.response) return retryClaim.response;
  }

  console.info(`Pago ${key} en proceso en otra instancia; se responde estado pendiente.`);
  return { ok: true, status: 'pending', code: 'processing_elsewhere', paymentId: key };
};

export const processMercadoPagoPayment = async (paymentId) => {
  const key = String(paymentId);
  if (_paymentInflight.has(key)) {
    return _paymentInflight.get(key);
  }

  const promise = processWithDurableLock(key)
    .finally(() => {
      _paymentInflight.delete(key);
    });

  _paymentInflight.set(key, promise);
  return promise;
};
