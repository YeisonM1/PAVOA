import { formatPrice } from './price.js';

/**
 * El objeto `producto` que devuelve el catálogo trae el precio mínimo de todas
 * las variantes (priceRange.minVariantPrice) y la imagen principal, no los de
 * la selección del cliente. Copiarlo tal cual a la bolsa guardaba el precio de
 * la variante más barata y la foto del primer color, aunque en pantalla se
 * viera otra cosa; el checkout terminaba rechazando el total contra Shopify.
 *
 * Todo lo que entre a la bolsa debe armarse aquí, desde la variante elegida.
 */

const parseVariantes = (variantes) => {
  if (Array.isArray(variantes)) return variantes;
  if (typeof variantes !== 'string') return [];
  try {
    const parsed = JSON.parse(variantes);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const findVariante = (producto, { variantId, color, talla } = {}) => {
  const variantes = parseVariantes(producto?.variantes);
  if (variantes.length === 0) return null;

  if (variantId) {
    const porId = variantes.find((v) => v.variantId === variantId);
    if (porId) return porId;
  }
  if (color && talla) {
    return variantes.find((v) => v.color === color && v.talla === talla) || null;
  }
  return null;
};

/**
 * Cada pantalla tiene una sola de las dos fuentes de imagen: el fragmento de
 * detalle no pide `image` por variante (usa imagesByColor, armado con altText)
 * y el de listados sí la pide pero casi no trae imagesByColor. Se intentan las
 * dos para que la bolsa muestre el color correcto venga de donde venga.
 */
export const resolveVariantImage = (producto, variante, color) => {
  const porColor = color ? producto?.imagesByColor?.[color]?.[0] : null;
  return variante?.variantImage || porColor || producto?.imagen1 || '';
};

/**
 * En los listados la tarjeta muestra la foto del color activo, pero al tocar
 * una talla la variante se buscaba solo por talla: podía agregarse un color
 * distinto al que el cliente tenía en pantalla. Se prefiere el color activo y,
 * si ese color no tiene esa talla, se cae a cualquier variante que sí la tenga
 * en vez de dejar al cliente sin poder agregar.
 */
export const pickVarianteParaTalla = (variantes, talla, hexColorActivo = null) => {
  const lista = Array.isArray(variantes) ? variantes : [];
  const porTalla = (candidatas) =>
    candidatas.find((v) => v.talla === talla && (v.stock ?? 0) > 0)
    || candidatas.find((v) => v.talla === talla)
    || null;

  if (hexColorActivo) {
    const delColorActivo = porTalla(lista.filter((v) => v.hex === hexColorActivo));
    if (delColorActivo) return delColorActivo;
  }

  return porTalla(lista);
};

export const buildCartItem = (producto, variante, color) => {
  const colorFinal = color ?? variante?.color ?? producto?.colorSeleccionado ?? '';
  const precioVariante = Number(variante?.precioNumerico);
  const precioNumerico = Number.isFinite(precioVariante) && precioVariante > 0
    ? precioVariante
    : Number(producto?.precioNumerico || 0);

  return {
    ...producto,
    colorSeleccionado: colorFinal,
    selectedVariantId: variante?.variantId || producto?.selectedVariantId || null,
    precioNumerico,
    precio: variante?.precio || formatPrice(precioNumerico) || producto?.precio || '',
    compareAtPrecio: variante?.compareAtPrecio ?? producto?.compareAtPrecio ?? '',
    compareAtPrecioNumerico:
      variante?.compareAtPrecioNumerico ?? producto?.compareAtPrecioNumerico ?? null,
    imagen1: resolveVariantImage(producto, variante, colorFinal),
  };
};

/**
 * Las bolsas guardadas en localStorage antes de este arreglo siguen con el
 * precio y la imagen equivocados, y fallarían en el checkout igual que antes.
 * Como el item guarda sus propias variantes y el variantId elegido, se pueden
 * reparar al cargar sin pedir nada al servidor.
 */
export const repairCartItems = (items) => {
  if (!Array.isArray(items)) return { items: [], changed: false };

  let changed = false;
  const repaired = items.map((item) => {
    const producto = item?.producto;
    if (!producto) return item;

    const variante = findVariante(producto, {
      variantId: producto.selectedVariantId,
      color: producto.colorSeleccionado,
      talla: item.talla,
    });
    if (!variante) return item;

    const siguiente = buildCartItem(producto, variante, producto.colorSeleccionado);
    if (
      siguiente.precioNumerico === producto.precioNumerico
      && siguiente.imagen1 === producto.imagen1
    ) {
      return item;
    }

    changed = true;
    return { ...item, producto: siguiente };
  });

  return { items: changed ? repaired : items, changed };
};
