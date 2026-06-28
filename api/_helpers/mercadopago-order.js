import mercadopago from 'mercadopago';
import { getShopifyToken, eliminarDraftOrder } from './shopify-token.js';
import { emailConfirmacion } from './email-templates.js';
import { sendTransactionalEmail } from './mail.js';
import { trackFunnelEvent } from './funnel.js';
import { supabase, getSupabaseMode } from './supabase.js';

const client = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const _paymentInflight = new Map();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isDraftAlreadyProcessingError = (message = '') =>
  /another staff member is processing this draft order/i.test(String(message));

const isDuplicatePaymentError = (message = '') =>
  /duplicate key value violates unique constraint "pedidos_payment_id_key"/i.test(String(message));

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

const fetchOrderById = async (token, orderId) => {
  const normalizedId = String(orderId || '').trim();
  if (!normalizedId) return null;

  const base = `https://${SHOPIFY_DOMAIN}/admin/api/2026-04`;
  const response = await fetch(`${base}/orders/${normalizedId}.json`, {
    headers: { 'X-Shopify-Access-Token': token },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`No se pudo leer la orden ${normalizedId} en Shopify: ${errorText}`);
  }

  const data = await response.json();
  return data?.order || null;
};

const completarDraftOrder = async (draftOrderId) => {
  const token = await getShopifyToken();
  const base = `https://${SHOPIFY_DOMAIN}/admin/api/2026-04`;

  const resDraft = await fetch(`${base}/draft_orders/${draftOrderId}.json`, {
    headers: { 'X-Shopify-Access-Token': token },
  });
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

  const res = await fetch(
    `${base}/draft_orders/${draftOrderId}/complete.json?payment_pending=false&send_receipt=false`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shopify ${res.status}: ${err}`);
  }

  const data = await res.json();
  const completedDraft = data?.draft_order || data?.order || null;
  const shopifyOrderId = completedDraft?.order_id || data?.order?.id || null;
  let shopifyOrder = null;

  if (shopifyOrderId) {
    try {
      shopifyOrder = await fetchOrderById(token, shopifyOrderId);
    } catch (error) {
      console.error(`No se pudo hidratar la orden final ${shopifyOrderId}: ${error.message}`);
    }
  }

  return {
    ...data,
    _shopifyOrder: shopifyOrder,
    _emailCliente: emailCliente,
    _payerEmail: payerEmail,
    _accountEmail: accountEmail,
    _customerName: customerName,
    _cartItems: cartItems,
  };
};

export const enviarEmailConfirmacion = async (order, paymentId, totalReal, descuentoAplicado = false, tipoPago = 'mercadopago') => {
  const email = order.email;
  if (!email) return;

  const firstName = order.shipping_address?.first_name || order.customer?.first_name || 'Cliente';
  const orderName = order.name || `#${order.order_number}`;
  const total = Number(totalReal || order.total_price).toLocaleString('es-CO');
  const totalOriginal = descuentoAplicado
    ? Math.round(Number(totalReal || order.total_price) / 0.9).toLocaleString('es-CO')
    : null;
  const direccion = order.shipping_address
    ? `${order.shipping_address.address1}, ${order.shipping_address.address2 || ''} - ${order.shipping_address.city}`
    : '';

  await sendTransactionalEmail({
    from: 'PAVOA <onboarding@resend.dev>',
    to: email,
    subject: `Pedido confirmado ${orderName} - PAVOA`,
    html: emailConfirmacion({
      firstName,
      orderName,
      paymentId,
      lineItems: order.line_items,
      total,
      totalOriginal,
      descuentoAplicado,
      direccion,
      tipoPago,
    }),
  });
};

const toMoneyLabel = (value) =>
  value === null || value === undefined || value === ''
    ? ''
    : `$${Number(value).toLocaleString('es-CO')}`;

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

    if (existingOrder) {
      await eliminarDraftOrder(draftOrderId);
      return {
        ok: true,
        status: 'approved',
        paymentId: String(pagoInfo.id),
        draftOrderId,
        alreadyProcessed: true,
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

    let order = null;
    let emailCliente = emailMP;
    let accountEmail = accountEmailRef || emailMP;
    let cartItemsFromDraft = null;
    let shouldPersistOrder = true;
    try {
      const shopifyResponse = await completarDraftOrder(draftOrderId);
      order = shopifyResponse._shopifyOrder || shopifyResponse.order || shopifyResponse.draft_order;
      emailCliente = shopifyResponse._emailCliente || shopifyResponse._payerEmail || emailMP;
      accountEmail = shopifyResponse._accountEmail || accountEmailRef || emailCliente;
      cartItemsFromDraft = shopifyResponse._cartItems || null;
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
            imagen: cart?.imagen || i.image_url || null,
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
        await enviarEmailConfirmacion(orderParaEmail, pagoInfo.id, totalPagado, esDescuento);
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

  if (pagoInfo.status === 'rejected' || pagoInfo.status === 'cancelled') {
    await eliminarDraftOrder(draftOrderId);
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

export const processMercadoPagoPayment = async (paymentId) => {
  const key = String(paymentId);
  if (_paymentInflight.has(key)) {
    return _paymentInflight.get(key);
  }

  const promise = processMercadoPagoPaymentInternal(key)
    .finally(() => {
      _paymentInflight.delete(key);
    });

  _paymentInflight.set(key, promise);
  return promise;
};
