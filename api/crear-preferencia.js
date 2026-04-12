import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const APP_URL = process.env.VITE_APP_URL || 'https://tu-dominio.com'; // Cambia en producción

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { draftOrderId, cartItems, form } = req.body;

  try {
    // Transformar productos del carrito al formato de Mercado Pago
    const items = cartItems.map(item => ({
      id: String(item.producto.id),
      title: `${item.producto.nombre} - Talla: ${item.talla}`,
      quantity: Number(item.cantidad),
      unit_price: Number(item.producto.precioNumerico ?? parseInt(String(item.producto.precio).replace(/[$,.]/g, ''), 10)),
      currency_id: 'COP',
    }));

    const body = {
      items,
      external_reference: String(draftOrderId), // CLAVE: Conectamos MP con Shopify
      payer: {
        name: form.nombre,
        email: form.email || 'cliente@sin-correo.com',
        phone: { area_code: '57', number: form.telefono.replace(/\D/g, '') },
      },
      back_urls: {
        success: `${APP_URL}/checkout/success`,
        failure: `${APP_URL}/checkout`,
        pending: `${APP_URL}/checkout`,
      },
      auto_return: 'approved',
    };

    const preference = new Preference(client);
    const result = await preference.create({ body });

    return res.status(200).json({ init_point: result.init_point });
  } catch (error) {
    console.error('Error creando preferencia MP:', error);
    return res.status(500).json({ error: 'Error al generar el pago' });
  }
}