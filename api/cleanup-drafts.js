const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN;

let _tokenCache = { token: null, expiresAt: 0 };

const getShopifyToken = async () => {
  const now = Date.now();
  if (_tokenCache.token && _tokenCache.expiresAt - now > 120_000) return _tokenCache.token;
  const res = await fetch(
    `https://${SHOPIFY_DOMAIN}/admin/oauth/access_token?grant_type=client_credentials&client_id=${process.env.SHOPIFY_CLIENT_ID}&client_secret=${process.env.SHOPIFY_CLIENT_SECRET}`,
    { method: 'POST' }
  );
  const data = await res.json();
  _tokenCache = { token: data.access_token, expiresAt: now + (data.expires_in ?? 3600) * 1000 };
  return _tokenCache.token;
};

export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token     = await getShopifyToken();
    const cutoff    = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const base      = `https://${SHOPIFY_DOMAIN}/admin/api/2026-04`;

    const fetchDrafts = await fetch(
      `${base}/draft_orders.json?status=open&limit=250&updated_at_max=${cutoff}`,
      { headers: { 'X-Shopify-Access-Token': token } }
    );
    const { draft_orders } = await fetchDrafts.json();

    if (!draft_orders?.length) {
      console.log('✅ Cleanup: no hay draft orders huérfanos');
      return res.status(200).json({ deleted: 0 });
    }

    let deleted = 0;
    for (const draft of draft_orders) {
      try {
        await fetch(`${base}/draft_orders/${draft.id}.json`, {
          method: 'DELETE',
          headers: { 'X-Shopify-Access-Token': token },
        });
        deleted++;
        console.log(`🗑️ Draft order eliminado: ${draft.id} (creado: ${draft.created_at})`);
      } catch (err) {
        console.warn(`⚠️ No se pudo eliminar draft ${draft.id}:`, err.message);
      }
    }

    console.log(`✅ Cleanup completado: ${deleted} draft orders eliminados`);
    return res.status(200).json({ deleted });

  } catch (err) {
    console.error('❌ Error en cleanup-drafts:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
