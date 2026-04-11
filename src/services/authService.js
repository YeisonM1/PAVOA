// ── Login — llama a nuestra API serverless ────────────
export const login = async (email, password) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión.');

  localStorage.setItem('pavoa_access_token', data.accessToken);
  localStorage.setItem('pavoa_token_expires', new Date(data.expiresAt).getTime());

  return data.accessToken;
};

// ── Register — llama a nuestra API serverless ─────────
export const register = async ({ firstName, lastName, email, password }) => {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ firstName, lastName, email, password }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error al crear la cuenta.');

  return data;
};

// ── Cerrar sesión ─────────────────────────────────────
export const cerrarSesion = async () => {
  const token = localStorage.getItem('pavoa_access_token');

  if (token) {
    await fetch('/api/login', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }

  localStorage.removeItem('pavoa_access_token');
  localStorage.removeItem('pavoa_token_expires');
};

// ── Obtener token activo ──────────────────────────────
export const getToken = () => {
  const token   = localStorage.getItem('pavoa_access_token');
  const expires = localStorage.getItem('pavoa_token_expires');
  if (!token || Date.now() > Number(expires)) return null;
  return token;
};

// ── Verificar si está autenticado ─────────────────────
export const estaAutenticado = () => !!getToken();

// ── Obtener perfil del cliente ────────────────────────
export const getCliente = async () => {
  const token = getToken();
  if (!token) throw new Error('No autenticado');

  const res = await fetch(`https://${import.meta.env.VITE_SHOPIFY_DOMAIN}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': import.meta.env.VITE_SHOPIFY_TOKEN,
    },
    body: JSON.stringify({
      query: `
        query {
          customer(customerAccessToken: "${token}") {
            id
            firstName
            lastName
            email
            phone
          }
        }
      `
    }),
  });

  const { data } = await res.json();
  return data.customer;
};

// ── Obtener pedidos del cliente ───────────────────────
export const getPedidos = async () => {
  const token = getToken();
  if (!token) throw new Error('No autenticado');

  const res = await fetch(`https://${import.meta.env.VITE_SHOPIFY_DOMAIN}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': import.meta.env.VITE_SHOPIFY_TOKEN,
    },
    body: JSON.stringify({
      query: `
        query {
          customer(customerAccessToken: "${token}") {
            orders(first: 20) {
              edges {
                node {
                  id
                  name
                  processedAt
                  financialStatus
                  fulfillmentStatus
                  totalPrice { amount currencyCode }
                  lineItems(first: 5) {
                    edges {
                      node {
                        title
                        quantity
                        variant {
                          image { url }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `
    }),
  });

  const { data } = await res.json();
  return data.customer.orders.edges.map(({ node }) => node);
};