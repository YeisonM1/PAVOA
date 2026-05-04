import mercadopago from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { getShopifyToken, eliminarDraftOrder } from './shopify-token.js';
import { emailConfirmacion } from './email-templates.js';
import { sendTransactionalEmail } from './mail.js';

const client = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
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

const completarDraftOrder = async (draftOrderId) => {
  const token = await getShopifyToken();
  const base = `https://${SHOPIFY_DOMAIN}/admin/api/2026-04`;

  const resDraft = await fetch(`${base}/draft_orders/${draftOrderId}.json`, {
    headers: { 'X-Shopify-Access-Token': token },
  });
  const { draft_order: draft } = await resDraft.json();
  const emailCliente = draft?.note_attributes?.find((a) => a.name === 'customer_email')?.value || null;

  const res = await fetch(
    `${base}/draft_orders/${draftOrderId}/complete.json?payment_pending=false`,
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
  return { ...data, _emailCliente: emailCliente };
};

const enviarEmailConfirmacion = async (order, paymentId, totalReal, descuentoAplicado = false) => {
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
    }),
  });
};

const processMercadoPagoPaymentInternal = async (paymentId) => {
  const paymentClient = new mercadopago.Payment(client);
  const pagoInfo = await paymentClient.get({ id: paymentId });
  const [draftOrderId, emailRef, descuentoRef] = (pagoInfo.external_reference || '').split('|');

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
      return {
        ok: true,
        status: 'approved',
        paymentId: String(pagoInfo.id),
        draftOrderId,
        alreadyProcessed: true,
        shopifyOrderName: existingOrder.shopify_order_name || null,
      };
    }

    const emailMP = emailRef || pagoInfo.payer?.email || null;
    const primerNombre = pagoInfo.payer?.first_name || 'Cliente';
    const itemsMP = (pagoInfo.additional_info?.items || []).map((i) => ({
      nombre: i.title,
      cantidad: Number(i.quantity),
      precio: i.unit_price,
    }));
    const totalMP = pagoInfo.transaction_amount || 0;

    const esDescuento = descuentoRef === '1';
    const totalPagado = pagoInfo.transaction_amount || totalMP;
    const totalOriginalV = esDescuento ? Math.round(totalPagado / 0.9) : totalPagado;

    let order = null;
    let emailCliente = emailMP;
    let shouldPersistOrder = true;
    try {
      const shopifyResponse = await completarDraftOrder(draftOrderId);
      order = shopifyResponse.draft_order || shopifyResponse.order;
      emailCliente = shopifyResponse._emailCliente || emailMP;
      await eliminarDraftOrder(draftOrderId);
    } catch (shopifyErr) {
      if (isDraftAlreadyProcessingError(shopifyErr.message)) {
        console.info(`Shopify ya esta completando el draft ${draftOrderId} desde otro request.`);
        shouldPersistOrder = false;
        await wait(1200);
      } else {
        console.error(`Shopify fallo al completar draft ${draftOrderId}: ${shopifyErr.message}`);
      }
    }

    let insertedOrder = false;
    if (emailCliente) {
      const itemsFinales = order?.line_items
        ? order.line_items.map((i) => ({ nombre: i.title, cantidad: i.quantity, precio: i.price }))
        : itemsMP;
      const addr = order?.shipping_address;
      if (shouldPersistOrder) {
        const { error: sbError } = await supabase.from('pedidos').insert({
          email: emailCliente.toLowerCase(),
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
            console.error('Error guardando pedido en Supabase:', sbError.message);
          }
        } else {
          insertedOrder = true;
        }
      }

      if (descuentoRef === '1' && insertedOrder) {
        const { error: descErr } = await supabase
          .from('usuarios')
          .update({ descuento_bienvenida_usado: true })
          .eq('email', emailCliente.toLowerCase());
        if (descErr) {
          console.error('Error marcando descuento:', descErr.message);
        }
      }
    }

    if (insertedOrder) {
      try {
        const orderParaEmail = order
          ? { ...order, email: emailCliente || order.email }
          : {
              email: emailCliente,
              name: `MP-${pagoInfo.id}`,
              total_price: totalPagado,
              line_items: (pagoInfo.additional_info?.items || []).map((i) => ({
                title: i.title,
                quantity: i.quantity,
                price: i.unit_price,
                variant_title: null,
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
    return {
      ok: true,
      status: 'approved',
      paymentId: String(pagoInfo.id),
      draftOrderId,
      shopifyCompleted: Boolean(order || latestOrder?.shopify_order_id),
      shopifyOrderName: order?.name || latestOrder?.shopify_order_name || null,
      alreadyProcessed: !insertedOrder,
    };
  }

  if (pagoInfo.status === 'rejected' || pagoInfo.status === 'cancelled') {
    await eliminarDraftOrder(draftOrderId);
    return {
      ok: true,
      status: pagoInfo.status,
      paymentId: String(pagoInfo.id),
      draftOrderId,
    };
  }

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
