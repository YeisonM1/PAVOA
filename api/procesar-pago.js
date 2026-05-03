import mercadopago from 'mercadopago';
import { createClient } from '@supabase/supabase-js';
import { getShopifyToken, eliminarDraftOrder } from './_helpers/shopify-token.js';
import { validateCartWithShopify } from './_helpers/cart-validation.js';

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const MP_EXPECTED_USER_ID = String(
  process.env.MP_EXPECTED_USER_ID || process.env.MP_SELLER_USER_ID || ''
).trim();

const requiredEnvError = () => {
  if (!process.env.MP_ACCESS_TOKEN) return 'Falta MP_ACCESS_TOKEN en variables de entorno de Vercel.';
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const envError = requiredEnvError();
  if (envError) {
    console.error('Configuracion incompleta en /api/procesar-pago:', envError);
    return res.status(500).json({ error: envError });
  }

  if (req.body?.type === 'mp-diagnostico') {
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
    if (!draftOrderId) {
      return res.status(400).json({ error: 'Falta draftOrderId' });
    }

    await eliminarDraftOrder(draftOrderId);
    return res.status(200).json({ ok: true, draftOrderId });
  }

  const { form, cartItems, cartTotal, draftOrderId } = req.body;

  if (!form || !cartItems?.length || !draftOrderId || !cartTotal) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const sellerCheck = await validateExpectedSeller();
    if (!sellerCheck.ok) {
      return res.status(sellerCheck.status || 409).json({
        error: sellerCheck.error,
        detail: sellerCheck.detail || null,
      });
    }

    const preferenceClient = new mercadopago.Preference(client);

    const { trustedItems, total } = await validateCartWithShopify(cartItems);
    if (Math.abs(Number(cartTotal) - total) > 1) {
      await eliminarDraftOrder(draftOrderId);
      return res.status(409).json({ error: 'El precio del carrito cambio. Actualiza la bolsa e intenta de nuevo.' });
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
        .eq('email', form.email.toLowerCase())
        .eq('email_verified', true)
        .single();

      if (usuario && !usuario.descuento_bienvenida_usado) {
        itemsMapped = itemsMapped.map((item) => ({
          ...item,
          unit_price: Math.round(item.unit_price * 0.9),
        }));
        descuentoAplicado = true;
        console.log(`Descuento bienvenida 10% aplicado a: ${form.email}`);
      }
    } catch (descErr) {
      console.warn('No se pudo verificar descuento:', descErr.message);
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

    const externalRef = `${draftOrderId}|${form.email.toLowerCase()}|${descuentoAplicado ? '1' : '0'}`;

    const preference = await preferenceClient.create({
      body: {
        items: itemsMapped,
        payer: { email: form.email },
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

    const checkoutUrl = preference.sandbox_init_point || preference.init_point;
    const checkoutMode = preference.sandbox_init_point ? 'sandbox' : 'live';

    console.log(
      `Preferencia MP creada: ${preference.id} | collector: ${preference.collector_id} | live_mode: ${preference.live_mode} | checkout_mode: ${checkoutMode} | draft: ${draftOrderId} | descuento: ${descuentoAplicado}`
    );

    return res.status(200).json({
      ok: true,
      init_point: checkoutUrl,
      descuento_aplicado: descuentoAplicado,
      debug: {
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
      },
    });
  } catch (error) {
    console.error('Error creando preferencia MP:', error?.message);
    await eliminarDraftOrder(draftOrderId);
    return res.status(500).json({ error: error?.message || 'Error al crear la preferencia de pago' });
  }
}
