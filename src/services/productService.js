const SHOPIFY_DOMAIN   = import.meta.env.VITE_SHOPIFY_DOMAIN;
const SHOPIFY_TOKEN    = import.meta.env.VITE_SHOPIFY_TOKEN;
const SHOPIFY_ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/2026-04/graphql.json`;

// ── Caché en memoria con TTL ──────────────────────────
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

const getCached = (key) => {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) {
    _cache.delete(key);
    return null;
  }
  return entry.promise;
};

const setCache = (key, promise) => {
  _cache.set(key, { promise, ts: Date.now() });
  promise.catch(() => _cache.delete(key));
};
// ──────────────────────────────────────────────────────

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
  const variantes = node.variants.edges.map(({ node: v }) => {
    const hexRaw = v.metafield?.value || '#888888';
    const hex = hexRaw.startsWith('#') ? hexRaw : `#${hexRaw}`;
    return {
      color:     v.selectedOptions.find(o => o.name === 'Color')?.value || '',
      hex,
      talla:     v.selectedOptions.find(o => o.name === 'Talla')?.value || 'ÚNICA',
      stock:     v.quantityAvailable ?? 0,
      variantId: v.id,
    };
  });

  return {
    id:          node.handle,
    shopifyId:   node.id,
    nombre:      node.title,
    descripcion: node.description,
    precio:      `$${Number(node.priceRange.minVariantPrice.amount).toLocaleString('es-CO')}`,
    precioNumerico: Number(node.priceRange.minVariantPrice.amount),
    imagen1:     node.images.edges[0]?.node.url || '',
    imagen2:     node.images.edges[1]?.node.url || '',
    categoria:   node.productType?.toLowerCase() || '',
    tag:         node.tags[0] || '',
    detalles:    node.detallesField?.value || '',
    cuidados:    node.cuidadosField?.value || '',
    variantes,
  };
};

// ── Fragmento completo (detalle de producto) ──────────
const PRODUCT_FIELDS = `
  id handle title description productType tags
  priceRange { minVariantPrice { amount } }
  images(first: 2) { edges { node { url } } }
  detallesField: metafield(namespace: "pavoa", key: "detalles") { value }
  cuidadosField: metafield(namespace: "pavoa", key: "cuidados") { value }
  variants(first: 20) {
    edges {
      node {
        id quantityAvailable
        selectedOptions { name value }
        metafield(namespace: "custom", key: "color_hex") { value }
      }
    }
  }
`;

// ── Fragmento ligero (listados/grids, sin detalles ni cuidados) ──
const PRODUCT_FIELDS_LIGHT = `
  id handle title description productType tags
  priceRange { minVariantPrice { amount } }
  images(first: 2) { edges { node { url } } }
  variants(first: 20) {
    edges {
      node {
        id quantityAvailable
        selectedOptions { name value }
        metafield(namespace: "custom", key: "color_hex") { value }
      }
    }
  }
`;

// ── Trae TODOS los productos ───────────────────────────
export const getProductos = () => {
  const cached = getCached('all-products');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          products(first: 100) {
            edges {
              node { ${PRODUCT_FIELDS_LIGHT} }
            }
          }
        }
      `);
      return data.products.edges.map(({ node }) => mapProducto(node));
    } catch (err) {
      console.error('Error getProductos:', err);
      return [];
    }
  })();

  setCache('all-products', promise);
  return promise;
};

// ── Trae UN producto por handle (slug) ─────────────────
export const getProductoById = (handle) => {
  const key = `product-${handle}`;
  const cached = getCached(key);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query($handle: String!) {
          product(handle: $handle) { ${PRODUCT_FIELDS} }
        }
      `, { handle });
      if (!data.product) return null;
      return mapProducto(data.product);
    } catch (err) {
      console.error(`Error getProductoById ${handle}:`, err);
      return null;
    }
  })();

  setCache(key, promise);
  return promise;
};

// ── Trae info del banner de categoría desde Shopify ───
export const getCategoriaById = (id) => {
  const cacheKey = `categoria-${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query($handle: String!) {
          collection(handle: $handle) {
            title
            description
            image { url }
          }
        }
      `, { handle: id });

      if (!data.collection) return null;

      const c = data.collection;
      return {
        id,
        titulo1: c.title,
        titulo2: '',
        desc:    c.description,
        heroImage: c.image?.url || '',
      };
    } catch (err) {
      console.error(`Error getCategoriaById ${id}:`, err);
      return null;
    }
  })();

  setCache(cacheKey, promise);
  return promise;
};

// ── Enviar formulario de contacto ──────────────────────
export const enviarContacto = async ({ nombre, contacto, asunto, mensaje }) => {
  try {
    const res = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, contacto, asunto, mensaje }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    console.error('Error enviarContacto:', err);
    return false;
  }
};


// ── Trae los slides del Hero desde Shopify Metaobjects ─
export const getHeroSlides = () => {
  const cached = getCached('hero-slides');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "hero_slide", first: 10) {
            edges {
              node {
                id
                fields {
                  key
                  value
                  reference {
                    ... on MediaImage {
                      image {
                        url
                        width
                        height
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `);

      return data.metaobjects.edges.map(({ node }, index) => {
        const get      = (key) => node.fields.find(f => f.key === key)?.value || '';
        const getImage = (key) => node.fields.find(f => f.key === key)?.reference?.image?.url || '';

        return {
          id:       index + 1,
          image:    getImage('imagen'),   // ← ahora lee desde reference
          tag:      get('tag'),
          headline: get('headline').split('|'),
          sub:      get('subtitulo'),
          cta:      get('cta_texto'),
          href:     get('cta_link'),
        };
      });
    } catch (err) {
      console.error('Error getHeroSlides:', err);
      return [];
    }
  })();

  setCache('hero-slides', promise);
  return promise;
};
// ── Trae las categorías destacadas desde Shopify Metaobjects ─
export const getCategoriasDestacadas = () => {
  const cached = getCached('categorias-destacadas');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "categoria_destacada", first: 10) {
            edges {
              node {
                id
                fields {
                  key
                  value
                  reference {
                    ... on MediaImage {
                      image {
                        url
                        width
                        height
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `);

      const result = {};
      data.metaobjects.edges.forEach(({ node }, index) => {
        const get      = (key) => node.fields.find(f => f.key === key)?.value || '';
        const getImage = (key) => node.fields.find(f => f.key === key)?.reference?.image?.url || '';

        const posicion = get('posicion');
        if (posicion) {
          result[posicion] = {
            id:     index + 1,
            nombre: get('nombre'),
            desc:   get('descripcion'),
            href:   get('href'),
            image:  getImage('imagen'),   // ← ahora lee desde reference
          };
        }
      });

      return result;
    } catch (err) {
      console.error('Error getCategoriasDestacadas:', err);
      return {};
    }
  })();

  setCache('categorias-destacadas', promise);
  return promise;
};

// ── Trae el announcement bar desde Shopify Metaobjects ─
export const getAnnouncementBar = () => {
  const cached = getCached('announcement-bar');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "announcement_bar", first: 1) {
            edges {
              node {
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      `);

      const node = data.metaobjects.edges[0]?.node;
      if (!node) return null;

      const get = (key) => node.fields.find(f => f.key === key)?.value || '';
      const activo = get('activo');
      if (activo === 'false') return null;

      return [
        get('mensaje_1'),
        get('mensaje_2'),
        get('mensaje_3'),
      ].filter(Boolean);
    } catch (err) {
      console.error('Error getAnnouncementBar:', err);
      return null;
    }
  })();

  setCache('announcement-bar', promise);
  return promise;
};