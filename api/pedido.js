const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;

// Cache del token en memoria + mutex para evitar race condition en cold starts concurrentes
let _tokenCache    = { token: null, expiresAt: 0 };
let _tokenInflight = null;

const getShopifyToken = async () => {
  const now = Date.now();
  // Si el token existe y le quedan más de 2 minutos de vida, lo reutiliza
  if (_tokenCache.token && _tokenCache.expiresAt - now > 120_000) {
    return _tokenCache.token;
  }
  // Si ya hay una petición en vuelo, esperar la misma (evita doble fetch concurrente)
  if (_tokenInflight) return _tokenInflight;

  _tokenInflight = (async () => {
    try {
      const clientId     = process.env.SHOPIFY_CLIENT_ID;
      const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        throw new Error('SHOPIFY_CLIENT_ID o SHOPIFY_CLIENT_SECRET no configurados');
      }

      const res = await fetch(
        `https://${SHOPIFY_DOMAIN}/admin/oauth/access_token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Error obteniendo token de Shopify: ${err}`);
      }

      const data = await res.json();
      // Shopify devuelve expires_in en segundos (normalmente 3600 = 1 hora)
      _tokenCache = {
        token:     data.access_token,
        expiresAt: now + (data.expires_in ?? 3600) * 1000,
      };
      return _tokenCache.token;
    } finally {
      _tokenInflight = null;
    }
  })();

  return _tokenInflight;
};

// Caché de idempotencia: evita crear un Draft Order duplicado si el mismo request llega dos veces
const _pedidoCache = new Map(); // idempotencyKey → { draftOrderId, name, ts }
const IDEM_TTL = 30 * 60 * 1000; // 30 minutos

const crearDraftOrder = async (token, { form, cartItems }) => {
  const lineItems = cartItems.map(item => {
    const rawId     = item.producto.selectedVariantId || '';
    const variantId = rawId.includes('gid://')
      ? Number(rawId.split('/').pop())
      : Number(rawId) || null;

    return {
      variant_id: variantId || undefined,
      title:      item.producto.nombre,
      quantity:   item.cantidad,
      price:      String(
        item.producto.precioNumerico ??
        parseInt(String(item.producto.precio).replace(/[$,.]/g, ''), 10) ?? 0
      ),
    };
  });

  const nota = [
    `Horario de entrega: ${form.horario}`,
    form.referencia ? `Punto de referencia: ${form.referencia}` : '',
    `Barrio: ${form.barrio}`,
  ].filter(Boolean).join(' | ');

  const [firstName, ...rest] = form.nombre.trim().split(' ');
  const lastName = rest.join(' ') || '-';
  const telFormateado = `+57${form.telefono.replace(/\D/g, '')}`;

  const body = {
    draft_order: {
      line_items: lineItems,
      phone:        telFormateado,
      shipping_address: {
        first_name: firstName,
        last_name:  lastName,
        phone:      telFormateado,
        address1:   form.direccion,
        address2:   form.barrio,
        city:       form.ciudad,
        country:    'CO',
      },
      billing_address: {
        first_name: firstName,
        last_name:  lastName,
        phone:      telFormateado,
        address1:   form.direccion,
        address2:   form.barrio,
        city:       form.ciudad,
        country:    'CO',
      },
      note:         nota,
      tags:         'pavoa-web,mercadopago',
      send_receipt: false,
      note_attributes: [
        { name: 'customer_email', value: form.email || '' },
      ],
    },
  };

  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type':           'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();
  if (!data.draft_order) throw new Error(JSON.stringify(data));
  return data.draft_order;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { form, cartItems, cartTotal, idempotencyKey } = req.body;

  if (!form?.nombre?.trim() || !form?.telefono?.trim()) {
    return res.status(400).json({ error: 'Nombre y teléfono son requeridos' });
  }
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío' });
  }

  // Devolver el mismo Draft Order si el mismo request llega dos veces (doble-click, retry)
  if (idempotencyKey) {
    const cached = _pedidoCache.get(idempotencyKey);
    if (cached && Date.now() - cached.ts < IDEM_TTL) {
      console.log(`♻️ Draft Order reutilizado (idempotency): ${cached.name}`);
      return res.status(200).json({ ok: true, draftOrderId: cached.draftOrderId, name: cached.name });
    }
  }

  try {
    const token      = await getShopifyToken();
    const draftOrder = await crearDraftOrder(token, { form, cartItems, cartTotal });

    if (idempotencyKey) {
      _pedidoCache.set(idempotencyKey, { draftOrderId: draftOrder.id, name: draftOrder.name, ts: Date.now() });
    }

    console.log(`✅ Draft Order creado: ${draftOrder.name} — ${draftOrder.id}`);
    return res.status(200).json({ ok: true, draftOrderId: draftOrder.id, name: draftOrder.name });
  } catch (err) {
    console.error('❌ Error creando draft order:', err.message);
    return res.status(500).json({ error: 'Error al crear el pedido en Shopify' });
  }
}