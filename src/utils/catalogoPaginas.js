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
