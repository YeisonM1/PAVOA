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
  tag: 'NUESTRA FILOSOFÍA',
  headlineLine1: 'No es ropa.',
  headlineLine2: 'Es armadura.',
  body: 'Cada pieza de PAVOA nace de la convicción de que la mujer que se mueve con intención merece ropa que esté a su altura. Elegancia natural. Presencia silenciosa.',
  ctaText: 'SOBRE NOSOTROS',
  ctaLink: '/nosotros',
  image: 'https://cdn.shopify.com/s/files/1/0752/0436/2380/files/Filosofia.jpg?v=1775927011&width=800&format=webp',
};

export const NOSOTROS_PAGE_DEFAULTS = {
  internalName: 'Nosotros',
  eyebrow: 'Sobre nosotros',
  title: 'Filosofía de PAVOA',
  manifesto: 'PAVOA no te da la seguridad, PAVOA la celebra porque ya está en ti.',
  manifestoSupportingText: 'No es un disfraz, es un espejo de quién es la mujer que la usa.',
  introEyebrow: 'Nuestra esencia',
  introTitle: 'Más que una marca, una identidad.',
  introBody: 'PAVOA no nació para seguir tendencias, nació de una necesidad real: encontrar ese punto de equilibrio donde el movimiento y el estilo se encuentran sin sacrificios. Creemos que la ropa deportiva no debería ser un impedimento para verte impecable; al contrario, debe ser la extensión natural de tu estilo de vida.\n\nNo diseñamos para darte seguridad, diseñamos porque sabemos que esa seguridad ya vive en ti. Nuestra misión es representarte: desde la mujer que hoy decide dar su primer paso en el deporte, hasta la atleta de alto rendimiento que domina su disciplina.\n\nEn PAVOA, alguien pensó en ti. Pensamos en la comodidad de cada talla, en la suavidad de cada fibra y en la elegancia de cada corte. No vendemos por vender; solo creamos aquello que nos inspira confianza, glamour y que consideramos una verdadera expresión de arte. Porque si no lo usaríamos nosotros, no es para ti.',
  quote: 'Diseño con alma, pensado por y para la mujer que se mueve con seguridad por el mundo.',
  signature: 'By Daianna P.',
  ctaEyebrow: 'Siguiente paso',
  ctaTitle: 'Explorar colección o hablar con nosotros',
  ctaLink1Text: 'Explorar colección',
  ctaLink1Url: '/categoria',
  ctaLink2Text: 'Contacto',
  ctaLink2Url: '/contacto',
  blocks: [
    {
      id: 'seguridad-movimiento',
      internalName: 'Seguridad en Movimiento',
      order: 1,
      label: '01',
      title: 'Seguridad en Movimiento',
      body: 'Creamos piezas con las que te sientes alineada. No te vistes para entrenar, te vistes para ser tú misma en cada paso.',
    },
    {
      id: 'elegancia-sin-esfuerzo',
      internalName: 'Elegancia sin Esfuerzo',
      order: 2,
      label: '02',
      title: 'Elegancia sin Esfuerzo',
      body: 'Vemos la moda deportiva como una expresión de arte. Queremos que te sientas linda y arreglada, manteniendo la comodidad absoluta como nuestra prioridad no negociable.',
    },
    {
      id: 'compromiso-verdad',
      internalName: 'Compromiso con la Verdad',
      order: 3,
      label: '03',
      title: 'Compromiso con la Verdad',
      body: 'No seguimos modas pasajeras. Solo lanzamos prendas que resaltan tu confianza y que nosotros mismos amamos usar. Si no proyecta seguridad, no lleva nuestro nombre.',
    },
    {
      id: 'todas-versiones',
      internalName: 'Para Todas las Versiones de Ti',
      order: 4,
      label: '04',
      title: 'Para Todas las Versiones de Ti',
      body: 'Desde tu primera carrera de 5 km hasta tu victoria profesional, PAVOA está aquí para simbolizar tu fuerza y tu estilo en cada talla y cada meta.',
    },
  ],
};

export const CONTACT_PAGE_DEFAULTS = {
  internalName: 'Principal',
  eyebrow: 'Estamos aquí',
  title: 'Hablemos',
  informationHeading: 'Información',
  emailLabel: 'Email',
  scheduleLabel: 'Horario',
  observationLabel: 'Observación',
  responseTimeHeading: 'Tiempo de respuesta',
  formHeading: 'Envíanos un mensaje',
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
  newsletterTitle: 'Sé la primera en enterarte.',
  newsletterBody: 'Nuevas colecciones, descuentos exclusivos y más.',
  newsletterSuccessText: 'GRACIAS POR SUSCRIBIRTE',
  newsletterInputPlaceholder: 'Tu correo electrónico',
  newsletterButtonText: 'SUSCRIBIRSE',
  brandBody: 'Ropa deportiva femenina premium. Elegancia natural. Presencia silenciosa.',
  storeHeading: 'TIENDA',
  helpHeading: 'AYUDA',
  contactHeading: 'CONTACTO',
  copyrightText: '© 2026 PAVOA. TODOS LOS DERECHOS RESERVADOS.',
};

// Caché en memoria con TTL
export const HELP_PAGES_DEFAULTS = {
  envios: {
    pageKey: 'envios',
    internalName: 'Envíos y entregas',
    eyebrow: 'Ayuda',
    title: 'Envíos y entregas',
    seoTitle: 'Envíos y entregas',
    seoDescription: 'Información sobre tiempos, cobertura y condiciones de envío en PAVOA.',
    ctaLabel: '',
    ctaUrl: '',
    blocks: [
      {
        id: 'envios-cobertura',
        internalName: 'Cobertura',
        order: 1,
        blockType: 'text',
        title: 'Cobertura',
        body: 'Realizamos envíos a las principales ciudades y municipios de Colombia.',
      },
      {
        id: 'envios-tiempos-estimados',
        internalName: 'Tiempos estimados',
        order: 2,
        blockType: 'text',
        title: 'Tiempos estimados',
        body: 'Ciudades principales: 2 a 5 días hábiles. Otras zonas: 3 a 8 días hábiles.',
      },
      {
        id: 'envios-seguimiento-y-soporte',
        internalName: 'Seguimiento y soporte',
        order: 3,
        blockType: 'text',
        title: 'Seguimiento y soporte',
        body: 'Cuando tu pedido sea despachado, te compartimos la guía de seguimiento. Para apoyo, visita Contacto.',
      },
    ],
  },
  cambios: {
    pageKey: 'cambios',
    internalName: 'Cambios y devoluciones',
    eyebrow: 'Ayuda',
    title: 'Cambios y devoluciones',
    seoTitle: 'Cambios y devoluciones',
    seoDescription: 'Política de cambios y devoluciones de PAVOA.',
    ctaLabel: '',
    ctaUrl: '',
    blocks: [
      {
        id: 'cambios-plazo-para-solicitar',
        internalName: 'Plazo para solicitar',
        order: 1,
        blockType: 'text',
        title: 'Plazo para solicitar',
        body: 'Puedes solicitar cambio o devolución dentro de los primeros 5 días hábiles después de recibir tu pedido.',
      },
      {
        id: 'cambios-condiciones',
        internalName: 'Condiciones',
        order: 2,
        blockType: 'text',
        title: 'Condiciones',
        body: 'La prenda debe estar sin uso, limpia, con etiquetas y en su empaque original.',
      },
      {
        id: 'cambios-inicia-tu-solicitud',
        internalName: 'Inicia tu solicitud',
        order: 3,
        blockType: 'text',
        title: 'Inicia tu solicitud',
        body: 'Ten listo: número de pedido, motivo y fotos del producto.',
      },
    ],
  },
  faq: {
    pageKey: 'faq',
    internalName: 'Preguntas frecuentes',
    eyebrow: 'Ayuda',
    title: 'Preguntas frecuentes',
    seoTitle: 'Preguntas frecuentes',
    seoDescription: 'Resuelve dudas comunes sobre compras, envíos, tallas y cambios en PAVOA.',
    ctaLabel: '',
    ctaUrl: '',
    blocks: [
      {
        id: 'faq-como-se-cuanto-tarda-mi-pedido',
        internalName: '¿Cómo sé cuánto tarda mi pedido?',
        order: 1,
        blockType: 'faq',
        title: '¿Cómo sé cuánto tarda mi pedido?',
        body: 'Al despachar tu compra te enviamos la guía para rastreo. El tiempo depende de la ciudad destino.',
      },
      {
        id: 'faq-puedo-cambiar-la-talla',
        internalName: '¿Puedo cambiar la talla?',
        order: 2,
        blockType: 'faq',
        title: '¿Puedo cambiar la talla?',
        body: 'Sí, siempre que la prenda cumpla condiciones de cambio y lo solicites dentro del plazo.',
      },
      {
        id: 'faq-que-pasa-si-mi-producto-llega-con-novedad',
        internalName: '¿Qué pasa si mi producto llega con novedad?',
        order: 3,
        blockType: 'faq',
        title: '¿Qué pasa si mi producto llega con novedad?',
        body: 'Te ayudamos a gestionarlo de inmediato. Escríbenos con fotos y número de pedido.',
      },
      {
        id: 'faq-tienen-atencion-personalizada',
        internalName: '¿Tienen atención personalizada?',
        order: 4,
        blockType: 'faq',
        title: '¿Tienen atención personalizada?',
        body: 'Sí. Te orientamos por contacto para talla, uso y disponibilidad.',
      },
      {
        id: 'faq-no-encuentras-tu-respuesta',
        internalName: '¿No encuentras tu respuesta?',
        order: 5,
        blockType: 'text',
        title: '¿No encuentras tu respuesta?',
        body: 'Escríbenos desde Contacto y te respondemos en menos de 24 horas hábiles.',
      },
    ],
  },
  guia_tallas: {
    pageKey: 'guia_tallas',
    internalName: 'Guía de tallas',
    eyebrow: 'Ayuda',
    title: 'Guía de tallas',
    seoTitle: 'Guía de tallas',
    seoDescription: 'Encuentra tu talla ideal en PAVOA.',
    ctaLabel: '',
    ctaUrl: '',
    blocks: [
      {
        id: 'guia-tallas-como-medirte',
        internalName: 'Cómo medirte',
        order: 1,
        blockType: 'text',
        title: 'Cómo medirte',
        body: 'Mide alrededor de la parte más llena del busto.\n\nMide la parte más estrecha del torso.\n\nMide alrededor de la parte más ancha de la cadera.',
      },
      {
        id: 'guia-tallas-recomendacion',
        internalName: 'Recomendación',
        order: 2,
        blockType: 'text',
        title: 'Recomendación',
        body: 'Si estás entre dos tallas, elige según tu ajuste preferido: más firme para entrenamiento o más relajado para uso diario.',
      },
      {
        id: 'guia-tallas-te-asesoramos',
        internalName: 'Te asesoramos',
        order: 3,
        blockType: 'text',
        title: 'Te asesoramos',
        body: 'Si tienes duda con una referencia puntual, escríbenos por Contacto.',
      },
    ],
  },
};

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
// ----------------------------------------------------------------

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

const formatPrice = (amount) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return '';
  return `$${numericAmount.toLocaleString('es-CO')}`;
};

// Convierte producto Shopify -> estructura PAVOA
const mapProducto = (node) => {
  const variantes = node.variants.edges.map(({ node: v }) => {
    const hexRaw = v.metafield?.value || '#888888';
    const hex = hexRaw.startsWith('#') ? hexRaw : `#${hexRaw}`;
    const precioNumerico = Number(v.price?.amount ?? node.priceRange.minVariantPrice.amount ?? 0);
    const compareAtPrecioNumericoRaw = Number(v.compareAtPrice?.amount ?? 0);
    const compareAtPrecioNumerico =
      compareAtPrecioNumericoRaw > precioNumerico ? compareAtPrecioNumericoRaw : null;
    return {
      color:     v.selectedOptions.find(o => o.name === 'Color')?.value || '',
      hex,
      talla:     v.selectedOptions.find(o => o.name === 'Talla')?.value || 'ÚNICA',
      stock:     v.quantityAvailable ?? 0,
      variantId: v.id,
      precio: formatPrice(precioNumerico),
      precioNumerico,
      compareAtPrecio: compareAtPrecioNumerico ? formatPrice(compareAtPrecioNumerico) : '',
      compareAtPrecioNumerico,
    };
  });

  const imgs = node.images.edges.map(e => e.node.url);
  const precioNumerico = Number(node.priceRange.minVariantPrice.amount ?? 0);
  const compareAtPrecioNumericoRaw = Number(node.compareAtPriceRange?.minVariantPrice?.amount ?? 0);
  const compareAtPrecioNumerico =
    compareAtPrecioNumericoRaw > precioNumerico ? compareAtPrecioNumericoRaw : null;

  return {
    id:          node.handle,
    shopifyId:   node.id,
    nombre:      node.title,
    descripcion: node.description,
    descripcionHtml: node.descriptionHtml || '',
    precio:      formatPrice(precioNumerico),
    precioNumerico,
    compareAtPrecio: compareAtPrecioNumerico ? formatPrice(compareAtPrecioNumerico) : '',
    compareAtPrecioNumerico,
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

// Fragmento completo (detalle de producto)
const PRODUCT_FIELDS = `
  id handle title description descriptionHtml productType tags
  priceRange { minVariantPrice { amount } }
  compareAtPriceRange { minVariantPrice { amount } }
  images(first: 10) { edges { node { url } } }
  detallesField: metafield(namespace: "pavoa", key: "detalles") { value }
  cuidadosField: metafield(namespace: "pavoa", key: "cuidados") { value }
  variants(first: 20) {
    edges {
      node {
        id quantityAvailable
        price { amount }
        compareAtPrice { amount }
        selectedOptions { name value }
        metafield(namespace: "custom", key: "hex_color") { value }
      }
    }
  }
`;

// Fragmento ligero (listados/grids, sin detalles ni cuidados)
const PRODUCT_FIELDS_LIGHT = `
  id handle title description descriptionHtml productType tags
  priceRange { minVariantPrice { amount } }
  compareAtPriceRange { minVariantPrice { amount } }
  images(first: 2) { edges { node { url } } }
  variants(first: 20) {
    edges {
      node {
        id quantityAvailable
        price { amount }
        compareAtPrice { amount }
        selectedOptions { name value }
        metafield(namespace: "custom", key: "hex_color") { value }
      }
    }
  }
`;

const PRODUCTS_PAGE_SIZE = 100;
const PRODUCTS_MAX_PAGES = 20;

const fetchAllProducts = async () => {
  const products = [];
  let cursor = null;
  let page = 0;
  let hasNextPage = true;

  while (hasNextPage && page < PRODUCTS_MAX_PAGES) {
    const data = await shopifyFetch(`
      query($first: Int!, $after: String) {
        products(first: $first, after: $after) {
          edges {
            cursor
            node { ${PRODUCT_FIELDS_LIGHT} }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `, {
      first: PRODUCTS_PAGE_SIZE,
      after: cursor,
    });

    const edges = data.products?.edges || [];
    products.push(...edges.map(({ node }) => mapProducto(node)));
    hasNextPage = data.products?.pageInfo?.hasNextPage === true;
    cursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;
    page += 1;

    if (hasNextPage && !cursor) {
      console.warn('getProductos: Shopify indicó más páginas pero no devolvió cursor. Se corta la paginación.');
      break;
    }
  }

  if (hasNextPage) {
    console.warn(`getProductos: se alcanzó el límite de ${PRODUCTS_MAX_PAGES} páginas. Revisa el tamaño del catálogo.`);
  }

  return products;
};

// Trae TODOS los productos
export const getProductos = () => {
  const cached = getCached('all-products');
  if (cached) return cached;

  const promise = (async () => {
    try {
      return await fetchAllProducts();
    } catch (err) {
      console.error('Error getProductos:', err);
      return [];
    }
  })();

  setCache('all-products', promise);
  return promise;
};

// Trae UN producto por handle (slug)
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

// Trae info del banner de categoría desde Shopify
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

// Enviar formulario de contacto
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

export const suscribirNewsletter = async ({ email, source = 'storefront_footer' }) => {
  try {
    const res = await fetch('/api/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'newsletter-subscribe',
        email,
        source,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        error: data?.error || 'Error al suscribirse. Intenta de nuevo.',
      };
    }

    return {
      ok: true,
      duplicate: data?.duplicate === true,
    };
  } catch (err) {
    console.error('Error suscribirNewsletter:', err);
    return {
      ok: false,
      error: 'Error al suscribirse. Intenta de nuevo.',
    };
  }
};


// Trae los slides del Hero desde Shopify Metaobjects
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
// Trae las categorías destacadas desde Shopify Metaobjects
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
            image:  getImage('imagen'),   // <- ahora lee desde reference
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

// Trae el announcement bar desde Shopify Metaobjects
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


// Trae los posts de Instagram desde Shopify Metaobjects
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

export const HOME_PRODUCTOS_DEFAULTS = {
  eyebrow: 'Nueva Temporada',
  tituloLinea1: 'TU SEGUNDA',
  tituloLinea2: 'PIEL',
  tabNuevo: 'NUEVO',
  tabBestseller: 'MÁS VENDIDO',
  tabTendencia: 'TENDENCIA',
  emptyEyebrow: 'Próximamente',
  emptyBody: 'Nuevas piezas en camino',
  categoriasEyebrow: 'Descubre la prenda a tu estilo',
  categoriasTitulo: 'DISEÑADO PARA TI',
  categoriasLink: 'Explorar',
};

export const TICKER_DEFAULTS = [
  'Nueva Colección 2026',
  'Envíos a todo el país',
  'Pagos contraentrega',
  'Hecha para rendir',
  'Diseñada para brillar',
  'Colección limitada disponible',
];

export const HERO_SECTION_DEFAULTS = {
  badgeText: 'Envíos a todo el país  -  Ediciones limitadas',
};

export const getHeroSection = () => {
  const cached = getCached('hero-section');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "hero_section", first: 1) {
            edges { node { fields { key value } } }
          }
        }
      `);
      const node = data.metaobjects.edges[0]?.node;
      if (!node) return HERO_SECTION_DEFAULTS;
      const get = (key) => node.fields.find(f => f.key === key)?.value?.trim() || '';
      return {
        badgeText: get('badge_text') || HERO_SECTION_DEFAULTS.badgeText,
      };
    } catch {
      return HERO_SECTION_DEFAULTS;
    }
  })();

  setCache('hero-section', promise);
  return promise;
};

export const getTickerItems = () => {
  const cached = getCached('ticker-bar');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "ticker_bar", first: 1) {
            edges {
              node {
                fields { key value }
              }
            }
          }
        }
      `);
      const node = data.metaobjects.edges[0]?.node;
      if (!node) return TICKER_DEFAULTS;
      const items = node.fields
        .filter(f => f.key.startsWith('item_') && f.value?.trim())
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(f => f.value.trim());
      return items.length > 0 ? items : TICKER_DEFAULTS;
    } catch {
      return TICKER_DEFAULTS;
    }
  })();

  setCache('ticker-bar', promise);
  return promise;
};

export const getHomeProductosSection = () => {
  const cached = getCached('home-productos-section');
  if (cached) return cached;

  const promise = (async () => {
    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "home_productos_section", first: 1) {
            edges {
              node {
                fields { key value }
              }
            }
          }
        }
      `);
      const node = data.metaobjects.edges[0]?.node;
      if (!node) return HOME_PRODUCTOS_DEFAULTS;
      const get = (key) => node.fields.find(f => f.key === key)?.value?.trim() || '';
      return {
        eyebrow:      get('eyebrow')        || HOME_PRODUCTOS_DEFAULTS.eyebrow,
        tituloLinea1: get('titulo_linea_1') || HOME_PRODUCTOS_DEFAULTS.tituloLinea1,
        tituloLinea2: get('titulo_linea_2') || HOME_PRODUCTOS_DEFAULTS.tituloLinea2,
        tabNuevo:     get('tab_nuevo')      || HOME_PRODUCTOS_DEFAULTS.tabNuevo,
        tabBestseller:get('tab_bestseller') || HOME_PRODUCTOS_DEFAULTS.tabBestseller,
        tabTendencia: get('tab_tendencia')  || HOME_PRODUCTOS_DEFAULTS.tabTendencia,
        emptyEyebrow: get('empty_eyebrow')  || HOME_PRODUCTOS_DEFAULTS.emptyEyebrow,
        emptyBody:    get('empty_body')     || HOME_PRODUCTOS_DEFAULTS.emptyBody,
        categoriasEyebrow: get('categorias_eyebrow') || HOME_PRODUCTOS_DEFAULTS.categoriasEyebrow,
        categoriasTitulo:  get('categorias_titulo')  || HOME_PRODUCTOS_DEFAULTS.categoriasTitulo,
        categoriasLink:    get('categorias_link')    || HOME_PRODUCTOS_DEFAULTS.categoriasLink,
      };
    } catch {
      return HOME_PRODUCTOS_DEFAULTS;
    }
  })();

  setCache('home-productos-section', promise);
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

// Verifica stock de los items del carrito antes del pago
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
      const hasModernNosotrosFields = [
        'manifesto',
        'manifesto_supporting_text',
        'intro_body',
        'quote',
        'signature',
      ].some((key) => getMetaobjectFieldValue(pageFields, key));
      const referencedBlocks = getMetaobjectFieldReferences(pageFields, 'philosophy_blocks', 'pillars', 'blocks', 'nosotros_blocks');
      const fallbackBlocks = data.nosotrosBlocks.edges.map(({ node }, index) => mapNosotrosBlock(node, index));
      const blocksSource = referencedBlocks.length > 0
        ? referencedBlocks.map((node, index) => mapNosotrosBlock(node, index))
        : fallbackBlocks;
      const blocks = blocksSource
        .filter((block) => block.title || block.body || block.label)
        .sort((a, b) => a.order - b.order);

      if (!pageNode && blocks.length === 0) return NOSOTROS_PAGE_DEFAULTS;
      if (!hasModernNosotrosFields) {
        return {
          ...NOSOTROS_PAGE_DEFAULTS,
          ctaLink1Text: getMetaobjectFieldValue(pageFields, 'cta_link_1_text') || NOSOTROS_PAGE_DEFAULTS.ctaLink1Text,
          ctaLink1Url: getMetaobjectFieldValue(pageFields, 'cta_link_1_url') || NOSOTROS_PAGE_DEFAULTS.ctaLink1Url,
          ctaLink2Text: getMetaobjectFieldValue(pageFields, 'cta_link_2_text') || NOSOTROS_PAGE_DEFAULTS.ctaLink2Text,
          ctaLink2Url: getMetaobjectFieldValue(pageFields, 'cta_link_2_url') || NOSOTROS_PAGE_DEFAULTS.ctaLink2Url,
        };
      }

      return {
        internalName: getMetaobjectFieldValue(pageFields, 'internal_name') || NOSOTROS_PAGE_DEFAULTS.internalName,
        eyebrow: getMetaobjectFieldValue(pageFields, 'eyebrow') || NOSOTROS_PAGE_DEFAULTS.eyebrow,
        title: getMetaobjectFieldValue(pageFields, 'title') || NOSOTROS_PAGE_DEFAULTS.title,
        manifesto: getMetaobjectFieldValue(pageFields, 'manifesto') || NOSOTROS_PAGE_DEFAULTS.manifesto,
        manifestoSupportingText: getMetaobjectFieldValue(pageFields, 'manifesto_supporting_text') || NOSOTROS_PAGE_DEFAULTS.manifestoSupportingText,
        introEyebrow: getMetaobjectFieldValue(pageFields, 'intro_eyebrow') || NOSOTROS_PAGE_DEFAULTS.introEyebrow,
        introTitle: getMetaobjectFieldValue(pageFields, 'intro_title') || NOSOTROS_PAGE_DEFAULTS.introTitle,
        introBody: getMetaobjectFieldValue(pageFields, 'intro_body') || NOSOTROS_PAGE_DEFAULTS.introBody,
        quote: getMetaobjectFieldValue(pageFields, 'quote') || NOSOTROS_PAGE_DEFAULTS.quote,
        signature: getMetaobjectFieldValue(pageFields, 'signature') || NOSOTROS_PAGE_DEFAULTS.signature,
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

export const getHelpPage = (pageKey) => {
  const normalizedPageKey = String(pageKey || '').trim();
  const fallback = HELP_PAGES_DEFAULTS[normalizedPageKey] || null;
  const cacheKey = `help-page-${normalizedPageKey}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const mapHelpPageBlock = (node, index = 0) => {
    const fields = node?.fields || [];
    const order = Number(getMetaobjectFieldValue(fields, 'order'));

    return {
      id: node?.id || getMetaobjectFieldValue(fields, 'internal_name') || `help-block-${index + 1}`,
      internalName: getMetaobjectFieldValue(fields, 'internal_name'),
      order: Number.isFinite(order) && order > 0 ? order : index + 1,
      blockType: getMetaobjectFieldValue(fields, 'block_type') || 'text',
      title: getMetaobjectFieldValue(fields, 'title'),
      body: getMetaobjectFieldValue(fields, 'body'),
      label: getMetaobjectFieldValue(fields, 'label'),
    };
  };

  const promise = (async () => {
    if (!normalizedPageKey) return fallback;

    try {
      const data = await shopifyFetch(`
        query {
          metaobjects(type: "help_page", first: 20) {
            edges {
              node {
                id
                fields {
                  key
                  value
                  references(first: 50) {
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
        }
      `);

      const pageNode = data.metaobjects.edges
        .map(({ node }) => node)
        .find((node) => {
          const fields = node?.fields || [];
          return getMetaobjectFieldValue(fields, 'page_key') === normalizedPageKey;
        });

      if (!pageNode) return fallback;

      const fields = pageNode.fields || [];
      const referencedBlocks = getMetaobjectFieldReferences(fields, 'blocks_1', 'blocks');
      const blocks = referencedBlocks
        .map((node, index) => mapHelpPageBlock(node, index))
        .filter((block) => block.title || block.body)
        .sort((a, b) => a.order - b.order);

      return {
        pageKey: getMetaobjectFieldValue(fields, 'page_key') || fallback?.pageKey || normalizedPageKey,
        internalName: getMetaobjectFieldValue(fields, 'internal_name') || fallback?.internalName || '',
        eyebrow: getMetaobjectFieldValue(fields, 'eyebrow') || fallback?.eyebrow || '',
        title: getMetaobjectFieldValue(fields, 'title') || fallback?.title || '',
        seoTitle: getMetaobjectFieldValue(fields, 'seo_title') || fallback?.seoTitle || '',
        seoDescription: getMetaobjectFieldValue(fields, 'seo_description') || fallback?.seoDescription || '',
        ctaLabel: getMetaobjectFieldValue(fields, 'cta_label') || fallback?.ctaLabel || '',
        ctaUrl: getMetaobjectFieldValue(fields, 'cta_url') || fallback?.ctaUrl || '',
        blocks: blocks.length > 0 ? blocks : (fallback?.blocks || []),
      };
    } catch (err) {
      console.error(`Error getHelpPage ${normalizedPageKey}:`, err);
      return fallback;
    }
  })();

  setCache(cacheKey, promise);
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


