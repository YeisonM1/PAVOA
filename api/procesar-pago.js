import mercadopago from 'mercadopago';

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

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

    const preference = await preferenceClient.create({
      body: {
        items: cartItems.map(item => ({
          id:          String(item.producto.id),
          title:       item.producto.nombre,
          quantity:    Number(item.cantidad),
          unit_price:  parsePrecio(item.producto.precioNumerico, item.producto.precio),
          currency_id: 'COP',
        })),
        payer: {
          name:    form.nombre.split(' ')[0],
          surname: form.nombre.split(' ').slice(1).join(' ') || '-',
          email:   form.email,
          phone: {
            area_code: '57',
            number:    form.telefono.replace(/\D/g, '').slice(0, 10),
          },
          address: {
            street_name: form.direccion,
            city:        form.ciudad,
          },
        },
        back_urls: {
          success: `${APP_URL}/orden-confirmada`,
          failure: `${APP_URL}/checkout`,
          pending: `${APP_URL}/orden-confirmada`,
        },
        auto_return:          'approved',
        external_reference:   String(draftOrderId),
        notification_url:     `${APP_URL}/api/webhook-mercadopago`,
        statement_descriptor: 'PAVOA',
      },
    });

    const itemsLog = cartItems.map(item => ({
      nombre:          item.producto.nombre,
      precioNumerico:  item.producto.precioNumerico,
      precio:          item.producto.precio,
      unit_price_enviado: parsePrecio(item.producto.precioNumerico, item.producto.precio),
    }));
    console.log('📦 Items enviados a MP:', JSON.stringify(itemsLog));
    console.log(`✅ Preferencia MP creada: ${preference.id} | init_point: ${preference.init_point} | draft: ${draftOrderId}`);

    return res.status(200).json({ ok: true, init_point: preference.init_point });

  } catch (error) {
    console.error('❌ Error creando preferencia MP:', error?.message);
    await eliminarDraftOrder(draftOrderId);
    return res.status(500).json({ error: error?.message || 'Error al crear la preferencia de pago' });
  }
}
