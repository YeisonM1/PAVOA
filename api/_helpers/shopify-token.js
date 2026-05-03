const SHOPIFY_DOMAIN = process.env.VITE_SHOPIFY_DOMAIN;

// Cache del token de app en memoria + mutex para evitar race condition en cold starts concurrentes
let _tokenCache = { token: null, expiresAt: 0 };
let _tokenInflight = null;

const getShopifyAppToken = async () => {
  const now = Date.now();
  if (_tokenCache.token && _tokenCache.expiresAt - now > 120_000) {
    return _tokenCache.token;
  }
  if (_tokenInflight) return _tokenInflight;

  _tokenInflight = (async () => {
    try {
      const clientId = process.env.SHOPIFY_CLIENT_ID;
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
      _tokenCache = {
        token: data.access_token,
        expiresAt: now + (data.expires_in ?? 3600) * 1000,
      };
      return _tokenCache.token;
    } finally {
      _tokenInflight = null;
    }
  })();

  return _tokenInflight;
};

export const getShopifyToken = async (preferred = 'app') => {
  const adminToken = String(process.env.SHOPIFY_ADMIN_TOKEN || '').trim();
  const hasAppCreds = Boolean(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);

  if (preferred === 'admin') {
    if (adminToken) return adminToken;
    if (hasAppCreds) return getShopifyAppToken();
    throw new Error('No hay token disponible de Shopify');
  }

  if (hasAppCreds) {
    return getShopifyAppToken();
  }
  if (adminToken) {
    return adminToken;
  }

  throw new Error('No hay token disponible de Shopify');
};

/**
 * Elimina un draft order de Shopify.
 */
export const eliminarDraftOrder = async (draftOrderId) => {
  try {
    const token = await getShopifyToken('app');
    await fetch(
      `https://${SHOPIFY_DOMAIN}/admin/api/2026-04/draft_orders/${draftOrderId}.json`,
      {
        method: 'DELETE',
        headers: { 'X-Shopify-Access-Token': token },
      }
    );
    console.log(`Draft order eliminado: ${draftOrderId}`);
  } catch (err) {
    console.error(`No se pudo eliminar draft order ${draftOrderId}:`, err.message);
  }
};
