import mercadopago from 'mercadopago';
import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { getShopifyToken, eliminarDraftOrder } from './_helpers/shopify-token.js';
import { emailConfirmacion } from './_helpers/email-templates.js';

const client        = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;
const resend        = new Resend(process.env.RESEND_API_KEY);
const supabase      = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

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

const enviarEmailConfirmacion = async (order, paymentId, totalReal, descuentoAplicado = false) => {
  const email = order.email;
  if (!email) return;

  const firstName = order.shipping_address?.first_name || order.customer?.first_name || 'Cliente';
  const orderName = order.name || `#${order.order_number}`;
  const total     = Number(totalReal || order.total_price).toLocaleString('es-CO');
  const totalOriginal = descuentoAplicado ? Math.round(Number(totalReal || order.total_price) / 0.9).toLocaleString('es-CO') : null;
  const direccion = order.shipping_address
    ? `${order.shipping_address.address1}, ${order.shipping_address.address2 || ''} — ${order.shipping_address.city}`
    : '';

  await resend.emails.send({
    from:    'PAVOA <onboarding@resend.dev>',
    to:      email,
    subject: `Pedido confirmado ${orderName} — PAVOA`,
    html:    emailConfirmacion({ firstName, orderName, paymentId, lineItems: order.line_items, total, totalOriginal, descuentoAplicado, direccion }),
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

      const esDescuento    = descuentoRef === '1';
      const totalPagado    = pagoInfo.transaction_amount || totalMP;
      const totalOriginalV = esDescuento ? Math.round(totalPagado / 0.9) : totalPagado;

      // Intentar completar la orden en Shopify (no bloquea si falla)
      let order        = null;
      let emailCliente = emailMP;
      try {
        const shopifyResponse = await completarDraftOrder(draftOrderId);
        order        = shopifyResponse.draft_order || shopifyResponse.order;
        emailCliente = shopifyResponse._emailCliente || emailMP;
        console.log(`✅ Orden completada en Shopify: ${draftOrderId}`);
        await eliminarDraftOrder(draftOrderId);
      } catch (shopifyErr) {
        console.error(`⚠️ Shopify falló (no bloquea): ${shopifyErr.message}`);
      }

      // Guardar pedido en Supabase — siempre, con lo que haya
      if (emailCliente) {
        const itemsFinales = order?.line_items
          ? order.line_items.map(i => ({ nombre: i.title, cantidad: i.quantity, precio: i.price }))
          : itemsMP;
        const addr = order?.shipping_address;
        const { error: sbError } = await supabase.from('pedidos').insert({
          email:               emailCliente.toLowerCase(),
          payment_id:          String(pagoInfo.id),
          shopify_order_name:  order?.name || `MP-${pagoInfo.id}`,
          shopify_order_id:    String(order?.order_id || order?.id || ''),
          total:               totalPagado,
          total_original:      totalOriginalV,
          descuento_aplicado:  esDescuento,
          status:              'approved',
          fulfillment_status:  'unfulfilled',
          nombre:              addr
            ? `${addr.first_name || ''} ${addr.last_name || ''}`.trim()
            : primerNombre,
          telefono:            addr?.phone || order?.phone || '',
          ciudad:              addr?.city || '',
          direccion:           addr ? [addr.address1, addr.address2].filter(Boolean).join(', ') : '',
          items:               itemsFinales,
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
              total_price:      totalPagado,
              line_items:       (pagoInfo.additional_info?.items || []).map(i => ({
                title:         i.title,
                quantity:      i.quantity,
                price:         i.unit_price,
                variant_title: null,
              })),
              shipping_address: null,
              customer:         { first_name: primerNombre },
            };
        await enviarEmailConfirmacion(orderParaEmail, pagoInfo.id, totalPagado, esDescuento);
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
