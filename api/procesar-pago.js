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
    transaction_details,
  } = req.body;

  if (!payment_method_id || !draftOrderId || !transaction_amount) {
    return res.status(400).json({ error: 'Datos incompletos para procesar el pago' });
  }

  const isPSE  = payment_method_id === 'pse';
  const isCard = !!token;
  const ip     = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
               || req.socket?.remoteAddress
               || '0.0.0.0';

  try {
    const paymentClient = new mercadopago.Payment(client);

    const body = {
      transaction_amount: Number(transaction_amount),
      description:        'PAVOA - Pedido online',
      payment_method_id,
      additional_info: { ip_address: ip },
      payer: {
        email:          payer?.email,
        ...(payer?.identification && { identification: payer.identification }),
        ...(payer?.first_name     && { first_name:    payer.first_name    }),
        ...(payer?.last_name      && { last_name:     payer.last_name     }),
        // entity_type solo aplica para PSE
        ...(isPSE && payer?.entity_type && { entity_type: payer.entity_type }),
      },
      external_reference: String(draftOrderId),
      notification_url:   `${process.env.VITE_APP_URL}/api/webhook-mercadopago`,
    };

    if (isCard) {
      // Pago con tarjeta
      body.token        = token;
      body.installments = Number(installments) || 1;
      body.issuer_id    = issuer_id;
    } else {
      // PSE, Nequi, Efecty u otros métodos sin token
      if (isPSE && transaction_details?.financial_institution) {
        body.transaction_details = {
          financial_institution: transaction_details.financial_institution,
        };
      }
      body.callback_url = process.env.VITE_APP_URL;
    }

    const result = await paymentClient.create({ body });

    console.log(`✅ Pago: ${result.id} | método: ${payment_method_id} | estado: ${result.status} | draft: ${draftOrderId}`);

    if (result.status === 'rejected' || result.status === 'cancelled') {
      await eliminarDraftOrder(draftOrderId);
    }

    return res.status(200).json({
      status:        result.status,
      status_detail: result.status_detail,
      payment_id:    result.id,
      redirect_url:  result.transaction_details?.external_resource_url || null,
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
