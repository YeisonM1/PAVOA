import { supabase } from '../config/supabase';

// ── Configuración Shopify ──────────────────────────────
const SHOPIFY_DOMAIN   = import.meta.env.VITE_SHOPIFY_DOMAIN;
const SHOPIFY_TOKEN    = import.meta.env.VITE_SHOPIFY_TOKEN;
const SHOPIFY_ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/2026-04/graphql.json`;

const shopifyFetch = async (query, variables = {}) => {
  const res = await fetch(SHOPIFY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data;
};

// ── Convierte producto Shopify → estructura PAVOA ──────
const mapProducto = (node) => {
  const variantes = node.variants.edges.map(({ node: v }) => ({
    color:  v.selectedOptions.find(o => o.name === 'Color')?.value || '',
    hex:    v.metafield?.value || '#888',
    talla:  v.selectedOptions.find(o => o.name === 'Talla')?.value || 'ÚNICA',
    stock:  v.quantityAvailable ?? 0,
    variantId: v.id,
  }));

  return {
    id:          node.handle,
    shopifyId:   node.id,
    nombre:      node.title,
    descripcion: node.description,
    precio:      `$${Number(node.priceRange.minVariantPrice.amount).toLocaleString('es-CO')}`,
    imagen1:     node.images.edges[0]?.node.url || '',
    imagen2:     node.images.edges[1]?.node.url || '',
    categoria:   node.productType?.toLowerCase() || '',
    tag:         node.tags[0] || '',
    detalles:    node.metafield?.value || '',
    variantes,
  };
};

// ── Trae TODOS los productos ───────────────────────────
export const getProductos = async () => {
  try {
    const data = await shopifyFetch(`
      query {
        products(first: 100) {
          edges {
            node {
              id handle title description productType tags
              priceRange { minVariantPrice { amount } }
              images(first: 2) { edges { node { url } } }
              metafield(namespace: "pavoa", key: "detalles") { value }
              variants(first: 20) {
                edges {
                  node {
                    id
                    quantityAvailable
                    selectedOptions { name value }
                    metafield(namespace: "custom", key: "color_hex") {
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);
    return data.products.edges.map(({ node }) => mapProducto(node));
  } catch (err) {
    console.error('❌ Error getProductos:', err);
    return [];
  }
};

// ── Trae UN producto por handle (slug) ─────────────────
export const getProductoById = async (handle) => {
  try {
    const data = await shopifyFetch(`
      query($handle: String!) {
        product(handle: $handle) {
          id handle title description productType tags
          priceRange { minVariantPrice { amount } }
          images(first: 2) { edges { node { url } } }
          metafield(namespace: "pavoa", key: "detalles") { value }
          variants(first: 20) {
            edges {
              node {
                id
                quantityAvailable
                selectedOptions { name value }
                metafield(namespace: "custom", key: "color_hex") {
                  value
                }
              }
            }
          }
        }
      }
    `, { handle });
    if (!data.product) return null;
    return mapProducto(data.product);
  } catch (err) {
    console.error(`❌ Error getProductoById ${handle}:`, err);
    return null;
  }
};

// ── Trae info del banner de categoría (sigue en Supabase)
export const getCategoriaById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`❌ Error getCategoriaById ${id}:`, err);
    return null;
  }
};

// ── Contacto sigue en Supabase ─────────────────────────
export const enviarContacto = async ({ nombre, contacto, asunto, mensaje }) => {
  try {
    const { error } = await supabase
      .from('contactos')
      .insert([{ nombre, contacto, asunto, mensaje }]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('❌ Error enviarContacto:', err);
    return false;
  }
};