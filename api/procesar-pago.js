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

  // ── DIAGNÓSTICO TEMPORAL — eliminar después de confirmar que funciona ──
  console.log('🔍 [procesar-pago] REQUEST:', JSON.stringify({
    token:              token ? `${token.slice(0, 8)}...` : 'UNDEFINED',
    payment_method_id:  payment_method_id || 'UNDEFINED',
    installments,
    draftOrderId:       draftOrderId || 'UNDEFINED',
    transaction_amount: transaction_amount || 'UNDEFINED',
    payer_email:        payer?.email || 'UNDEFINED',
    payer_id_type:      payer?.identification?.type || 'UNDEFINED',
    mp_token_prefix:    process.env.MP_ACCESS_TOKEN?.slice(0, 10) || 'UNDEFINED',
  }));

  try {
    const paymentClient = new mercadopago.Payment(client);

    const body = {
      transaction_amount: Number(transaction_amount),
      token,
      description:        'PAVOA - Pedido online',
      installments:       Number(installments) || 1,
      payment_method_id,
      issuer_id,
      payer: {
        email:          payer?.email,
        identification: payer?.identification,
      },
      external_reference:  String(draftOrderId),
      notification_url:    `${process.env.VITE_APP_URL}/api/webhook-mercadopago`,
    };

    console.log('🔍 [procesar-pago] BODY enviado a MP:', JSON.stringify({
      ...body,
      token: `${body.token?.slice(0, 8)}...`,
    }));

    const result = await paymentClient.create({ body });

    console.log(`✅ Pago procesado: ${result.id} | estado: ${result.status} | draft: ${draftOrderId}`);

    return res.status(200).json({
      status:        result.status,
      status_detail: result.status_detail,
      payment_id:    result.id,
    });
  } catch (error) {
    console.error('❌ Error procesando pago MP:', JSON.stringify({
      message: error?.message,
      status:  error?.status,
      cause:   error?.cause,
    }));
    return res.status(500).json({ error: 'Error al procesar el pago' });
  }
}
