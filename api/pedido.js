import { getShopifyToken } from './_helpers/shopify-token.js';
import { CartValidationError, validateCartWithShopify } from './_helpers/cart-validation.js';
import { signCheckoutToken, verifyToken } from './_helpers/auth.js';
import { trackFunnelEvent } from './_helpers/funnel.js';
import {
  claimIdempotency,
  clearIdempotency,
  completeIdempotency,
  consumeRateLimit,
  failIdempotency,
  getClientIp,
  hashSecurityValue,
  waitForIdempotency,
} from './_helpers/durable-security.js';

const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const DEFAULT_NATIONAL_SHIPPING = 18900;
const BOGOTA_SHIPPING = 10000;

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const requiredEnvError = () => {
  if (!SHOPIFY_DOMAIN) return 'Falta VITE_SHOPIFY_DOMAIN en variables de entorno de Vercel.';
  if (!process.env.SHOPIFY_ADMIN_TOKEN && !process.env.SHOPIFY_CLIENT_ID) {
    return 'Falta SHOPIFY_ADMIN_TOKEN o SHOPIFY_CLIENT_ID en variables de entorno de Vercel.';
  }
  if (!process.env.SHOPIFY_ADMIN_TOKEN && !process.env.SHOPIFY_CLIENT_SECRET) {
    return 'Falta SHOPIFY_ADMIN_TOKEN o SHOPIFY_CLIENT_SECRET en variables de entorno de Vercel.';
  }
  if (!process.env.JWT_SECRET) return 'Falta JWT_SECRET en variables de entorno de Vercel.';
  return null;
};

// Rate limiter: 10 pedidos por IP cada 15 minutos
const PEDIDO_LIMIT = 10;
const PEDIDO_WINDOW = 15 * 60 * 1000;

// Cache de idempotencia: evita crear un Draft Order duplicado si el mismo request llega dos veces
const IDEM_TTL = 30 * 60 * 1000; // 30 minutos
const IDEM_SCOPE = 'draft-order';

const parseShopifyError = (message = '') => {
  try {
    const parsed = JSON.parse(message);
    return parsed?.errors || parsed?.error || parsed?.draft_order || parsed || message;
  } catch {
    return message;
  }
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

const obtenerDraftOrder = async (token, draftOrderId) => {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}.json`,
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
    }
  );

  if (res.status === 404) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data.draft_order || null;
};

const cachedDraftOrderStillExists = async (draftOrderId) => {
  for (const preferredToken of ['app', 'admin']) {
    try {
      const token = await getShopifyToken(preferredToken);
      const draftOrder = await obtenerDraftOrder(token, draftOrderId);
      if (preferredToken === 'admin') {
        console.warn('[PAVOA] Draft Order validado usando fallback con SHOPIFY_ADMIN_TOKEN.');
      }
      return Boolean(draftOrder);
    } catch (tokenErr) {
      console.warn(`[PAVOA] Fallo validando draft cacheado con token ${preferredToken}:`, tokenErr.message);
    }
  }

  return false;
};

const buildCheckoutResponse = ({ draftOrderId, name, shippingCost }, orderOwnerEmail) => ({
  ok: true,
  draftOrderId,
  name,
  shippingCost: Number(shippingCost || 0),
  checkoutToken: signCheckoutToken({
    draftOrderId,
    email: orderOwnerEmail,
    shippingCost,
  }),
});

const normalizeCity = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

export const isBogotaDestination = ({ city, department } = {}) => {
  const normalizedDepartment = normalizeCity(department).replace(/[^a-z]/g, '');
  return normalizeCity(city) === 'bogota'
    && ['bogotadc', 'distritocapital'].includes(normalizedDepartment);
};

const getServerShippingCost = async (token, { city, department }) => {
  if (isBogotaDestination({ city, department })) return BOGOTA_SHIPPING;

  try {
    const response = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query: `query ShippingPrice { shop { metafield(namespace: "pavoa_envios", key: "precio_envio") { value } } }`,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    const configured = Number(payload?.data?.shop?.metafield?.value);
    if (response.ok && Number.isFinite(configured) && configured > 0) return configured;
  } catch (error) {
    console.warn('[PAVOA] No se pudo consultar el envio configurado:', error.message);
  }

  return DEFAULT_NATIONAL_SHIPPING;
};

const crearDraftOrder = async (token, { form, trustedItems, orderOwnerEmail, checkoutEmail, shippingCost, esCod = false }) => {
  const lineItems = trustedItems.map((item) => ({
    variant_id: item.variantId,
    quantity: item.quantity,
  }));
  const direccionEntrega = String(form?.direccion || form?.['dirección'] || '').trim();

  const nota = [
    `Horario de entrega: ${form.horario}`,
    form.referencia ? `Punto de referencia: ${form.referencia}` : '',
    `Barrio: ${form.barrio}`,
    form.observaciones ? `Observaciones: ${form.observaciones}` : '',
  ].filter(Boolean).join(' | ');

  const [firstName, ...rest] = form.nombre.trim().split(' ');
  const lastName = rest.join(' ') || '-';
  const telFormateado = `+57${form.telefono.replace(/\D/g, '')}`;

  const body = {
    draft_order: {
      email: checkoutEmail || orderOwnerEmail || '',
      line_items: lineItems,
      phone: telFormateado,
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        phone: telFormateado,
        address1: direccionEntrega,
        address2: form.barrio,
        city: form.ciudad,
        province: form.departamento || form.ciudad,
        country: 'Colombia',
        country_code: 'CO',
        zip: '',
      },
      billing_address: {
        first_name: firstName,
        last_name: lastName,
        phone: telFormateado,
        address1: direccionEntrega,
        address2: form.barrio,
        city: form.ciudad,
        province: form.departamento || form.ciudad,
        country: 'Colombia',
        country_code: 'CO',
        zip: '',
      },
      shipping_line: shippingCost > 0 ? {
        title: 'Envío a domicilio',
        price: String(shippingCost),
        custom: true,
      } : undefined,
      note: nota,
      tags: esCod ? 'pavoa-web,contraentrega' : 'pavoa-web,mercadopago',
      send_receipt: false,
      note_attributes: [
        { name: 'customer_email', value: checkoutEmail || '' },
        { name: 'payer_email', value: checkoutEmail || '' },
        { name: 'account_email', value: orderOwnerEmail || '' },
        { name: 'customer_name', value: form.nombre || '' },
        { name: 'cart_items', value: JSON.stringify(trustedItems.map((item) => ({
          nombre: item.title,
          talla: item.talla || '',
          color: item.color || '',
          cantidad: item.quantity,
          precio: `$${Number(item.unitPrice).toLocaleString('es-CO')}`,
          imagen: item.image || '',
          detalles: item.details || '',
        }))) },
      ],
    },
  };

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!data.draft_order) throw new Error(JSON.stringify(data));
  return data.draft_order;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const envError = requiredEnvError();
  if (envError) {
    console.error('[PAVOA] Configuracion incompleta en /api/pedido:', envError);
    return res.status(500).json({ error: envError });
  }

  const rateLimit = await consumeRateLimit({
    scope: 'create-order',
    identifier: getClientIp(req),
    limit: PEDIDO_LIMIT,
    windowMs: PEDIDO_WINDOW,
  });
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfter));
    return res.status(429).json({ error: 'Demasiados pedidos. Espera 15 minutos e intenta de nuevo.' });
  }

  const tokenPayload = verifyToken(req);
  const { form, cartItems, cartTotal, paymentMethod, idempotencyKey, funnelSessionId } = req.body;
  const normalizedIdempotencyKey = String(idempotencyKey || '').trim().slice(0, 512);
  const esCod = String(paymentMethod || '').toLowerCase() === 'cod';
  const orderOwnerEmail = normalizeEmail(tokenPayload?.email || form?.email);
  const checkoutEmail = normalizeEmail(form?.email);
  const authUserId = String(tokenPayload?.userId || tokenPayload?.id || '').trim() || null;

  if (!form?.nombre?.trim() || !form?.telefono?.trim()) {
    return res.status(400).json({ error: 'Nombre y telefono son requeridos' });
  }
  if (!orderOwnerEmail) {
    return res.status(400).json({ error: 'Correo requerido para asociar el pedido.' });
  }
  if (!checkoutEmail) {
    return res.status(400).json({ error: 'Correo de pago requerido.' });
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'El carrito esta vacio' });
  }

  const orderOwnerHash = hashSecurityValue('order-owner', orderOwnerEmail);
  const durableIdempotencyKey = normalizedIdempotencyKey
    ? `${orderOwnerHash}:${normalizedIdempotencyKey}`
    : '';

  let idempotencyClaim = null;
  if (durableIdempotencyKey) {
    idempotencyClaim = await claimIdempotency({
      scope: IDEM_SCOPE,
      key: durableIdempotencyKey,
      ttlMs: IDEM_TTL,
    });

    if (!idempotencyClaim?.claimed) {
      const record = idempotencyClaim?.state === 'processing'
        ? await waitForIdempotency({ scope: IDEM_SCOPE, key: durableIdempotencyKey })
        : idempotencyClaim;
      const cached = record?.state === 'completed' ? record.response : null;

      if (cached?.ownerHash === orderOwnerHash
        && cached?.draftOrderId
        && await cachedDraftOrderStillExists(cached.draftOrderId)) {
        console.log(`Draft Order reutilizado (idempotency): ${cached.name}`);
        return res.status(200).json(buildCheckoutResponse(cached, orderOwnerEmail));
      }

      if (record?.state !== 'processing') {
        await clearIdempotency({ scope: IDEM_SCOPE, key: durableIdempotencyKey });
        idempotencyClaim = await claimIdempotency({
          scope: IDEM_SCOPE,
          key: durableIdempotencyKey,
          ttlMs: IDEM_TTL,
        });
      }

      if (!idempotencyClaim?.claimed) {
        res.setHeader('Retry-After', '2');
        return res.status(409).json({
          error: 'Tu pedido ya se esta procesando. Espera un momento antes de intentar nuevamente.',
          retryable: true,
        });
      }
    }
  }

  try {
    const shippingPromise = (async () => {
      const token = await getShopifyToken('app');
      return getServerShippingCost(token, {
        city: form?.ciudad,
        department: form?.departamento,
      });
    })().catch(() => DEFAULT_NATIONAL_SHIPPING);

    const [{ trustedItems }, serverShippingCost] = await Promise.all([
      validateCartWithShopify(cartItems),
      shippingPromise,
    ]);

    let draftOrder = null;
    let lastError = null;

    for (const preferredToken of ['app', 'admin']) {
      try {
        const token = await getShopifyToken(preferredToken);
        draftOrder = await crearDraftOrder(token, { form, trustedItems, orderOwnerEmail, checkoutEmail, shippingCost: serverShippingCost, esCod });
        if (preferredToken === 'admin') {
          console.warn('[PAVOA] Draft Order creado usando fallback con SHOPIFY_ADMIN_TOKEN.');
        }
        break;
      } catch (tokenErr) {
        lastError = tokenErr;
        console.warn(`[PAVOA] Fallo creando draft con token ${preferredToken}:`, tokenErr.message);
      }
    }

    if (!draftOrder) {
      throw lastError || new Error('No se pudo crear el draft order con ningun token de Shopify.');
    }

    const stableResponse = {
      draftOrderId: draftOrder.id,
      name: draftOrder.name,
      shippingCost: serverShippingCost,
      ownerHash: orderOwnerHash,
    };

    if (durableIdempotencyKey && idempotencyClaim?.claimed) {
      await completeIdempotency({
        scope: IDEM_SCOPE,
        key: durableIdempotencyKey,
        claimToken: idempotencyClaim.claimToken,
        response: stableResponse,
        ttlMs: IDEM_TTL,
      });
    }

    const checkoutResponse = buildCheckoutResponse(stableResponse, orderOwnerEmail);

    const singleItem = getSingleCartItem(cartItems);
    await trackFunnelEvent({
      eventKey: `draft_order_created:${draftOrder.id}`,
      eventType: 'draft_order_created',
      source: 'backend',
      sessionId: String(funnelSessionId || '').trim() || null,
      userId: authUserId,
      userEmail: orderOwnerEmail,
      productId: singleItem?.productId || null,
      productName: singleItem?.productName || null,
      variantId: singleItem?.variantId || null,
      color: singleItem?.color || null,
      size: singleItem?.size || null,
      orderId: String(draftOrder.id),
      amount: cartTotal || null,
      meta: {
        shopify_order_name: draftOrder.name || null,
        line_count: trustedItems.length,
        item_count: trustedItems.reduce((total, item) => total + Number(item.quantity || 0), 0),
        line_items: buildCartSummary(cartItems),
      },
    }).catch((error) => {
      console.warn('[PAVOA] No se pudo registrar draft_order_created:', error.message);
    });

    console.log(`Draft Order creado: ${draftOrder.name} - ${draftOrder.id}`);
    return res.status(200).json(checkoutResponse);
  } catch (err) {
    if (durableIdempotencyKey && idempotencyClaim?.claimed) {
      await failIdempotency({
        scope: IDEM_SCOPE,
        key: durableIdempotencyKey,
        claimToken: idempotencyClaim.claimToken,
      });
    }

    await trackFunnelEvent({
      eventType: 'draft_order_failed',
      source: 'backend',
      sessionId: String(funnelSessionId || '').trim() || null,
      userId: authUserId,
      userEmail: orderOwnerEmail,
      productId: getSingleCartItem(cartItems)?.productId || null,
      productName: getSingleCartItem(cartItems)?.productName || null,
      variantId: getSingleCartItem(cartItems)?.variantId || null,
      color: getSingleCartItem(cartItems)?.color || null,
      size: getSingleCartItem(cartItems)?.size || null,
      amount: cartTotal || null,
      meta: {
        detail: parseShopifyError(err.message),
        line_count: Array.isArray(cartItems) ? cartItems.length : 0,
        line_items: buildCartSummary(cartItems),
      },
    }).catch(() => {});
    console.error('Error creando draft order:', err.message);
    if (err instanceof CartValidationError) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({
      error: 'No pudimos registrar tu pedido. Intenta de nuevo en unos minutos.',
    });
  }
}
