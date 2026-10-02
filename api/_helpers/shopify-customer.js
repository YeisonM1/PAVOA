import { getShopifyToken } from './shopify-token.js';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || process.env.VITE_SHOPIFY_DOMAIN;

const CUSTOMER_CREATE_MUTATION = `#graphql
  mutation CrearCliente($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
        email
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const cleanText = (value) => String(value || '').trim();

// Shopify responde con este texto cuando el correo ya tiene cliente. No es un
// fallo: la cuenta ya esta donde se queria que estuviera.
const yaExiste = (mensaje) =>
  /already been taken|ya (ha sido|fue) tomado|already exists/i.test(String(mensaje || ''));

/**
 * Crea el cliente en Shopify para que la tienda vea quien se registro, no solo
 * quien compro. Deliberadamente NO se envia emailMarketingConsent: registrarse
 * no es aceptar publicidad, y marcarlos como suscritos convertiria cualquier
 * campana posterior en correo no solicitado. Para eso esta el newsletter.
 *
 * Nunca lanza: el registro de una persona no puede depender de que Shopify
 * responda. Devuelve el resultado para que quien llame decida si avisar.
 */
export const crearClienteShopify = async ({ email, firstName, lastName }) => {
  const correo = cleanText(email).toLowerCase();
  if (!correo) return { ok: false, motivo: 'sin correo' };

  try {
    const token = await getShopifyToken();
    const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({
        query: CUSTOMER_CREATE_MUTATION,
        variables: {
          input: {
            email: correo,
            firstName: cleanText(firstName) || null,
            lastName: cleanText(lastName) || null,
          },
        },
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      return { ok: false, motivo: `Shopify ${res.status}: ${detalle.slice(0, 200)}` };
    }

    const data = await res.json();

    // Un permiso que falta llega aqui, no como error HTTP: sin write_customers
    // Shopify responde 200 con el error dentro. Sin esto el fallo seria mudo.
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return { ok: false, motivo: data.errors.map((e) => e.message).join(' | ') };
    }

    const errores = data?.data?.customerCreate?.userErrors || [];
    if (errores.length > 0) {
      if (errores.some((e) => yaExiste(e.message))) {
        return { ok: true, yaExistia: true };
      }
      return { ok: false, motivo: errores.map((e) => e.message).join(' | ') };
    }

    return { ok: true, id: data?.data?.customerCreate?.customer?.id || null };
  } catch (err) {
    return { ok: false, motivo: err.message };
  }
};
