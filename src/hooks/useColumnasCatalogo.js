import { useSyncExternalStore } from 'react';
import { ANCHO_TRES_COLUMNAS } from '../utils/catalogoPaginas';

const CONSULTA = `(min-width: ${ANCHO_TRES_COLUMNAS}px)`;

const suscribir = (avisar) => {
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener('change', avisar);
  return () => consulta.removeEventListener('change', avisar);
};

const leer = () => (window.matchMedia(CONSULTA).matches ? 3 : 2);

/**
 * Columnas que tiene hoy la cuadricula del catalogo. Se actualiza solo si se
 * gira el celular o cambia el tamano de la ventana.
 */
export const useColumnasCatalogo = () => useSyncExternalStore(suscribir, leer, () => 2);
