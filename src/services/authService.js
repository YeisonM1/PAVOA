const CLIENT_ID     = import.meta.env.VITE_SHOPIFY_CUSTOMER_CLIENT_ID;
const SHOP_ID       = import.meta.env.VITE_SHOPIFY_SHOP_ID; // ← agregar al .env
const REDIRECT_URI  = `${window.location.origin}/cuenta/callback`;
const AUTH_ENDPOINT = `https://shopify.com/authentication/${SHOP_ID}/oauth/authorize`;
const TOKEN_ENDPOINT = `https://shopify.com/authentication/${SHOP_ID}/oauth/token`;
const LOGOUT_ENDPOINT = `https://shopify.com/authentication/${SHOP_ID}/logout`;

const SCOPES = 'openid email customer-account-api:full';

// ── Helpers PKCE ──────────────────────────────────────
const generateCodeVerifier = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

const generateState = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

// ── Iniciar login — redirige a Shopify ────────────────
export const iniciarLogin = async () => {
  const verifier   = generateCodeVerifier();
  const challenge  = await generateCodeChallenge(verifier);
  const state      = generateState();
  const nonce      = generateState();

  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          REDIRECT_URI,
    scope:                 SCOPES,
    state,
    nonce,
    code_challenge:        challenge,
    code_challenge_method: 'S256',
  });

  window.location.href = `${AUTH_ENDPOINT}?${params}`;
};

// ── Manejar callback — intercambia código por token ───
export const manejarCallback = async () => {
  const params   = new URLSearchParams(window.location.search);
  const code     = params.get('code');
  const state    = params.get('state');
  const verifier = sessionStorage.getItem('pkce_verifier');
  const savedState = sessionStorage.getItem('oauth_state');

  if (!code || state !== savedState) throw new Error('Estado inválido');

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      client_id:     CLIENT_ID,
      redirect_uri:  REDIRECT_URI,
      code,
      code_verifier: verifier,
    }),
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);

  // Guardar tokens
  localStorage.setItem('pavoa_access_token', data.access_token);
  localStorage.setItem('pavoa_refresh_token', data.refresh_token || '');
  localStorage.setItem('pavoa_token_expires', Date.now() + data.expires_in * 1000);

  sessionStorage.removeItem('pkce_verifier');
  sessionStorage.removeItem('oauth_state');

  return data.access_token;
};

// ── Cerrar sesión ─────────────────────────────────────
export const cerrarSesion = () => {
  const token = localStorage.getItem('pavoa_access_token');
  localStorage.removeItem('pavoa_access_token');
  localStorage.removeItem('pavoa_refresh_token');
  localStorage.removeItem('pavoa_token_expires');

  const params = new URLSearchParams({
    id_token_hint:            token || '',
    post_logout_redirect_uri: window.location.origin,
  });

  window.location.href = `${LOGOUT_ENDPOINT}?${params}`;
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

// ── Fetch autenticado a Customer Account API ──────────
const CUSTOMER_API = `https://shopify.com/authentication/${SHOP_ID}/account/customer/api/2024-07/graphql`;

export const customerFetch = async (query, variables = {}) => {
  const token = getToken();
  if (!token) throw new Error('No autenticado');

  const res = await fetch(CUSTOMER_API, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data;
};

// ── Obtener perfil del cliente ────────────────────────
export const getCliente = async () => {
  const data = await customerFetch(`
    query {
      customer {
        id
        firstName
        lastName
        emailAddress { emailAddress }
        phoneNumber { phoneNumber }
      }
    }
  `);
  return data.customer;
};

// ── Obtener pedidos del cliente ───────────────────────
export const getPedidos = async () => {
  const data = await customerFetch(`
    query {
      customer {
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
                    image { url }
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