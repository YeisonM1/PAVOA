import mercadopago from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const APP_URL = process.env.VITE_APP_URL || 'https://pavoa.vercel.app';

const parsePrecio = (precioNumerico, precioStr) => {
  if (typeof precioNumerico === 'number' && precioNumerico > 0) return Math.round(precioNumerico);
  if (typeof precioStr === 'string') return Number(precioStr.replace(/[^0-9]/g, '')) || 0;
  return 0;
};

const eliminarDraftOrder = async (draftOrderId) => {
  try {
    await fetch(
      `https://${process.env.SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}.json`,
      {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN },
      }
    );
    console.log(`🗑️ Draft order eliminado: ${draftOrderId}`);
  } catch (err) {
    console.error(`⚠️ No se pudo eliminar draft order ${draftOrderId}:`, err.message);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { form, cartItems, cartTotal, draftOrderId } = req.body;

  if (!form || !cartItems?.length || !draftOrderId || !cartTotal) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  try {
    const preferenceClient = new mercadopago.Preference(client);

    let itemsMapped = cartItems.map(item => ({
      id:          String(item.producto.id),
      title:       item.producto.nombre,
      quantity:    Number(item.cantidad),
      unit_price:  parsePrecio(item.producto.precioNumerico, item.producto.precio),
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

    console.log(`✅ Preferencia MP creada: ${preference.id} | draft: ${draftOrderId} | descuento: ${descuentoAplicado}`);

    return res.status(200).json({ ok: true, init_point: preference.init_point, descuento_aplicado: descuentoAplicado });

  } catch (error) {
    console.error('❌ Error creando preferencia MP:', error?.message);
    await eliminarDraftOrder(draftOrderId);
    return res.status(500).json({ error: error?.message || 'Error al crear la preferencia de pago' });
  }
}
