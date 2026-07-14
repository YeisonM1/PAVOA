import mercadopago from 'mercadopago';
import { getShopifyToken, eliminarDraftOrder } from './_helpers/shopify-token.js';
import { processMercadoPagoPayment, enviarEmailConfirmacion, completarDraftOrder } from './_helpers/mercadopago-order.js';
import { validateCartWithShopify } from './_helpers/cart-validation.js';
import { verifyCheckoutToken, verifyToken } from './_helpers/auth.js';
import { trackFunnelEvent } from './_helpers/funnel.js';
import { supabase, getSupabaseMode } from './_helpers/supabase.js';
import {
  isShippingLineItem,
  resolveFinalOrderAmounts,
  resolveLineItemAmounts,
} from './_helpers/order-amounts.js';

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.com.co';
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const MP_EXPECTED_USER_ID = String(
  process.env.MP_EXPECTED_USER_ID || process.env.MP_SELLER_USER_ID || ''
).trim();
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const getCheckoutAccess = ({ checkoutToken, draftOrderId, email }) => {
  const payload = verifyCheckoutToken(checkoutToken, { draftOrderId });
  if (!payload) return null;
  if (email && normalizeEmail(payload.email) !== normalizeEmail(email)) return null;
  return payload;
};

const getPaymentAccessContext = async ({ paymentId, checkoutToken }) => {
  const paymentClient = new mercadopago.Payment(client);
  const payment = await paymentClient.get({ id: paymentId });
  const draftOrderId = String(payment?.external_reference || '').split('|')[0].trim();
  const access = getCheckoutAccess({ checkoutToken, draftOrderId });
  return access ? { payment, draftOrderId, access } : null;
};
const formatCop = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`;
const PAYMENT_PREFERENCE_TTL = 15 * 60 * 1000;
const _paymentPreferenceCache = new Map();
const _paymentPreferenceInflight = new Map();

const requiredEnvError = () => {
  if (!process.env.MP_ACCESS_TOKEN) return 'Falta MP_ACCESS_TOKEN en variables de entorno de Vercel.';
  if (!process.env.JWT_SECRET) return 'Falta JWT_SECRET en variables de entorno de Vercel.';
  if (!process.env.VITE_SUPABASE_URL) return 'Falta VITE_SUPABASE_URL en variables de entorno de Vercel.';
  if (!process.env.VITE_SUPABASE_ANON_KEY) return 'Falta VITE_SUPABASE_ANON_KEY en variables de entorno de Vercel.';
  if (!SHOPIFY_DOMAIN) return 'Falta VITE_SHOPIFY_DOMAIN en variables de entorno de Vercel.';
  return null;
};

const mpFetchJson = async (url) => {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  const raw = await res.text();
  let data = null;
  try {
    data = JSON.parse(raw);
  } catch {}

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: data?.message || data?.error || raw?.slice(0, 240) || 'Error consultando MercadoPago',
      data,
    };
  }

  return { ok: true, status: res.status, data };
};

const getTokenUserIdHint = () => {
  const token = String(process.env.MP_ACCESS_TOKEN || '').trim();
  const tail = token.split('-').pop() || '';
  return /^\d+$/.test(tail) ? tail : null;
};

const splitCustomerName = (fullName = '') => {
  const [firstName, ...rest] = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: firstName || null,
    lastName: rest.join(' ') || null,
  };
};

const validateExpectedSeller = async () => {
  if (!MP_EXPECTED_USER_ID) return { ok: true, skipped: true };

  const userInfo = await mpFetchJson('https://api.mercadopago.com/users/me');
  if (!userInfo.ok) {
    return {
      ok: false,
      status: 502,
      error: `No se pudo validar la cuenta activa de Mercado Pago: ${userInfo.error || 'sin detalle'}`,
      detail: {
        expected_user_id: MP_EXPECTED_USER_ID,
        token_user_id_hint: getTokenUserIdHint(),
      },
    };
  }

  const activeUserId = String(userInfo.data?.id || '').trim();
  if (activeUserId !== MP_EXPECTED_USER_ID) {
    return {
      ok: false,
      status: 409,
      error: `Mercado Pago activo distinto al esperado. Esperado: ${MP_EXPECTED_USER_ID}. Activo: ${activeUserId || 'desconocido'}. Revisa variables de Vercel y redeploy.`,
      detail: {
        expected_user_id: MP_EXPECTED_USER_ID,
        active_user_id: activeUserId || null,
        token_user_id_hint: getTokenUserIdHint(),
      },
    };
  }

  return { ok: true, active_user_id: activeUserId };
};

const buildCartSummary = (cartItems = []) =>
  (Array.isArray(cartItems) ? cartItems : []).map((item) => ({
    product_id: item?.producto?.id || null,
    product_name: item?.producto?.nombre || null,
    variant_id: item?.producto?.selectedVariantId || null,
    color: item?.producto?.colorSeleccionado || null,
    size: item?.talla || null,
    quantity: Number(item?.cantidad || 0),
    amount: Number(item?.producto?.precioNumerico || 0),
  }));

const getSingleCartItem = (cartItems = []) => {
  if (!Array.isArray(cartItems) || cartItems.length !== 1) return null;
  const [item] = cartItems;
  return {
    productId: item?.producto?.id || null,
    productName: item?.producto?.nombre || null,
    variantId: item?.producto?.selectedVariantId || null,
    color: item?.producto?.colorSeleccionado || null,
    size: item?.talla || null,
  };
};

const buildPaymentPreferenceKey = ({ idempotencyKey, draftOrderId, orderOwnerEmail }) => {
  const explicitKey = String(idempotencyKey || '').trim();
  if (explicitKey) return `key:${explicitKey}`;

  const normalizedDraftOrderId = String(draftOrderId || '').trim();
  if (!normalizedDraftOrderId) return '';

  return `draft:${normalizedDraftOrderId}|${normalizeEmail(orderOwnerEmail) || 'unknown'}`;
};

const getCachedPaymentPreference = (key) => {
  if (!key) return null;

  const entry = _paymentPreferenceCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > PAYMENT_PREFERENCE_TTL) {
    _paymentPreferenceCache.delete(key);
    return null;
  }

  return entry.payload;
};

const setCachedPaymentPreference = (key, payload) => {
  if (!key || !payload?.ok) return;
  _paymentPreferenceCache.set(key, { payload, ts: Date.now() });
};

const markPreferenceAsReused = (payload) => ({
  ...payload,
  ...(payload?.debug ? { debug: {
    ...(payload?.debug || {}),
    reused_preference: true,
  } } : {}),
});

const buildPreferenceResponsePayload = ({
  preference,
  checkoutUrl,
  checkoutMode,
  descuentoAplicado,
  sellerCheck,
  paymentPreferenceKey,
}) => ({
  ok: true,
  init_point: checkoutUrl,
  descuento_aplicado: descuentoAplicado,
  ...(process.env.NODE_ENV !== 'production' ? { debug: {
    preference_id: preference.id,
    collector_id: preference.collector_id,
    live_mode: preference.live_mode,
    checkout_mode: checkoutMode,
    checkout_url: checkoutUrl,
    sandbox_init_point: preference.sandbox_init_point || null,
    init_point: preference.init_point,
    expected_user_id: MP_EXPECTED_USER_ID || null,
    active_user_id: sellerCheck.active_user_id || null,
    token_user_id_hint: getTokenUserIdHint(),
    payment_preference_key: paymentPreferenceKey || null,
    reused_preference: false,
  } } : {}),
});

const buildMpDiagnosticSummary = ({ userInfo, preferenceInfo }) => {
  const summary = [];

  if (!userInfo?.ok) {
    summary.push({
      level: 'error',
      code: 'mp_user_unavailable',
      message: 'No se pudo consultar el estado de la cuenta de Mercado Pago.',
      detail: userInfo?.error || null,
    });
    return summary;
  }

  const activeUserId = String(userInfo.data?.id || '').trim() || null;
  const preferenceCollectorId = preferenceInfo?.ok
    ? String(preferenceInfo.data?.collector_id || '').trim() || null
    : null;
  const status = userInfo.data?.status || {};
  const billingAllow = status?.billing?.allow;
  const billingCodes = Array.isArray(status?.billing?.codes) ? status.billing.codes : [];
  const siteStatus = status?.site_status || null;

  if (MP_EXPECTED_USER_ID) {
    if (activeUserId === MP_EXPECTED_USER_ID) {
      summary.push({
        level: 'info',
        code: 'expected_seller_match',
        message: 'La cuenta activa coincide con el seller esperado.',
        detail: `expected=${MP_EXPECTED_USER_ID} | active=${activeUserId}`,
      });
    } else {
      summary.push({
        level: 'error',
        code: 'expected_seller_mismatch',
        message: 'La cuenta activa no coincide con el seller esperado.',
        detail: `expected=${MP_EXPECTED_USER_ID} | active=${activeUserId || 'n/a'}`,
      });
    }
  }

  if (siteStatus && siteStatus !== 'active') {
    summary.push({
      level: 'error',
      code: 'mp_site_inactive',
      message: `La cuenta de Mercado Pago no esta activa (${siteStatus}).`,
      detail: 'Revisa el estado de la cuenta en Mercado Pago Developers.',
    });
  }

  if (billingAllow === false) {
    if (billingCodes.includes('address_pending')) {
      summary.push({
        level: 'error',
        code: 'address_pending',
        message: 'La cuenta tiene bloqueo de facturacion por direccion pendiente.',
        detail: 'Completa y valida direccion y datos fiscales en la cuenta receptora de cobros.',
      });
    } else {
      summary.push({
        level: 'error',
        code: 'billing_blocked',
        message: 'La cuenta no tiene permitido cobrar (billing.allow=false).',
        detail: billingCodes.join(', ') || 'Sin codigo especifico',
      });
    }
  }

  if (preferenceInfo?.ok) {
    const preference = preferenceInfo.data || {};
    summary.push({
      level: 'info',
      code: 'preference_created',
      message: 'La preferencia se creo correctamente.',
      detail: `collector_id=${preference.collector_id || 'n/a'} | id=${preference.id || 'n/a'}`,
    });

    if (activeUserId && preferenceCollectorId && activeUserId !== preferenceCollectorId) {
      summary.push({
        level: 'error',
        code: 'collector_mismatch',
        message: 'La preferencia quedo asociada a un collector distinto de la cuenta activa.',
        detail: `active=${activeUserId} | collector=${preferenceCollectorId}`,
      });
    }
  } else {
    summary.push({
      level: 'warn',
      code: 'preference_unavailable',
      message: 'No se pudo consultar la preferencia con ese ID.',
      detail: preferenceInfo?.error || null,
    });
  }

  if (summary.length === 0) {
    summary.push({
      level: 'info',
      code: 'no_blockers_detected',
      message: 'No se detectaron bloqueos basicos en credenciales o cuenta.',
      detail: null,
    });
  }

  return summary;
};

const createPaymentPreference = async ({
  form,
  cartItems,
  cartTotal,
  shippingCost,
  draftOrderId,
  funnelSessionId,
  orderOwnerEmail,
  authUserId,
  paymentPreferenceKey,
}) => {
  const singleItem = getSingleCartItem(cartItems);

  try {
    const sellerCheck = await validateExpectedSeller();
    if (!sellerCheck.ok) {
      await trackFunnelEvent({
        eventType: 'payment_preference_failed',
        source: 'backend',
        sessionId: String(funnelSessionId || '').trim() || null,
        userId: authUserId,
        userEmail: orderOwnerEmail,
        productId: singleItem?.productId || null,
        productName: singleItem?.productName || null,
        variantId: singleItem?.variantId || null,
        color: singleItem?.color || null,
        size: singleItem?.size || null,
        orderId: draftOrderId,
        amount: cartTotal || null,
        meta: {
          stage: 'seller_validation',
          detail: sellerCheck.detail || sellerCheck.error,
          payment_preference_key: paymentPreferenceKey || null,
          line_items: buildCartSummary(cartItems),
        },
      });
      return {
        statusCode: sellerCheck.status || 409,
        payload: {
          error: sellerCheck.error,
          detail: sellerCheck.detail || null,
        },
      };
    }

    const preferenceClient = new mercadopago.Preference(client);

    const { trustedItems, total } = await validateCartWithShopify(cartItems);
    if (Math.abs(Number(cartTotal) - total) > 1) {
      await eliminarDraftOrder(draftOrderId);
      await trackFunnelEvent({
        eventType: 'payment_preference_failed',
        source: 'backend',
        sessionId: String(funnelSessionId || '').trim() || null,
        userId: authUserId,
        userEmail: orderOwnerEmail,
        productId: singleItem?.productId || null,
        productName: singleItem?.productName || null,
        variantId: singleItem?.variantId || null,
        color: singleItem?.color || null,
        size: singleItem?.size || null,
        orderId: draftOrderId,
        amount: cartTotal || null,
        meta: {
          stage: 'cart_validation',
          expected_total: total,
          received_total: Number(cartTotal),
          payment_preference_key: paymentPreferenceKey || null,
          line_items: buildCartSummary(cartItems),
        },
      });
      return {
        statusCode: 409,
        payload: {
          error: 'El precio del carrito cambio. Actualiza la bolsa e intenta de nuevo.',
        },
      };
    }

    let itemsMapped = trustedItems.map((item) => ({
      id: String(item.variantId),
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      currency_id: 'COP',
    }));

    let descuentoAplicado = false;
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('descuento_bienvenida_usado')
        .eq('email', orderOwnerEmail)
        .eq('email_verified', true)
        .single();

      if (usuario && !usuario.descuento_bienvenida_usado) {
        itemsMapped = itemsMapped.map((item) => ({
          ...item,
          title: `${item.title} - Descuento bienvenida 10%`,
          description: `Precio original ${formatCop(item.unit_price)} | Descuento bienvenida 10% -${formatCop(Math.round(item.unit_price * 0.1))} | Precio final ${formatCop(Math.round(item.unit_price * 0.9))}`,
          unit_price: Math.round(item.unit_price * 0.9),
        }));
        descuentoAplicado = true;
        console.log(`Descuento bienvenida 10% aplicado a: ${orderOwnerEmail}`);
      }
    } catch (descErr) {
      console.warn('No se pudo verificar descuento:', descErr.message);
    }

    const validShippingCost = Math.max(0, Number(shippingCost) || 0);
    if (validShippingCost > 0) {
      itemsMapped = [
        ...itemsMapped,
        {
          id: 'envio',
          title: 'Envio a domicilio',
          description: `Cobro de envio ${formatCop(validShippingCost)}`,
          quantity: 1,
          unit_price: validShippingCost,
          currency_id: 'COP',
        },
      ];
    }

    if (descuentoAplicado) {
      try {
        const shopifyToken = await getShopifyToken();
        await fetch(
          `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}.json`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': shopifyToken },
            body: JSON.stringify({
              draft_order: {
                applied_discount: { title: 'Descuento Bienvenida 10%', value: '10.0', value_type: 'percentage' },
              },
            }),
          }
        );
        console.log(`Descuento aplicado en Shopify draft order: ${draftOrderId}`);
      } catch (shopifyErr) {
        console.warn('No se pudo aplicar descuento en Shopify:', shopifyErr.message);
      }
    }

    const externalRef = `${draftOrderId}|${orderOwnerEmail}|${descuentoAplicado ? '1' : '0'}`;
    const customerName = splitCustomerName(form?.nombre);
    const preference = await preferenceClient.create({
      body: {
        items: itemsMapped,
        payer: {
          first_name: customerName.firstName || undefined,
          last_name: customerName.lastName || undefined,
        },
        back_urls: {
          success: `${APP_URL}/orden-confirmada`,
          failure: `${APP_URL}/checkout`,
          pending: `${APP_URL}/orden-confirmada`,
        },
        auto_return: 'approved',
        external_reference: externalRef,
        notification_url: `${APP_URL}/api/webhook-mercadopago`,
        statement_descriptor: 'PAVOA',
      },
    });

    const checkoutUrl = preference.init_point || preference.sandbox_init_point;
    const checkoutMode = preference.init_point ? 'live' : 'sandbox';

    console.log(
      `Preferencia MP creada: ${preference.id} | collector: ${preference.collector_id} | live_mode: ${preference.live_mode} | checkout_mode: ${checkoutMode} | draft: ${draftOrderId} | descuento: ${descuentoAplicado}`
    );

    await trackFunnelEvent({
      eventKey: `payment_preference_created:${preference.id}`,
      eventType: 'payment_preference_created',
      source: 'backend',
      sessionId: String(funnelSessionId || '').trim() || null,
      userId: authUserId,
      userEmail: orderOwnerEmail,
      productId: singleItem?.productId || null,
      productName: singleItem?.productName || null,
      variantId: singleItem?.variantId || null,
      color: singleItem?.color || null,
      size: singleItem?.size || null,
      orderId: draftOrderId,
      amount: total,
      meta: {
        preference_id: preference.id,
        collector_id: preference.collector_id || null,
        checkout_mode: checkoutMode,
        descuento_aplicado: descuentoAplicado,
        payment_preference_key: paymentPreferenceKey || null,
        line_count: trustedItems.length,
        item_count: trustedItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        line_items: buildCartSummary(cartItems),
      },
    });

    const payload = buildPreferenceResponsePayload({
      preference,
      checkoutUrl,
      checkoutMode,
      descuentoAplicado,
      sellerCheck,
      paymentPreferenceKey,
    });

    setCachedPaymentPreference(paymentPreferenceKey, payload);

    return {
      statusCode: 200,
      payload,
    };
  } catch (error) {
    console.error('Error creando preferencia MP:', error?.message);
    await eliminarDraftOrder(draftOrderId);
    await trackFunnelEvent({
      eventType: 'payment_preference_failed',
      source: 'backend',
      sessionId: String(funnelSessionId || '').trim() || null,
      userId: authUserId,
      userEmail: orderOwnerEmail,
      productId: singleItem?.productId || null,
      productName: singleItem?.productName || null,
      variantId: singleItem?.variantId || null,
      color: singleItem?.color || null,
      size: singleItem?.size || null,
      orderId: draftOrderId,
      amount: cartTotal || null,
      meta: {
        stage: 'unexpected',
        detail: error?.message || 'Error al crear la preferencia de pago',
        payment_preference_key: paymentPreferenceKey || null,
        line_items: buildCartSummary(cartItems),
      },
    });
    return {
      statusCode: 500,
      payload: {
        error: error?.message || 'Error al crear la preferencia de pago',
      },
    };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const envError = requiredEnvError();
  if (envError) {
    console.error('Configuracion incompleta en /api/procesar-pago:', envError);
    return res.status(500).json({ error: envError });
  }

  if (req.body?.type === 'mp-diagnostico') {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: 'No disponible.' });
    }
    const preferenceId = String(req.body?.preferenceId || '').trim();
    const userInfo = await mpFetchJson('https://api.mercadopago.com/users/me');
    const preferenceInfo = preferenceId
      ? await mpFetchJson(`https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(preferenceId)}`)
      : { ok: false, status: 400, error: 'No se recibio preferenceId', data: null };
    const resumen = buildMpDiagnosticSummary({ userInfo, preferenceInfo });

    return res.status(200).json({
      ok: true,
      diagnostico: {
        now: new Date().toISOString(),
        checkout_flow: 'redirect_checkout_pro',
        uses_public_key: false,
        expected_user_id: MP_EXPECTED_USER_ID || null,
        token_user_id_hint: getTokenUserIdHint(),
        resumen,
        mp_user: userInfo.ok
          ? {
              id: userInfo.data?.id,
              nickname: userInfo.data?.nickname,
              site_id: userInfo.data?.site_id,
              country_id: userInfo.data?.country_id,
              status: userInfo.data?.status,
            }
          : {
              error: userInfo.error,
              status: userInfo.status,
            },
        preference: preferenceInfo.ok
          ? {
              id: preferenceInfo.data?.id,
              collector_id: preferenceInfo.data?.collector_id,
              init_point: preferenceInfo.data?.init_point,
              sandbox_init_point: preferenceInfo.data?.sandbox_init_point,
              external_reference: preferenceInfo.data?.external_reference,
              date_created: preferenceInfo.data?.date_created,
              expiration_date_to: preferenceInfo.data?.expiration_date_to,
            }
          : {
              error: preferenceInfo.error,
              status: preferenceInfo.status,
            },
      },
    });
  }

  if (req.body?.type === 'cancel-draft-order') {
    const draftOrderId = String(req.body?.draftOrderId || '').trim();
    const checkoutToken = String(req.body?.checkoutToken || '').trim();
    if (!draftOrderId || !getCheckoutAccess({ checkoutToken, draftOrderId })) {
      return res.status(403).json({ error: 'No autorizado para cancelar este pedido.' });
    }

    await eliminarDraftOrder(draftOrderId);
    return res.status(200).json({ ok: true, draftOrderId });
  }

  if (req.body?.type === 'mp-finalizar') {
    const paymentId = String(req.body?.paymentId || '').trim();
    const checkoutToken = String(req.body?.checkoutToken || '').trim();
    if (!paymentId) {
      return res.status(400).json({ error: 'Falta paymentId' });
    }

    try {
      const accessContext = await getPaymentAccessContext({ paymentId, checkoutToken });
      if (!accessContext) return res.status(403).json({ error: 'No autorizado para consultar este pago.' });
    } catch {
      return res.status(404).json({ error: 'Pago no encontrado.' });
    }

    // Si el webhook de MP ya procesó el pago e insertó el pedido, devolver sin
    // volver a llamar a processMercadoPagoPayment para evitar email duplicado.
    try {
      const { data: pedidoExistente } = await supabase
        .from('pedidos')
        .select('payment_id, shopify_order_name, status')
        .eq('payment_id', paymentId)
        .maybeSingle();

      if (pedidoExistente) {
        console.log(`mp-finalizar: pedido ya procesado para payment ${paymentId}`);
        return res.status(200).json({
          ok: true,
          status: 'approved',
          alreadyProcessed: true,
          shopifyOrderName: pedidoExistente.shopify_order_name || null,
        });
      }
    } catch (dbErr) {
      console.warn('mp-finalizar: error verificando pedido en Supabase:', dbErr.message);
    }

    try {
      const result = await processMercadoPagoPayment(paymentId);
      return res.status(result.ok ? 200 : 409).json(result);
    } catch (err) {
      console.warn('mp-finalizar: no se pudo verificar pago', paymentId, err.message);
      return res.status(200).json({ ok: false, error: 'No se pudo verificar el pago' });
    }
  }

  if (req.body?.type === 'mp-summary') {
    const paymentId = String(req.body?.paymentId || '').trim();
    const checkoutToken = String(req.body?.checkoutToken || '').trim();
    if (!paymentId) {
      return res.status(400).json({ error: 'Falta paymentId' });
    }

    try {
      const accessContext = await getPaymentAccessContext({ paymentId, checkoutToken });
      if (!accessContext) return res.status(403).json({ error: 'No autorizado para consultar este pago.' });
      const payment = accessContext.payment;
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('nombre,email,total,items,descuento_aplicado')
        .eq('payment_id', paymentId)
        .maybeSingle();

      if (pedido) {
        const firstName = String(pedido.nombre || '').trim().split(/\s+/).filter(Boolean)[0] || null;
        const amounts = resolveLineItemAmounts({ items: pedido.items, total: pedido.total });
        return res.status(200).json({
          ok: true,
          summary: {
            firstName,
            nombre: pedido.nombre || null,
            email: pedido.email || null,
            ...amounts,
            descuentoAplicado: Boolean(pedido.descuento_aplicado),
            items: Array.isArray(pedido.items) ? pedido.items : [],
          },
        });
      }

      const paymentItems = payment?.additional_info?.items || [];
      const amounts = resolveLineItemAmounts({
        items: paymentItems,
        total: payment?.transaction_amount,
      });

      return res.status(200).json({
        ok: true,
        summary: {
          firstName: payment?.payer?.first_name || null,
          nombre: payment?.payer?.first_name || null,
          email: payment?.payer?.email || null,
          ...amounts,
          items: paymentItems.filter((item) => !isShippingLineItem(item)).map((item) => ({
            nombre: item.title,
            cantidad: Number(item.quantity || 0),
            precio: item.unit_price
              ? `$${Number(item.unit_price).toLocaleString('es-CO')}`
              : '',
            color: null,
            talla: null,
            imagen: item.picture_url || null,
          })),
        },
      });
    } catch (error) {
      console.error(
        `[PAVOA] mp-summary fallo consultando pedidos [mode=${getSupabaseMode()}]:`,
        error?.message || error,
      );
      return res.status(500).json({ error: error?.message || 'No se pudo resumir el pago.' });
    }
  }

  if (req.body?.type === 'contraentrega') {
    const tokenPayload = verifyToken(req);
    const { draftOrderId, checkoutToken, form, cartItems, cartTotal, funnelSessionId } = req.body;
    const orderOwnerEmail = normalizeEmail(tokenPayload?.email || form?.email);

    if (!draftOrderId || !form?.nombre || !orderOwnerEmail) {
      return res.status(400).json({ error: 'Datos incompletos para registrar el pedido contra entrega.' });
    }
    const checkoutAccess = getCheckoutAccess({ checkoutToken, draftOrderId, email: orderOwnerEmail });
    if (!checkoutAccess) {
      return res.status(403).json({ error: 'No autorizado para completar este pedido.' });
    }
    const shippingCost = Number(checkoutAccess.shippingCost || 0);

    try {
      // Create the real order via POST /orders.json with send_receipt:false — the
      // draft_orders/complete endpoint does not reliably suppress Shopify's native
      // order confirmation email, which caused a duplicate alongside PAVOA's email.
      const shopifyResponse = await completarDraftOrder(draftOrderId);
      const shopifyOrder = shopifyResponse._shopifyOrder || shopifyResponse.order || null;
      const emailCliente = shopifyResponse._emailCliente || normalizeEmail(form?.email);
      const cartItemsFromDraft = shopifyResponse._cartItems || null;
      const draftLineItemImages = shopifyResponse._draftLineItemImages || [];
      await eliminarDraftOrder(draftOrderId);

      const shopifyOrderId = shopifyOrder?.id || null;
      const orderName = shopifyOrder?.name || `COD-${draftOrderId}`;
      const addr = shopifyOrder?.shipping_address || null;
      const nombre = addr
        ? `${addr.first_name || ''} ${addr.last_name || ''}`.trim()
        : (form?.nombre || '');
      const {
        subtotal: finalSubtotal,
        total: totalConEnvio,
        shippingCost: finalShippingCost,
      } = resolveFinalOrderAmounts({ shopifyOrder, cartTotal, shippingCost });

      const itemsFinales = shopifyOrder?.line_items
        ? shopifyOrder.line_items.map((i, idx) => {
            const cart = cartItemsFromDraft?.[idx] || null;
            return {
              nombre: i.title,
              cantidad: i.quantity,
              precio: i.price,
              product_id: i.product_id || null,
              variant_id: i.variant_id || null,
              variant_title: i.variant_title || null,
              talla: cart?.talla || i.variant_title || null,
              color: cart?.color || null,
              imagen: cart?.imagen || draftLineItemImages[idx] || i.image_url || null,
              detalles: cart?.detalles || '',
            };
          })
        : (Array.isArray(cartItems) ? cartItems : []).map(item => ({
            nombre: item?.producto?.nombre || '',
            cantidad: Number(item?.cantidad || 0),
            precio: Number(item?.producto?.precioNumerico || 0),
            talla: item?.talla || null,
            color: item?.producto?.colorSeleccionado || null,
            imagen: item?.producto?.imagen1 || null,
            detalles: '',
          }));

      // Persist to Supabase
      const codRef = `cod-${shopifyOrderId || draftOrderId}`;
      const { error: sbError } = await supabase.from('pedidos').insert({
        email: orderOwnerEmail.toLowerCase(),
        payment_id: codRef,
        shopify_order_name: orderName,
        shopify_order_id: String(shopifyOrderId || ''),
        total: totalConEnvio,
        total_original: totalConEnvio,
        descuento_aplicado: false,
        status: 'contraentrega',
        fulfillment_status: 'unfulfilled',
        nombre,
        telefono: addr?.phone || form?.telefono || '',
        ciudad: addr?.city || form?.ciudad || '',
        direccion: addr
          ? [addr.address1, addr.address2].filter(Boolean).join(', ')
          : (form?.dirección || ''),
        items: itemsFinales,
      });
      if (sbError) {
        console.error('Error guardando pedido COD en Supabase:', sbError.message);
      }

      // Send confirmation email
      try {
        const orderParaEmail = shopifyOrder || {
          email: emailCliente,
          name: orderName,
          total_price: totalConEnvio,
          line_items: itemsFinales.map(i => ({
            title: i.nombre,
            quantity: i.cantidad,
            price: i.precio,
            variant_title: i.talla || null,
            imagen: i.imagen || null,
            detalles: i.detalles || '',
          })),
          shipping_address: addr,
          customer: { first_name: nombre.split(' ')[0] || 'Cliente' },
          // Cambio #9: incluir la nota del draft para dirección estructurada
          note: shopifyResponse?._shopifyOrder?.note || '',
        };
        await enviarEmailConfirmacion(
          { ...orderParaEmail, email: emailCliente },
          null,
          totalConEnvio,
          false,
          'contraentrega',
          finalShippingCost,
        );
      } catch (emailErr) {
        console.error('Email COD no enviado:', emailErr.message);
      }

      await trackFunnelEvent({
        eventType: 'cod_order_created',
        source: 'backend',
        sessionId: String(funnelSessionId || '').trim() || null,
        userEmail: orderOwnerEmail,
        orderId: draftOrderId,
        amount: totalConEnvio,
        meta: { shopify_order_name: orderName, shopify_order_id: String(shopifyOrderId || '') },
      }).catch(() => {});

      return res.status(200).json({
        ok: true,
        orderName,
        shopify_order_id: String(shopifyOrderId || ''),
        nombre,
        email: emailCliente,
        subtotal: finalSubtotal,
        shippingCost: finalShippingCost,
        total: totalConEnvio,
      });
    } catch (err) {
      console.error('Error procesando pedido contra entrega:', err.message);
      try { await eliminarDraftOrder(draftOrderId); } catch {}
      return res.status(500).json({ error: err.message || 'No se pudo registrar el pedido contra entrega.' });
    }
  }

  const tokenPayload = verifyToken(req);
  const { form, cartItems, cartTotal, checkoutToken, draftOrderId, funnelSessionId, idempotencyKey } = req.body;
  const orderOwnerEmail = normalizeEmail(tokenPayload?.email || form?.email);
  const payerEmail = normalizeEmail(form?.email);
  const authUserId = String(tokenPayload?.userId || tokenPayload?.id || '').trim() || null;

  if (!form || !cartItems?.length || !draftOrderId || !cartTotal) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  if (!orderOwnerEmail) {
    return res.status(400).json({ error: 'No se pudo determinar el correo asociado al pedido.' });
  }
  if (!payerEmail) {
    return res.status(400).json({ error: 'Correo de pago invalido.' });
  }
  const checkoutAccess = getCheckoutAccess({ checkoutToken, draftOrderId, email: orderOwnerEmail });
  if (!checkoutAccess) {
    return res.status(403).json({ error: 'No autorizado para iniciar el pago de este pedido.' });
  }
  const shippingCost = Number(checkoutAccess.shippingCost || 0);

  const paymentPreferenceKey = buildPaymentPreferenceKey({
    idempotencyKey,
    draftOrderId,
    orderOwnerEmail,
  });

  const cachedPreference = getCachedPaymentPreference(paymentPreferenceKey);
  if (cachedPreference) {
    console.info(`[PAVOA] Preferencia MP reutilizada desde cache: ${paymentPreferenceKey}`);
    return res.status(200).json(markPreferenceAsReused(cachedPreference));
  }

  const inflightPreference = paymentPreferenceKey
    ? _paymentPreferenceInflight.get(paymentPreferenceKey)
    : null;
  if (inflightPreference) {
    console.info(`[PAVOA] Esperando preferencia MP en progreso: ${paymentPreferenceKey}`);
    const result = await inflightPreference;
    return res.status(result.statusCode).json(
      result.statusCode === 200 ? markPreferenceAsReused(result.payload) : result.payload
    );
  }

  const preferencePromise = createPaymentPreference({
    form,
    cartItems,
    cartTotal,
    shippingCost,
    draftOrderId,
    funnelSessionId,
    orderOwnerEmail,
    authUserId,
    paymentPreferenceKey,
  });

  if (paymentPreferenceKey) {
    _paymentPreferenceInflight.set(paymentPreferenceKey, preferencePromise);
  }

  try {
    const result = await preferencePromise;
    return res.status(result.statusCode).json(result.payload);
  } finally {
    if (paymentPreferenceKey) {
      _paymentPreferenceInflight.delete(paymentPreferenceKey);
    }
  }
}
