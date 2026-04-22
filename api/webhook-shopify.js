import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const SHOPIFY_DOMAIN      = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const SHOPIFY_SECRET      = process.env.SHOPIFY_WEBHOOK_SECRET;
const supabase            = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
const resend              = new Resend(process.env.RESEND_API_KEY);
const APP_URL             = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';
const LOGO_URL            = `${APP_URL}/logo-pavoa.png`;

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
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const topic      = req.headers['x-shopify-topic']        || '';
  const hmacHeader = req.headers['x-shopify-hmac-sha256']  || '';
  const rawBody    = JSON.stringify(req.body);

  // Firma: Vercel re-parsea el body y rompe el HMAC — procesamos siempre
  validarFirma(rawBody, hmacHeader);

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
            await resend.emails.send({
              from:    'PAVOA <onboarding@resend.dev>',
              to:      pedido.email,
              subject: `Tu pedido ${orderName} ha llegado — PAVOA`,
              html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F2E4E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">

          <tr>
            <td align="center" style="padding:40px 40px 32px;border-bottom:1px solid #F2E4E1;">
              <img src="${LOGO_URL}" alt="PAVOA" width="120" style="display:block;height:auto;max-height:48px;object-fit:contain;" />
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 8px;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">Pedido entregado</p>
              <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                Hola, ${nombreCliente}
              </h1>
              <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:20px;"></div>
              <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                Tu pedido <strong>${orderName}</strong> ha sido entregado. Esperamos que lo disfrutes mucho.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:24px;">
                <tr>
                  <td align="center">
                    <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 10px 0;">Número de pedido</p>
                    <p style="font-size:20px;font-weight:700;color:#0B0B0B;letter-spacing:0.15em;margin:0;">${orderName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                  Gracias por confiar en PAVOA. Si tienes alguna duda sobre tu pedido no dudes en contactarnos.
                </p>
              </div>
            </td>
          </tr>

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
</html>`,
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
      .select('email, shopify_order_name, nombre, tracking_number')
      .eq('shopify_order_id', shopifyOrderId)
      .single();

    // Si ya está marcado como entregado, no sobreescribir el estado
    if (esEntregado) return res.status(200).send('OK');

    // ── Caso 1: fulfillment cancelado — limpiar guía ────────
    if (fulfillmentStatus === 'unfulfilled' && !trackingNumber) {
      const { error } = await supabase
        .from('pedidos')
        .update({ fulfillment_status: 'unfulfilled', tracking_number: null, tracking_company: null, tracking_url: null })
        .eq('shopify_order_id', shopifyOrderId);
      if (error) console.error('⚠️ Error limpiando guía:', error.message);
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
        console.error('⚠️ Error actualizando fulfillment:', error.message);
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
        await resend.emails.send({
          from:    'PAVOA <onboarding@resend.dev>',
          to:      pedidoActual.email,
          subject: `${encabezado} ${orderName} — PAVOA`,
          html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#F2E4E1;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#ffffff;">

          <tr>
            <td align="center" style="padding:40px 40px 32px;border-bottom:1px solid #F2E4E1;">
              <img src="${LOGO_URL}" alt="PAVOA" width="120" style="display:block;height:auto;max-height:48px;object-fit:contain;" />
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 8px;">
              <p style="font-size:10px;letter-spacing:0.3em;color:#9ca3af;text-transform:uppercase;margin:0 0 12px 0;">${subtitulo}</p>
              <h1 style="font-size:22px;font-weight:300;color:#0B0B0B;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 16px 0;">
                Hola, ${nombreCliente}
              </h1>
              <div style="width:32px;height:1px;background-color:#DFCDB4;margin-bottom:20px;"></div>
              <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">${cuerpo}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2E4E1;padding:20px;">
                <tr>
                  <td>
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 6px 0;">Transportadora</p>
                    <p style="font-size:15px;font-weight:600;color:#0B0B0B;letter-spacing:0.05em;margin:0;">${trackingCompany}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:16px;">
                    <p style="font-size:10px;letter-spacing:0.2em;color:#9ca3af;text-transform:uppercase;margin:0 0 6px 0;">Número de guía</p>
                    <p style="font-size:20px;font-weight:700;color:#0B0B0B;letter-spacing:0.1em;margin:0;">${trackingNumber}</p>
                  </td>
                </tr>
                ${trackingUrl ? `
                <tr>
                  <td style="padding-top:20px;">
                    <a href="${trackingUrl}" style="display:inline-block;background-color:#0B0B0B;color:#ffffff;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:12px 24px;">
                      Rastrear pedido →
                    </a>
                  </td>
                </tr>` : ''}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:28px 40px 0;">
              <div style="border-top:1px solid #F2E4E1;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;line-height:1.8;margin:0;">
                  También puedes ver el estado de tu pedido en cualquier momento desde tu cuenta en PAVOA.
                </p>
              </div>
            </td>
          </tr>

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
</html>`,
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
