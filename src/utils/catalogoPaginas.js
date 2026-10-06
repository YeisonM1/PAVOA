// El catalogo pasa de 2 a 3 columnas en `lg` de Tailwind (1024px). Este
// numero tiene que coincidir con el `lg:grid-cols-3` de CategoriaPage.
export const ANCHO_TRES_COLUMNAS = 1024;

const MAXIMO_POR_PAGINA = 9;

/**
 * Cuantas prendas mostrar por pagina: el maximo que llene filas completas sin
 * pasar de nueve. Con 9 fijas, en celular —dos columnas— la ultima prenda
 * quedaba sola en su fila, y a la duena no le gustaba. Con dos columnas son 8;
 * con tres, 9.
 */
export const productosPorPagina = (columnas) => {
  const c = Math.max(1, Math.floor(Number(columnas)) || 1);
  return Math.max(c, Math.floor(MAXIMO_POR_PAGINA / c) * c);
};

/**
 * Si la prenda en esa posicion queda sola en la ultima fila. Pasa cuando el
 * total de la pagina deja una sobrante: con 11 productos y 8 por pagina, la
 * segunda pagina tiene 3 y la tercera queda sola. Esa se centra en vez de
 * quedar pegada a la izquierda con un hueco al lado.
 */
export const quedaSolaEnSuFila = (total, indice, columnas = 2) =>
  total % columnas === 1 && indice === total - 1;
