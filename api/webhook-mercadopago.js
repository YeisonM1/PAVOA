import mercadopago from 'mercadopago';
import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const client        = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const resend        = new Resend(process.env.RESEND_API_KEY);
const APP_URL       = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';
const LOGO_URL      = `${APP_URL}/logo-pavoa.png`;
const supabase      = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

let _tokenCache = { token: null, expiresAt: 0 };

const getShopifyToken = async () => {
  const now = Date.now();
  if (_tokenCache.token && _tokenCache.expiresAt - now > 120_000) {
    return _tokenCache.token;
  }
  const clientId     = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET no configurados');

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/oauth/access_token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    { method: 'POST' }
  );
  if (!res.ok) throw new Error(`Error obteniendo token Shopify: ${await res.text()}`);

  const data = await res.json();
  _tokenCache = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) * 1000 };
  return _tokenCache.token;
};

const validarFirma = (req) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true;

  const xSignature = req.headers['x-signature'] || '';
  const xRequestId = req.headers['x-request-id'] || '';
  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;

  const dataId    = req.body?.data?.id ?? '';
  const plantilla = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const hmac      = crypto.createHmac('sha256', secret).update(plantilla).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
  } catch {
    return false;
  }
};

const eliminarDraftOrder = async (draftOrderId) => {
  try {
    const token = await getShopifyToken();
    await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}.json`,
      {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': token },
      }
    );
    console.log(`🗑️ Draft order eliminado: ${draftOrderId}`);
  } catch (err) {
    console.error(`⚠️ No se pudo eliminar draft order ${draftOrderId}:`, err.message);
  }
};

const completarDraftOrder = async (draftOrderId) => {
  const token = await getShopifyToken();
  const base  = `https://${SHOPIFY_DOMAIN}/admin/api/2026-04`;

  // 1. Leer el email desde note_attributes (nunca está en el campo email
  //    del draft order — lo guardamos ahí desde pedido.js para que Shopify
  //    no tenga a quién enviar su notificación automática).
  const resDraft = await fetch(`${base}/draft_orders/${draftOrderId}.json`, {
    headers: { 'X-Shopify-Access-Token': token },
  });
  const { draft_order: draft } = await resDraft.json();
  const emailCliente = draft?.note_attributes?.find(a => a.name === 'customer_email')?.value || null;

  // 2. Completar el draft order (sin email → Shopify no puede notificar)
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
  const data  = await res.json();
  const order = data.draft_order || data.order;

  return { ...data, _emailCliente: emailCliente };
};

const enviarEmailConfirmacion = async (order, paymentId) => {
  const email     = order.email;
  if (!email) return;

  const firstName = order.shipping_address?.first_name || order.customer?.first_name || 'Cliente';
  const orderName = order.name || `#${order.order_number}`;
  const total     = Number(order.total_price).toLocaleString('es-CO');

  const lineItemsHTML = (order.line_items || []).map(item => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f5f0eb;">
        <p style="margin:0;font-size:12px;color:#0B0B0B;letter-spacing:0.05em;">${item.title}</p>
        ${item.variant_title && item.variant_title !== 'Default Title'
          ? `<p style="margin:4px 0 0;font-size:10px;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;">${item.variant_title}</p>`
          : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f5f0eb;text-align:center;font-size:11px;color:#6b7280;">
        × ${item.quantity}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f5f0eb;text-align:right;font-size:12px;color:#0B0B0B;font-weight:600;">
        $${Number(item.price).toLocaleString('es-CO')}
      </td>
    </tr>
  `).join('');

  const direccion = order.shipping_address
    ? `${order.shipping_address.address1}, ${order.shipping_address.address2 || ''} — ${order.shipping_address.city}`
    : '';

  await resend.emails.send({
    from:    'PAVOA <onboarding@resend.dev>',
    to:      email,
    subject: `Pedido confirmado ${orderName} — PAVOA`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#F2E4E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">

          <!-- HEADER CON LOGO -->
          <tr>
            <td align="center" style="padding:40px 40px 32px;border-bottom:1px solid #F2E4E1;">
              <img src="${LOGO_URL}" alt="PAVOA" width="120" style="display:block;height:auto;max-height:48px;object-fit:contain;" />
            </td>
          </tr>

          <!-- SALUDO -->
          <tr>
            <td style="padding:36px 40px 8px;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">Confirmación de pedido</p>
              <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                Hola, ${firstName}
              </h1>
              <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:20px;"></div>
              <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                Tu pago fue aprobado y tu pedido está confirmado. Pronto nos pondremos en contacto para coordinar la entrega.
              </p>
            </td>
          </tr>

          <!-- NÚMERO DE ORDEN -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:16px 20px;">
                <tr>
                  <td>
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 4px 0;">Número de pedido</p>
                    <p style="font-size:16px;font-weight:600;color:#0B0B0B;letter-spacing:0.1em;margin:0;">${orderName}</p>
                  </td>
                  <td align="right">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 4px 0;">Pago</p>
                    <p style="font-size:12px;color:#0B0B0B;letter-spacing:0.05em;margin:0;">MP #${paymentId}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PRODUCTOS -->
          <tr>
            <td style="padding:28px 40px 0;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#0B0B0B;text-transform:uppercase;margin:0 0 16px 0;font-weight:700;">Detalle del pedido</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${lineItemsHTML}
                <!-- TOTAL -->
                <tr>
                  <td colspan="2" style="padding-top:16px;">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0;">Total pagado</p>
                  </td>
                  <td style="padding-top:16px;text-align:right;">
                    <p style="font-size:18px;font-weight:700;color:#0B0B0B;margin:0;">$${total}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DIRECCIÓN -->
          ${direccion ? `
          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:10px;letter-spacing:0.3em;color:#0B0B0B;text-transform:uppercase;margin:0 0 10px 0;font-weight:700;">Dirección de entrega</p>
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">${direccion}</p>
              </div>
            </td>
          </tr>` : ''}

          <!-- MENSAJE FINAL -->
          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                  Si tienes alguna pregunta sobre tu pedido, escríbenos por WhatsApp y con gusto te ayudamos.
                </p>
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding:32px 40px 40px;">
              <div style="border-top:1px solid #F2E4E1;padding-top:28px;">
                <img src="${LOGO_URL}" alt="PAVOA" width="72" style="display:block;margin:0 auto 16px;height:auto;opacity:0.4;" />
                <p style="font-size:9px;letter-spacing:0.2em;color:#d1d5db;text-transform:uppercase;margin:0;">
                  © 2026 PAVOA. Todos los derechos reservados.
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `,
  });

  console.log(`📧 Email de confirmación enviado a: ${email} | orden: ${orderName}`);
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  if (!validarFirma(req)) {
    console.warn('⚠️ Webhook: firma inválida — descartando request');
    return res.status(200).send('OK');
  }

  const { type, data } = req.body;

  if (type !== 'payment' || !data?.id) {
    return res.status(200).send('OK');
  }

  try {
    const paymentClient = new mercadopago.Payment(client);
    const pagoInfo      = await paymentClient.get({ id: data.id });
    const [draftOrderId, emailRef, descuentoRef] = (pagoInfo.external_reference || '').split('|');

    if (!draftOrderId) {
      console.warn('⚠️ Webhook: pago sin external_reference', data.id);
      return res.status(200).send('OK');
    }

    console.log(`📩 Webhook | pago: ${data.id} | estado: ${pagoInfo.status} | draft: ${draftOrderId}`);

    if (pagoInfo.status === 'approved') {
      // Email real del cliente (del formulario de PAVOA, no de la cuenta MP)
      const emailMP    = emailRef || pagoInfo.payer?.email || null;
      const primerNombre = pagoInfo.payer?.first_name || 'Cliente';
      const itemsMP    = (pagoInfo.additional_info?.items || []).map(i => ({
        nombre:   i.title,
        cantidad: Number(i.quantity),
        precio:   i.unit_price,
      }));
      const totalMP    = pagoInfo.transaction_amount || 0;

      // Intentar completar la orden en Shopify (no bloquea si falla)
      let order        = null;
      let emailCliente = emailMP;
      try {
        const shopifyResponse = await completarDraftOrder(draftOrderId);
        order        = shopifyResponse.draft_order || shopifyResponse.order;
        emailCliente = shopifyResponse._emailCliente || emailMP;
        console.log(`✅ Orden completada en Shopify: ${draftOrderId}`);
      } catch (shopifyErr) {
        console.error(`⚠️ Shopify falló (no bloquea): ${shopifyErr.message}`);
      }

      // Guardar pedido en Supabase — siempre, con lo que haya
      if (emailCliente) {
        const itemsFinales = order?.line_items
          ? order.line_items.map(i => ({ nombre: i.title, cantidad: i.quantity, precio: i.price }))
          : itemsMP;
        const { error: sbError } = await supabase.from('pedidos').insert({
          email:              emailCliente.toLowerCase(),
          payment_id:         String(pagoInfo.id),
          shopify_order_name: order?.name || `MP-${pagoInfo.id}`,
          shopify_order_id:   String(order?.id || ''),
          total:              order ? Number(order.total_price || 0) : totalMP,
          status:             'approved',
          nombre:             order
            ? `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim()
            : primerNombre,
          items: itemsFinales,
        });
        if (sbError) console.error('⚠️ Error guardando pedido en Supabase:', sbError.message);
        else console.log(`💾 Pedido guardado en Supabase para: ${emailCliente}`);

        // Marcar descuento como usado — solo si el pago fue aprobado y se aplicó
        if (descuentoRef === '1') {
          const { error: descErr } = await supabase
            .from('usuarios')
            .update({ descuento_bienvenida_usado: true })
            .eq('email', emailCliente.toLowerCase());
          if (descErr) console.error('⚠️ Error marcando descuento:', descErr.message);
          else console.log(`🎁 Descuento bienvenida marcado como usado para: ${emailCliente}`);
        }
      }

      // Enviar email — siempre, con lo que haya
      try {
        const orderParaEmail = order
          ? { ...order, email: emailCliente || order.email }
          : {
              email:            emailCliente,
              name:             `MP-${pagoInfo.id}`,
              total_price:      totalMP,
              line_items:       (pagoInfo.additional_info?.items || []).map(i => ({
                title:         i.title,
                quantity:      i.quantity,
                price:         i.unit_price,
                variant_title: null,
              })),
              shipping_address: null,
              customer:         { first_name: primerNombre },
            };
        await enviarEmailConfirmacion(orderParaEmail, pagoInfo.id);
      } catch (emailErr) {
        console.error('⚠️ Email no enviado:', emailErr.message);
      }

    } else if (pagoInfo.status === 'rejected' || pagoInfo.status === 'cancelled') {
      console.log(`❌ Pago ${pagoInfo.status} | ID: ${data.id} | Draft: ${draftOrderId}`);
      await eliminarDraftOrder(draftOrderId);
    } else {
      console.log(`⏳ Pago ${pagoInfo.status} | ID: ${data.id} | Draft: ${draftOrderId}`);
    }

  } catch (error) {
    console.error('❌ Error en webhook:', error.message);
  }

  return res.status(200).send('OK');
}
