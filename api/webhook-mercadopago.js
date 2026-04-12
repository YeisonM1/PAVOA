import mercadopago from 'mercadopago';

const client = new mercadopago.MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;

const getAccessToken = async () => {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      grant_type: 'client_credentials',
    }).toString(),
  });
  const data = await res.json();
  return data.access_token;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { type, data } = req.body;

  if (type === 'payment' && data?.id) {
    try {
      // Llamamos a Payment desde el objeto global
      const paymentClient = new mercadopago.Payment(client);
      const pagoInfo = await paymentClient.get({ id: data.id });

      if (pagoInfo.status === 'approved') {
        const draftOrderId = pagoInfo.external_reference;

        if (draftOrderId) {
          const shopifyToken = await getAccessToken();
          
          const shopifyRes = await fetch(
            `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}/complete.json?payment_pending=false`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': shopifyToken,
              },
            }
          );

          if (!shopifyRes.ok) {
            console.warn('Draft order ya completado o error de Shopify');
          } else {
            console.log(`✅ Orden completada en Shopify: ${draftOrderId}`);
          }
        }
      }
    } catch (error) {
      console.error('Error procesando webhook:', error);
      return res.status(500).send('Error');
    }
  }

  return res.status(200).send('OK');
}