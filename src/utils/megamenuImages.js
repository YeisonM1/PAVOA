// Fotos del menu Catalogo. Las de Mujer se guardan con el nombre solo y las de
// Hombre con "hombre:" delante, para que Camisetas de un lado no muestre la foto
// del otro. pavoa-control (app/megamenu-images.shared.js) guarda con esta regla.
const MUJER_SECTIONS = ['mujerSuperior', 'mujerInferior', 'mujerOtros'];

const cleanLabel = (label) => String(label || '').trim();

const mujerUsaNombre = (config, label) => {
  const buscado = cleanLabel(label).toLowerCase();
  return MUJER_SECTIONS.some((section) =>
    (Array.isArray(config?.[section]) ? config[section] : [])
      .some((item) => cleanLabel(item?.label).toLowerCase() === buscado));
};

export const getMegamenuImage = (config, genero, label) => {
  const images = config?.images || {};
  const cleaned = cleanLabel(label);
  if (!cleaned) return '';
  if (genero !== 'hombre') return images[cleaned] || '';
  if (images[`hombre:${cleaned}`]) return images[`hombre:${cleaned}`];
  // Fotos de Hombre subidas antes de separar los lados (Joggers, por ejemplo).
  return mujerUsaNombre(config, cleaned) ? '' : images[cleaned] || '';
};
