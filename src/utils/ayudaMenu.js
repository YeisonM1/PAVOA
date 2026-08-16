/**
 * El panel de AYUDA se edita desde PAVOA Control, así que su contenido llega
 * como JSON de Shopify y puede venir incompleto, corrupto o a medio migrar.
 * Todo lo que se renderiza pasa por aquí: el menú nunca debe romperse por un
 * dato mal formado, y lo que se borró a propósito debe seguir borrado.
 */

export const AYUDA_MENU_DEFAULTS = {
  pedidos: {
    titulo: 'PEDIDOS',
    subtitulo: 'LOGÍSTICA',
    enlaces: [
      { label: 'Envíos y entregas', to: '/envios-y-entregas' },
      { label: 'Cambios y devoluciones', to: '/cambios-y-devoluciones' },
      { label: 'Guía de tallas', to: '/guia-de-tallas' },
    ],
  },
  atencion: {
    titulo: 'ATENCIÓN',
    subtitulo: 'INFORMACIÓN',
    enlaces: [
      { label: 'Preguntas frecuentes', to: '/preguntas-frecuentes' },
      { label: 'Contacto', to: '/contacto' },
      { label: 'Nosotros', to: '/nosotros' },
    ],
  },
  soporte: {
    eyebrow: 'SOPORTE',
    lineaFina: 'Siempre',
    lineaFuerte: 'aquí para ti.',
    imagen: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
  },
};

const texto = (valor, porDefecto) => {
  const limpio = String(valor ?? '').trim();
  return limpio || porDefecto;
};

// Un arreglo vacío es una decisión y se respeta. Que la clave no exista es otra
// cosa: ahí sí faltan datos y se usan los de fábrica.
const enlaces = (valor, porDefecto) => {
  if (!Array.isArray(valor)) return porDefecto;
  return valor
    .map((enlace) => ({
      label: String(enlace?.label ?? '').trim(),
      to: String(enlace?.to ?? '').trim(),
    }))
    .filter((enlace) => enlace.label && enlace.to);
};

const columna = (valor, porDefecto) => ({
  titulo: texto(valor?.titulo, porDefecto.titulo),
  subtitulo: texto(valor?.subtitulo, porDefecto.subtitulo),
  enlaces: enlaces(valor?.enlaces, porDefecto.enlaces),
});

export const normalizeAyudaMenu = (raw) => {
  const fuente = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const soporte = fuente.soporte;

  return {
    pedidos: columna(fuente.pedidos, AYUDA_MENU_DEFAULTS.pedidos),
    atencion: columna(fuente.atencion, AYUDA_MENU_DEFAULTS.atencion),
    soporte: {
      eyebrow: texto(soporte?.eyebrow, AYUDA_MENU_DEFAULTS.soporte.eyebrow),
      lineaFina: texto(soporte?.lineaFina, AYUDA_MENU_DEFAULTS.soporte.lineaFina),
      lineaFuerte: texto(soporte?.lineaFuerte, AYUDA_MENU_DEFAULTS.soporte.lineaFuerte),
      // Quitar la imagen es una decisión: el bloque queda con el degradado solo.
      imagen: soporte?.imagen === undefined
        ? AYUDA_MENU_DEFAULTS.soporte.imagen
        : String(soporte.imagen ?? '').trim(),
    },
  };
};
