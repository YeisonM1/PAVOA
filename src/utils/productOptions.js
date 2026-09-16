// Shopify guarda el nombre de la opcion tal como lo escribio quien creo el
// producto, asi que "TALLA", "Tallas" o "talla" son la misma cosa para una
// persona y cosas distintas para un ===. Cuando no coincidia, la ficha caia al
// respaldo y mostraba "UNICA" en prendas que si tenian S, M y L.
const normalizar = (valor) =>
  String(valor || '')
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const ALIAS = {
  Color: ['color', 'colores', 'colour', 'colours'],
  Talla: ['talla', 'tallas', 'size', 'sizes'],
};

export const coincideNombreOpcion = (actual, esperado) => {
  const nombre = normalizar(actual);
  if (!nombre) return false;
  const alias = ALIAS[esperado] || [normalizar(esperado)];
  return alias.includes(nombre);
};

export const valorDeOpcion = (selectedOptions, esperado) =>
  (Array.isArray(selectedOptions) ? selectedOptions : []).find((opcion) =>
    coincideNombreOpcion(opcion?.name, esperado),
  )?.value || '';
