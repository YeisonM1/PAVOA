import assert from 'node:assert/strict';
import test from 'node:test';

import { coincideNombreOpcion, valorDeOpcion } from './productOptions.js';

test('el nombre de la opcion coincide sin importar mayusculas ni plural', () => {
  for (const nombre of ['Talla', 'TALLA', 'talla', '  Tallas  ', 'Size']) {
    assert.equal(coincideNombreOpcion(nombre, 'Talla'), true, nombre);
  }

  for (const nombre of ['Color', 'COLOR', 'colores', 'Colour']) {
    assert.equal(coincideNombreOpcion(nombre, 'Color'), true, nombre);
  }
});

test('no confunde una opcion con otra', () => {
  assert.equal(coincideNombreOpcion('Color', 'Talla'), false);
  assert.equal(coincideNombreOpcion('Talla', 'Color'), false);
  assert.equal(coincideNombreOpcion('Material', 'Talla'), false);
  assert.equal(coincideNombreOpcion('', 'Talla'), false);
  assert.equal(coincideNombreOpcion(null, 'Color'), false);
});

test('lee la talla de una prenda guardada en mayusculas', () => {
  // Con === esta variante devolvia vacio y la ficha mostraba "UNICA".
  const selectedOptions = [
    { name: 'Color', value: 'NEGRO' },
    { name: 'TALLA', value: 'M' },
  ];

  assert.equal(valorDeOpcion(selectedOptions, 'Talla'), 'M');
  assert.equal(valorDeOpcion(selectedOptions, 'Color'), 'NEGRO');
});

test('devuelve cadena vacia cuando la opcion no existe', () => {
  assert.equal(valorDeOpcion([{ name: 'Material', value: 'Lycra' }], 'Talla'), '');
  assert.equal(valorDeOpcion(null, 'Color'), '');
});
