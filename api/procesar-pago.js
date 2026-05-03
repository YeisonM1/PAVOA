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

const APP_URL      = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;

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
  try { data = JSON.parse(raw); } catch {}
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const envError = requiredEnvError();
  if (envError) {
    console.error('❌ Configuración incompleta en /api/procesar-pago:', envError);
    return res.status(500).json({ error: envError });
  }

  // Diagnostico guiado para soporte (sin consola)
  if (req.body?.type === 'mp-diagnostico') {
    const preferenceId = String(req.body?.preferenceId || '').trim();
    const userInfo = await mpFetchJson('https://api.mercadopago.com/users/me');
    const preferenceInfo = preferenceId
      ? await mpFetchJson(`https://api.mercadopago.com/checkout/preferences/${encodeURIComponent(preferenceId)}`)
      : { ok: false, status: 400, error: 'No se recibio preferenceId', data: null };

    return res.status(200).json({
      ok: true,
      diagnostico: {
        now: new Date().toISOString(),
        mp_user: userInfo.ok ? {
          id: userInfo.data?.id,
          nickname: userInfo.data?.nickname,
          site_id: userInfo.data?.site_id,
          country_id: userInfo.data?.country_id,
          status: userInfo.data?.status,
        } : {
          error: userInfo.error,
          status: userInfo.status,
        },
        preference: preferenceInfo.ok ? {
          id: preferenceInfo.data?.id,
          collector_id: preferenceInfo.data?.collector_id,
          init_point: preferenceInfo.data?.init_point,
          sandbox_init_point: preferenceInfo.data?.sandbox_init_point,
          external_reference: preferenceInfo.data?.external_reference,
          date_created: preferenceInfo.data?.date_created,
          expiration_date_to: preferenceInfo.data?.expiration_date_to,
        } : {
          error: preferenceInfo.error,
          status: preferenceInfo.status,
        },
      },
    });
  }

  const { form, cartItems, cartTotal, draftOrderId } = req.body;

  if (!form || !cartItems?.length || !draftOrderId || !cartTotal) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const preferenceClient = new mercadopago.Preference(client);

    const { trustedItems, total } = await validateCartWithShopify(cartItems);
    if (Math.abs(Number(cartTotal) - total) > 1) {
      await eliminarDraftOrder(draftOrderId);
      return res.status(409).json({ error: 'El precio del carrito cambio. Actualiza la bolsa e intenta de nuevo.' });
    }

    let itemsMapped = trustedItems.map(item => ({
      id:          String(item.variantId),
      title:       item.title,
      quantity:    item.quantity,
      unit_price:  item.unitPrice,
      currency_id: 'COP',
    }));

    // Verificar descuento de bienvenida — solo aplica al precio, NO marca en Supabase todavía
    let descuentoAplicado = false;
    try {
      const { data: usuario } = await supabase
        .from('usuarios')
        .select('descuento_bienvenida_usado')
        .eq('email', form.email.toLowerCase())
        .eq('email_verified', true)
        .single();

      if (usuario && !usuario.descuento_bienvenida_usado) {
        itemsMapped = itemsMapped.map(item => ({
          ...item,
          unit_price: Math.round(item.unit_price * 0.9),
        }));
        descuentoAplicado = true;
        console.log(`🎁 Descuento bienvenida 10% aplicado a: ${form.email}`);
      }
    } catch (descErr) {
      console.warn('⚠️ No se pudo verificar descuento:', descErr.message);
    }

    // Aplicar descuento en el draft order de Shopify para que quede registrado
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
        console.log(`🏷️ Descuento aplicado en Shopify draft order: ${draftOrderId}`);
      } catch (shopifyErr) {
        console.warn('⚠️ No se pudo aplicar descuento en Shopify:', shopifyErr.message);
      }
    }

    // El flag se guarda en external_reference para que el webhook lo marque
    // solo cuando el pago sea confirmado (approved)
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
        auto_return:          'approved',
        external_reference:   externalRef,
        notification_url:     `${APP_URL}/api/webhook-mercadopago`,
        statement_descriptor: 'PAVOA',
      },
    });

    console.log(
      `✅ Preferencia MP creada: ${preference.id} | collector: ${preference.collector_id} | live_mode: ${preference.live_mode} | draft: ${draftOrderId} | descuento: ${descuentoAplicado}`
    );

    return res.status(200).json({
      ok: true,
      init_point: preference.init_point,
      descuento_aplicado: descuentoAplicado,
      debug: {
        preference_id: preference.id,
        collector_id: preference.collector_id,
        live_mode: preference.live_mode,
      },
    });

  } catch (error) {
    console.error('❌ Error creando preferencia MP:', error?.message);
    await eliminarDraftOrder(draftOrderId);
    return res.status(500).json({ error: error?.message || 'Error al crear la preferencia de pago' });
  }
}
