// ── Login — llama a nuestra API serverless ────────────
export const login = async (email, password) => {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión.');

  localStorage.setItem('pavoa_token', data.token);
  localStorage.setItem('pavoa_token_expires', data.expiresAt);
  localStorage.setItem('pavoa_usuario', JSON.stringify(data.usuario));

  return data;
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
export const cerrarSesion = () => {
  localStorage.removeItem('pavoa_token');
  localStorage.removeItem('pavoa_token_expires');
  localStorage.removeItem('pavoa_usuario');
};

// ── Obtener token activo ──────────────────────────────
export const getToken = () => {
  const token   = localStorage.getItem('pavoa_token');
  const expires = localStorage.getItem('pavoa_token_expires');
  if (!token || Date.now() > Number(expires)) return null;
  return token;
};

// ── Verificar si está autenticado ─────────────────────
export const estaAutenticado = () => !!getToken();

// ── Obtener perfil del cliente (desde localStorage) ───
export const getCliente = () => {
  const usuario = localStorage.getItem('pavoa_usuario');
  return usuario ? JSON.parse(usuario) : null;
};

// ── Obtener pedidos del cliente desde Shopify ─────────
export const getPedidos = async () => {
  const usuario = getCliente();
  if (!usuario) throw new Error('No autenticado');

  // Buscar cliente en Shopify por email
  const res = await fetch(`https://${import.meta.env.VITE_SHOPIFY_DOMAIN}/api/2026-04/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': import.meta.env.VITE_SHOPIFY_TOKEN,
    },
    body: JSON.stringify({
      query: `
        query {
          customers(first: 1, query: "email:${usuario.email}") {
            edges {
              node {
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
                            variant { image { url } }
                          }
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
  const cliente = data?.customers?.edges[0]?.node;
  if (!cliente) return [];
  return cliente.orders.edges.map(({ node }) => node);
};