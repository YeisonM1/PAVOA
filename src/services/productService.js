const SHOPIFY_DOMAIN   = import.meta.env.VITE_SHOPIFY_DOMAIN;
const SHOPIFY_TOKEN    = import.meta.env.VITE_SHOPIFY_TOKEN;
const SHOPIFY_ENDPOINT = `https://${SHOPIFY_DOMAIN}/api/2026-04/graphql.json`;

export const SITE_SETTINGS_DEFAULTS = {
  contactEmail: 'hola@pavoa.co',
  contactSchedule: 'Lunes a sábado: 8am – 6pm',
  contactNote: 'Haz tu compra en línea 24/7h',
  responseTime: 'Respondemos todos los mensajes en un máximo de 24 horas hábiles.',
  instagramUrl: 'https://www.instagram.com/pavoacolombia/',
  facebookUrl: 'https://facebook.com/pavoa',
};

export const FILOSOFIA_SECTION_DEFAULTS = {
  tag: 'NUESTRA FILOSOFIA',
  headlineLine1: 'No es ropa.',
  headlineLine2: 'Es armadura.',
  body: 'Cada pieza de PAVOA nace de la conviccion de que la mujer que se mueve con intencion merece ropa que este a su altura. Elegancia natural. Presencia silenciosa.',
  ctaText: 'SOBRE NOSOTROS',
  ctaLink: '/nosotros',
  image: 'https://cdn.shopify.com/s/files/1/0752/0436/2380/files/Filosofia.jpg?width=600&format=webp',
};

export const NOSOTROS_PAGE_DEFAULTS = {
  internalName: 'Nosotros',
  eyebrow: 'Filosofia PAVOA',
  title: 'Una marca con intencion, diseno y vision',
  ctaEyebrow: 'Siguiente paso',
  ctaTitle: 'Explorar coleccion o hablar con nosotros',
  ctaLink1Text: 'Explorar coleccion',
  ctaLink1Url: '/categoria',
  ctaLink2Text: 'Contacto',
  ctaLink2Url: '/contacto',
  blocks: [
    {
      id: 'creemos',
      internalName: 'Creemos',
      order: 1,
      label: '01',
      title: 'Que creemos',
      body: 'Creemos en vestirnos como vivimos: con intencion. PAVOA nace para mujeres que sostienen muchas cosas al mismo tiempo y no necesitan elegir entre verse bien y sentirse capaces. No hacemos ropa para verse deportiva; hacemos piezas para habitar el dia con presencia, desde un entrenamiento temprano hasta una reunion tarde.',
    },
    {
      id: 'materializamos',
      internalName: 'Materializamos',
      order: 2,
      label: '02',
      title: 'Como lo materializamos',
      body: 'Disenamos menos, pero mejor. Cada prenda tiene que pasar una prueba simple: acompanar cuando te mueves de verdad. Trabajamos con siluetas limpias, telas comodas y decisiones que no gritan, pero se notan. Lo funcional no esta peleado con lo elegante; para nosotros, van juntos.',
    },
    {
      id: 'vestimos',
      internalName: 'Vestimos',
      order: 3,
      label: '03',
      title: 'A quien vestimos',
      body: 'Vestimos a la mujer que se cumple a si misma. La que entrena aunque este cansada. La que trabaja con foco. La que no necesita llamar la atencion para tener presencia. PAVOA es para ella: una mujer disciplinada, sensible al detalle y clara con lo que quiere proyectar.',
    },
    {
      id: 'vision',
      internalName: 'Vision',
      order: 4,
      label: '04',
      title: 'Hacia donde vamos',
      body: 'Queremos construir una marca latinoamericana con identidad propia. No perseguimos volumen por volumen. Queremos crecer cuidando el criterio, la calidad y la coherencia de cada coleccion. Nuestra vision es simple: que cuando una mujer piense en activewear premium con caracter, piense en PAVOA.',
    },
  ],
};

export const CONTACT_PAGE_DEFAULTS = {
  internalName: 'Principal',
  eyebrow: 'Estamos aqui',
  title: 'Hablemos',
  informationHeading: 'Informacion',
  emailLabel: 'Email',
  scheduleLabel: 'Horario',
  observationLabel: 'Observacion',
  responseTimeHeading: 'Tiempo de respuesta',
  formHeading: 'Envianos un mensaje',
  guidedRequestEyebrow: 'Solicitud guiada',
  successTitle: 'Mensaje enviado',
  successBody: 'Te respondemos en menos de 24 horas.',
  successButtonText: 'Enviar otro mensaje',
  submitButtonText: 'Enviar mensaje',
  submittingButtonText: 'Enviando...',
};

export const FOOTER_CONTENT_DEFAULTS = {
  internalName: 'Principal',
  newsletterEyebrow: 'NEWSLETTER',
  newsletterTitle: 'Se la primera en enterarte.',
  newsletterBody: 'Nuevas colecciones, descuentos exclusivos y mas.',
  newsletterSuccessText: 'GRACIAS POR SUSCRIBIRTE',
  newsletterInputPlaceholder: 'Tu correo electronico',
  newsletterButtonText: 'SUSCRIBIRSE',
  brandBody: 'Ropa deportiva femenina premium. Elegancia natural. Presencia silenciosa.',
  storeHeading: 'TIENDA',
  helpHeading: 'AYUDA',
  contactHeading: 'CONTACTO',
  copyrightText: '© 2026 PAVOA. TODOS LOS DERECHOS RESERVADOS.',
};

// ── Caché en memoria con TTL ──────────────────────────
const _cache = new Map();
const CACHE_TTL = 60 * 1000; // 60 segundos

const normalizeAnnouncementMessage = (value) =>
  String(value || '')
    .replace(/piezas limitadas/gi, 'Ediciones limitadas')
    .replace(/\s+/g, ' ')
    .trim();

const getMetaobjectFieldValue = (fields, ...keys) =>
  keys
    .map((key) => fields.find((field) => field.key === key)?.value?.trim() || '')
    .find(Boolean) || '';

const getMetaobjectFieldReferences = (fields, ...keys) =>
  keys
    .map((key) => fields.find((field) => field.key === key)?.references?.nodes || [])
    .find((references) => references.length > 0) || [];

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

// Limpiar caché cuando el usuario vuelve a la pestaña
// para que el stock se actualice al regresar
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') _cache.clear();
  });
}
// ──────────────────────────────────────────────────────

export const shopifyFetch = async (query, variables = {}) => {
  const res = await fetch(SHOPIFY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
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

  const imgs = node.images.edges.map(e => e.node.url);

  return {
    id:          node.handle,
    shopifyId:   node.id,
    nombre:      node.title,
    descripcion: node.description,
    precio:      `$${Number(node.priceRange.minVariantPrice.amount).toLocaleString('es-CO')}`,
    precioNumerico: Number(node.priceRange.minVariantPrice.amount),
    imagen1:     imgs[0] || '',
    imagen2:     imgs[1] || '',
    imagen3:     imgs[2] || '',
    imagen4:     imgs[3] || '',
    imagen5:     imgs[4] || '',
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
  images(first: 10) { edges { node { url } } }
  detallesField: metafield(namespace: "pavoa", key: "detalles") { value }
  cuidadosField: metafield(namespace: "pavoa", key: "cuidados") { value }
  variants(first: 20) {
    edges {
      node {
        id quantityAvailable
        selectedOptions { name value }
        metafield(namespace: "custom", key: "hex_color") { value }
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
        metafield(namespace: "custom", key: "hex_color") { value }
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
          image:    getImage('imagen'),
          imageMobile: getImage('imagen_mobile'),
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
      ]
        .map(normalizeAnnouncementMessage)
        .filter(Boolean);
    } catch (err) {
      console.error('Error getAnnouncementBar:', err);
      return null;
    }
  })();

  setCache('announcement-bar', promise);
  return promise;
};


// ── Trae los posts de Instagram desde Shopify Metaobjects ─
export const getInstagramPosts = () => {
  const cached = getCached('instagram-posts');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "instagram_post", first: 6) {
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

      const posts = data.metaobjects.edges.map(({ node }) => {
        const get      = (key) => node.fields.find(f => f.key === key)?.value || '';
        const getImage = (key) => node.fields.find(f => f.key === key)?.reference?.image?.url || '';

        return {
          id:     node.id,
          image:  getImage('image'),
          orden:  Number(get('orden')) || 0,
        };
      });

      // Ordenar por campo "orden"
      return posts.sort((a, b) => a.orden - b.orden);

    } catch (err) {
      console.error('Error getInstagramPosts:', err);
      return [];
    }
  })();

  setCache('instagram-posts', promise);
  return promise;
};

export const getSiteSettings = () => {
  const cached = getCached('site-settings');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "site_settings", first: 1) {
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
      if (!node) return SITE_SETTINGS_DEFAULTS;

      const get = (key) => node.fields.find((field) => field.key === key)?.value?.trim() || '';

      return {
        contactEmail: get('contact_email') || SITE_SETTINGS_DEFAULTS.contactEmail,
        contactSchedule: get('contact_schedule') || SITE_SETTINGS_DEFAULTS.contactSchedule,
        contactNote: get('contact_note') || SITE_SETTINGS_DEFAULTS.contactNote,
        responseTime: get('response_time') || SITE_SETTINGS_DEFAULTS.responseTime,
        instagramUrl: get('instagram_url') || SITE_SETTINGS_DEFAULTS.instagramUrl,
        facebookUrl: get('facebook_url') || SITE_SETTINGS_DEFAULTS.facebookUrl,
      };
    } catch (err) {
      console.error('Error getSiteSettings:', err);
      return SITE_SETTINGS_DEFAULTS;
    }
  })();

  setCache('site-settings', promise);
  return promise;
};

export const getFilosofiaSection = () => {
  const cached = getCached('filosofia-section');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "filosofia_section", first: 1) {
            edges {
              node {
                fields {
                  key
                  value
                  reference {
                    ... on MediaImage {
                      image {
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `);

      const node = data.metaobjects.edges[0]?.node;
      if (!node) return FILOSOFIA_SECTION_DEFAULTS;

      const get = (key) => node.fields.find((field) => field.key === key)?.value?.trim() || '';
      const getImage = (key) => node.fields.find((field) => field.key === key)?.reference?.image?.url || '';

      return {
        tag: get('tag') || FILOSOFIA_SECTION_DEFAULTS.tag,
        headlineLine1: get('headline_line_1') || FILOSOFIA_SECTION_DEFAULTS.headlineLine1,
        headlineLine2: get('headline_line_2') || FILOSOFIA_SECTION_DEFAULTS.headlineLine2,
        body: get('body') || FILOSOFIA_SECTION_DEFAULTS.body,
        ctaText: get('cta_text') || FILOSOFIA_SECTION_DEFAULTS.ctaText,
        ctaLink: get('cta_link') || FILOSOFIA_SECTION_DEFAULTS.ctaLink,
        image: getImage('image') || FILOSOFIA_SECTION_DEFAULTS.image,
      };
    } catch (err) {
      console.error('Error getFilosofiaSection:', err);
      return FILOSOFIA_SECTION_DEFAULTS;
    }
  })();

  setCache('filosofia-section', promise);
  return promise;
};

// ── Verifica stock de los items del carrito antes del pago ─
// Recibe array de { selectedVariantId, cantidad, nombre }
// Devuelve array de errores (vacío = todo OK)
export const getNosotrosPage = () => {
  const cached = getCached('nosotros-page');
  if (cached) return cached;

  const mapNosotrosBlock = (node, index = 0) => {
    const fields = node?.fields || [];
    const order = Number(getMetaobjectFieldValue(fields, 'order'));

    return {
      id: node?.id || getMetaobjectFieldValue(fields, 'internal_name') || `nosotros-block-${index + 1}`,
      internalName: getMetaobjectFieldValue(fields, 'internal_name'),
      order: Number.isFinite(order) && order > 0 ? order : index + 1,
      label: getMetaobjectFieldValue(fields, 'label') || String(index + 1).padStart(2, '0'),
      title: getMetaobjectFieldValue(fields, 'title'),
      body: getMetaobjectFieldValue(fields, 'body'),
    };
  };

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          nosotrosPage: metaobjects(type: "nosotros_page", first: 1) {
            edges {
              node {
                fields {
                  key
                  value
                  references(first: 20) {
                    nodes {
                      ... on Metaobject {
                        id
                        fields {
                          key
                          value
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          nosotrosBlocks: metaobjects(type: "nosotros_block", first: 20) {
            edges {
              node {
                id
                fields {
                  key
                  value
                }
              }
            }
          }
        }
      `);

      const pageNode = data.nosotrosPage.edges[0]?.node;
      const pageFields = pageNode?.fields || [];
      const referencedBlocks = getMetaobjectFieldReferences(pageFields, 'blocks', 'nosotros_blocks');
      const fallbackBlocks = data.nosotrosBlocks.edges.map(({ node }, index) => mapNosotrosBlock(node, index));
      const blocksSource = referencedBlocks.length > 0
        ? referencedBlocks.map((node, index) => mapNosotrosBlock(node, index))
        : fallbackBlocks;
      const blocks = blocksSource
        .filter((block) => block.title || block.body || block.label)
        .sort((a, b) => a.order - b.order);

      if (!pageNode && blocks.length === 0) return NOSOTROS_PAGE_DEFAULTS;

      return {
        internalName: getMetaobjectFieldValue(pageFields, 'internal_name') || NOSOTROS_PAGE_DEFAULTS.internalName,
        eyebrow: getMetaobjectFieldValue(pageFields, 'eyebrow') || NOSOTROS_PAGE_DEFAULTS.eyebrow,
        title: getMetaobjectFieldValue(pageFields, 'title') || NOSOTROS_PAGE_DEFAULTS.title,
        ctaEyebrow: getMetaobjectFieldValue(pageFields, 'cta_eyebrow') || NOSOTROS_PAGE_DEFAULTS.ctaEyebrow,
        ctaTitle: getMetaobjectFieldValue(pageFields, 'cta_title') || NOSOTROS_PAGE_DEFAULTS.ctaTitle,
        ctaLink1Text: getMetaobjectFieldValue(pageFields, 'cta_link_1_text') || NOSOTROS_PAGE_DEFAULTS.ctaLink1Text,
        ctaLink1Url: getMetaobjectFieldValue(pageFields, 'cta_link_1_url') || NOSOTROS_PAGE_DEFAULTS.ctaLink1Url,
        ctaLink2Text: getMetaobjectFieldValue(pageFields, 'cta_link_2_text') || NOSOTROS_PAGE_DEFAULTS.ctaLink2Text,
        ctaLink2Url: getMetaobjectFieldValue(pageFields, 'cta_link_2_url') || NOSOTROS_PAGE_DEFAULTS.ctaLink2Url,
        blocks: blocks.length > 0 ? blocks : NOSOTROS_PAGE_DEFAULTS.blocks,
      };
    } catch (err) {
      console.error('Error getNosotrosPage:', err);
      return NOSOTROS_PAGE_DEFAULTS;
    }
  })();

  setCache('nosotros-page', promise);
  return promise;
};

export const getContactPage = () => {
  const cached = getCached('contact-page');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "contact_page", first: 1) {
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
      if (!node) return CONTACT_PAGE_DEFAULTS;

      const fields = node.fields || [];

      return {
        internalName: getMetaobjectFieldValue(fields, 'internal_name') || CONTACT_PAGE_DEFAULTS.internalName,
        eyebrow: getMetaobjectFieldValue(fields, 'eyebrow') || CONTACT_PAGE_DEFAULTS.eyebrow,
        title: getMetaobjectFieldValue(fields, 'title') || CONTACT_PAGE_DEFAULTS.title,
        informationHeading: getMetaobjectFieldValue(fields, 'information_heading') || CONTACT_PAGE_DEFAULTS.informationHeading,
        emailLabel: getMetaobjectFieldValue(fields, 'email_label') || CONTACT_PAGE_DEFAULTS.emailLabel,
        scheduleLabel: getMetaobjectFieldValue(fields, 'schedule_label') || CONTACT_PAGE_DEFAULTS.scheduleLabel,
        observationLabel: getMetaobjectFieldValue(fields, 'observation_label') || CONTACT_PAGE_DEFAULTS.observationLabel,
        responseTimeHeading: getMetaobjectFieldValue(fields, 'response_time_heading') || CONTACT_PAGE_DEFAULTS.responseTimeHeading,
        formHeading: getMetaobjectFieldValue(fields, 'form_heading') || CONTACT_PAGE_DEFAULTS.formHeading,
        guidedRequestEyebrow: getMetaobjectFieldValue(fields, 'guided_request_eyebrow') || CONTACT_PAGE_DEFAULTS.guidedRequestEyebrow,
        successTitle: getMetaobjectFieldValue(fields, 'success_title') || CONTACT_PAGE_DEFAULTS.successTitle,
        successBody: getMetaobjectFieldValue(fields, 'success_body') || CONTACT_PAGE_DEFAULTS.successBody,
        successButtonText: getMetaobjectFieldValue(fields, 'success_button_text') || CONTACT_PAGE_DEFAULTS.successButtonText,
        submitButtonText: getMetaobjectFieldValue(fields, 'submit_button_text') || CONTACT_PAGE_DEFAULTS.submitButtonText,
        submittingButtonText: getMetaobjectFieldValue(fields, 'submitting_button_text') || CONTACT_PAGE_DEFAULTS.submittingButtonText,
      };
    } catch (err) {
      console.error('Error getContactPage:', err);
      return CONTACT_PAGE_DEFAULTS;
    }
  })();

  setCache('contact-page', promise);
  return promise;
};

export const getFooterContent = () => {
  const cached = getCached('footer-content');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "footer_content", first: 1) {
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
      if (!node) return FOOTER_CONTENT_DEFAULTS;

      const fields = node.fields || [];

      return {
        internalName: getMetaobjectFieldValue(fields, 'internal_name') || FOOTER_CONTENT_DEFAULTS.internalName,
        newsletterEyebrow: getMetaobjectFieldValue(fields, 'newsletter_eyebrow') || FOOTER_CONTENT_DEFAULTS.newsletterEyebrow,
        newsletterTitle: getMetaobjectFieldValue(fields, 'newsletter_title') || FOOTER_CONTENT_DEFAULTS.newsletterTitle,
        newsletterBody: getMetaobjectFieldValue(fields, 'newsletter_body') || FOOTER_CONTENT_DEFAULTS.newsletterBody,
        newsletterSuccessText: getMetaobjectFieldValue(fields, 'newsletter_success_text') || FOOTER_CONTENT_DEFAULTS.newsletterSuccessText,
        newsletterInputPlaceholder: getMetaobjectFieldValue(fields, 'newsletter_input_placeholder') || FOOTER_CONTENT_DEFAULTS.newsletterInputPlaceholder,
        newsletterButtonText: getMetaobjectFieldValue(fields, 'newsletter_button_text') || FOOTER_CONTENT_DEFAULTS.newsletterButtonText,
        brandBody: getMetaobjectFieldValue(fields, 'brand_body') || FOOTER_CONTENT_DEFAULTS.brandBody,
        storeHeading: getMetaobjectFieldValue(fields, 'store_heading') || FOOTER_CONTENT_DEFAULTS.storeHeading,
        helpHeading: getMetaobjectFieldValue(fields, 'help_heading') || FOOTER_CONTENT_DEFAULTS.helpHeading,
        contactHeading: getMetaobjectFieldValue(fields, 'contact_heading') || FOOTER_CONTENT_DEFAULTS.contactHeading,
        copyrightText: getMetaobjectFieldValue(fields, 'copyright_text') || FOOTER_CONTENT_DEFAULTS.copyrightText,
      };
    } catch (err) {
      console.error('Error getFooterContent:', err);
      return FOOTER_CONTENT_DEFAULTS;
    }
  })();

  setCache('footer-content', promise);
  return promise;
};

export const verificarStock = async (cartItems) => {
  const itemsConVariante = cartItems.filter(i => i.producto?.selectedVariantId);
  if (itemsConVariante.length === 0) return [];

  const ids = itemsConVariante.map(i => i.producto.selectedVariantId);

  try {
    const data = await shopifyFetch(`
      query($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on ProductVariant {
            id
            quantityAvailable
          }
        }
      }
    `, { ids });

    const errores = [];
    (data.nodes || []).forEach((node) => {
      if (!node) return;
      const item = itemsConVariante.find(i => i.producto.selectedVariantId === node.id);
      if (!item) return;
      if (node.quantityAvailable < item.cantidad) {
        errores.push(
          node.quantityAvailable === 0
            ? `"${item.producto.nombre}" ya no tiene stock disponible.`
            : `"${item.producto.nombre}" solo tiene ${node.quantityAvailable} unidad${node.quantityAvailable === 1 ? '' : 'es'} disponible${node.quantityAvailable === 1 ? '' : 's'}.`
        );
      }
    });
    return errores;
  } catch (err) {
    console.error('Error verificarStock:', err);
    return []; // Si falla la consulta, dejamos pasar (no bloqueamos el pago)
  }
};
