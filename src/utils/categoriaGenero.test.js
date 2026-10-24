import assert from 'node:assert/strict';
import test from 'node:test';

import { categoriaHref, leerGenero } from './categoriaGenero.js';

test('el link del menu lleva el lado de Mujer u Hombre', () => {
  assert.equal(categoriaHref('Camisetas', 'mujer'), '/categoria/camisetas?genero=mujer');
  assert.equal(categoriaHref('Buzos', 'hombre'), '/categoria/buzos?genero=hombre');
});

test('sin genero el link queda como antes', () => {
  assert.equal(categoriaHref('Camisetas'), '/categoria/camisetas');
  assert.equal(categoriaHref('Camisetas', 'otro'), '/categoria/camisetas');
});

test('solo acepta mujer u hombre desde la URL', () => {
  assert.equal(leerGenero('HOMBRE'), 'hombre');
  assert.equal(leerGenero(' mujer '), 'mujer');
  assert.equal(leerGenero('unisex'), null);
  assert.equal(leerGenero(null), null);
});
