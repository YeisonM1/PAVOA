import mercadopago from 'mercadopago';

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    token,
    payment_method_id,
    installments,
    issuer_id,
    draftOrderId,
    transaction_amount,
    payer,
  } = req.body;

  if (!token || !payment_method_id || !draftOrderId || !transaction_amount) {
    return res.status(400).json({ error: 'Datos incompletos para procesar el pago' });
  }

  try {
    const paymentClient = new mercadopago.Payment(client);

    const result = await paymentClient.create({
      body: {
        transaction_amount: Number(transaction_amount),
        token,
        description:        'PAVOA - Pedido online',
        installments:       Number(installments) || 1,
        payment_method_id,
        issuer_id,
        payer: {
          email:          payer?.email || 'cliente@pavoa.com',
          identification: payer?.identification,
        },
        external_reference:  String(draftOrderId),
        notification_url:    `${process.env.VITE_APP_URL}/api/webhook-mercadopago`,
      },
    });

    console.log(`✅ Pago procesado: ${result.id} | estado: ${result.status} | draft: ${draftOrderId}`);

    return res.status(200).json({
      status:        result.status,
      status_detail: result.status_detail,
      payment_id:    result.id,
    });
  } catch (error) {
    console.error('❌ Error procesando pago MP:', error);
    return res.status(500).json({ error: 'Error al procesar el pago' });
  }
}
