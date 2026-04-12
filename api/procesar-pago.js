import mercadopago from 'mercadopago';

const client = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

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

    const result = await paymentClient.create({ body });

    console.log(`✅ Pago procesado: ${result.id} | estado: ${result.status} | draft: ${draftOrderId}`);

    if (result.status === 'rejected' || result.status === 'cancelled') {
      await eliminarDraftOrder(draftOrderId);
    }

    return res.status(200).json({
      status:        result.status,
      status_detail: result.status_detail,
      payment_id:    result.id,
    });
  } catch (error) {
    const detalle = {
      message: error?.message,
      status:  error?.status,
      cause:   error?.cause,
    };
    console.error('❌ Error procesando pago MP:', JSON.stringify(detalle));
    await eliminarDraftOrder(draftOrderId);
    return res.status(500).json({
      error:   error?.message || 'Error al procesar el pago',
      detalle: detalle.cause?.[0]?.description || null,
    });
  }
}
