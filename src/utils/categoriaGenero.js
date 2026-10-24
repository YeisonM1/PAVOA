// Camisetas, Buzos y Pantalonetas aparecen en el menu de Mujer y en el de
// Hombre. El link lleva el lado del menu para que la categoria no los mezcle.
export const GENEROS_CATALOGO = ['mujer', 'hombre'];

export const leerGenero = (valor) => {
  const genero = String(valor || '').toLowerCase().trim();
  return GENEROS_CATALOGO.includes(genero) ? genero : null;
};

export const categoriaHref = (item, genero) => {
  const base = `/categoria/${String(item).toLowerCase()}`;
  return leerGenero(genero) ? `${base}?genero=${genero}` : base;
};
