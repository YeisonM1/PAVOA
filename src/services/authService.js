import { shopifyFetch } from './productService';

// ── Login ─────────────────────────────────────────────
export const login = async (email, password) => {
  const data = await shopifyFetch(`
    mutation {
      customerAccessTokenCreate(input: {
        email: "${email}",
        password: "${password}"
      }) {
        customerAccessToken {
          accessToken
          expiresAt
        }
        customerUserErrors {
          code
          message
        }
      }
    }
  `);

  const { customerAccessToken, customerUserErrors } = data.customerAccessTokenCreate;

  if (customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message);
  }

  localStorage.setItem('pavoa_access_token', customerAccessToken.accessToken);
  localStorage.setItem('pavoa_token_expires', new Date(customerAccessToken.expiresAt).getTime());

  return customerAccessToken.accessToken;
};

// ── Register ──────────────────────────────────────────
export const register = async ({ firstName, lastName, email, password }) => {
  const data = await shopifyFetch(`
    mutation {
      customerCreate(input: {
        firstName: "${firstName}",
        lastName: "${lastName}",
        email: "${email}",
        password: "${password}"
      }) {
        customer {
          id
          email
        }
        customerUserErrors {
          code
          message
        }
      }
    }
  `);

  const { customer, customerUserErrors } = data.customerCreate;

  if (customerUserErrors.length > 0) {
    throw new Error(customerUserErrors[0].message);
  }

  // Auto login después de registrarse
  await login(email, password);
  return customer;
};

// ── Cerrar sesión ─────────────────────────────────────
export const cerrarSesion = async () => {
  const token = localStorage.getItem('pavoa_access_token');

  if (token) {
    await shopifyFetch(`
      mutation {
        customerAccessTokenDelete(customerAccessToken: "${token}") {
          deletedAccessToken
          userErrors { message }
        }
      }
    `).catch(() => {});
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

  const data = await shopifyFetch(`
    query {
      customer(customerAccessToken: "${token}") {
        id
        firstName
        lastName
        email
        phone
      }
    }
  `);

  return data.customer;
};

// ── Obtener pedidos del cliente ───────────────────────
export const getPedidos = async () => {
  const token = getToken();
  if (!token) throw new Error('No autenticado');

  const data = await shopifyFetch(`
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
  `);

  return data.customer.orders.edges.map(({ node }) => node);
};