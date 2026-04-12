import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;
const SHOPIFY_TOKEN = process.env.VITE_SHOPIFY_TOKEN; // O el access token estático de tu admin API

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { type, data } = req.body;

  // Solo nos interesan los eventos de pagos
  if (type === 'payment' && data?.id) {
    try {
      // 1. Consultar el estado real del pago a Mercado Pago (seguridad)
      const paymentClient = new Payment(client);
      const pagoInfo = await paymentClient.get({ id: data.id });

      // 2. Si el pago fue aprobado, completamos el Draft Order
      if (pagoInfo.status === 'approved') {
        const draftOrderId = pagoInfo.external_reference;

        if (draftOrderId) {
          // 3. Llamar a Shopify API para completar el Draft Order y volverlo una Orden Oficial
          const shopifyRes = await fetch(
            `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}/complete.json?payment_pending=false`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': SHOPIFY_TOKEN, // Asegúrate de tener permisos para write_draft_orders y write_orders
              },
            }
          );

          if (!shopifyRes.ok) {
            const errShopify = await shopifyRes.json();
            // Si el error es "422 Unprocessable Entity", suele significar que el Draft Order YA fue completado.
            // Ignoramos el error para no hacer re-intentos infinitos.
            console.warn('Draft order ya completado o error de Shopify:', errShopify);
          } else {
            console.log(`✅ Orden generada en Shopify desde Draft Order: ${draftOrderId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error procesando webhook:', error);
      // Retornar 500 para que Mercado Pago reintente si falla nuestra red
      return res.status(500).send('Error');
    }
  }

  // Siempre devolver 200 a MP para que sepa que recibimos el aviso
  return res.status(200).send('OK');
}