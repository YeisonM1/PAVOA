const SHOPIFY_DOMAIN   = process.env.VITE_SHOPIFY_DOMAIN;
const SHOPIFY_TOKEN    = process.env.VITE_SHOPIFY_TOKEN;
const SHOPIFY_ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/2026-04/graphql.json`;

const shopifyFetch = async (query) => {
  const res = await fetch(SHOPIFY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
  }

  try {
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
      return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    }

    return res.status(200).json({
      ok: true,
      accessToken: customerAccessToken.accessToken,
      expiresAt: customerAccessToken.expiresAt,
    });

  } catch (err) {
    console.error('Error login:', err);
    return res.status(500).json({ error: 'Error al iniciar sesión. Intenta de nuevo.' });
  }
}