const SHOPIFY_DOMAIN   = process.env.SHOPIFY_DOMAIN;
const CLIENT_ID        = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET    = process.env.SHOPIFY_CLIENT_SECRET;

// ── Obtiene un token de acceso usando Client Credentials Grant ──
const getAccessToken = async () => {
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/oauth/access_token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type:    'client_credentials',
      }).toString(),
    }
  );
  const data = await res.json();
  if (!data.access_token) throw new Error('No se pudo obtener el token de Shopify');
  return data.access_token;
};

// ── Crea un Draft Order en Shopify ─────────────────────────────
const crearDraftOrder = async (token, { form, cartItems, cartTotal }) => {
  const lineItems = cartItems.map(item => ({
    variant_id: item.producto.variantId
      ? Number(item.producto.variantId.replace('gid://shopify/ProductVariant/', ''))
      : null,
    title:    item.producto.nombre,
    quantity: item.cantidad,
    price:    String(item.producto.precioNumerico || 0),
  }));

  const nota = [
    `Horario de entrega: ${form.horario}`,
    form.referencia ? `Punto de referencia: ${form.referencia}` : '',
    `Barrio: ${form.barrio}`,
  ].filter(Boolean).join(' | ');

  const body = {
    draft_order: {
      line_items: lineItems,
      shipping_address: {
        first_name: form.nombre,
        phone:      form.telefono,
        address1:   form.direccion,
        city:       form.ciudad,
        country:    'CO',
      },
      note:   nota,
      tags:   'pavoa-web,whatsapp',
      send_receipt: false,
    },
  };

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type':          'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!data.draft_order) throw new Error(JSON.stringify(data));
  return data.draft_order;
};

// ── Handler principal ──────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { form, cartItems, cartTotal } = req.body;

  try {
    const token     = await getAccessToken();
    const draftOrder = await crearDraftOrder(token, { form, cartItems, cartTotal });

    console.log(`✅ Draft Order creado: ${draftOrder.name} — ${draftOrder.id}`);
    return res.status(200).json({ ok: true, draftOrderId: draftOrder.id, name: draftOrder.name });
  } catch (err) {
    console.error('❌ Error creando draft order:', err);
    return res.status(500).json({ error: 'Error al crear el pedido en Shopify' });
  }
}