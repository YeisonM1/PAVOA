import assert from 'node:assert/strict';
import test from 'node:test';

import { productosPorPagina } from './catalogoPaginas.js';

test('en celular, con dos columnas, ninguna prenda queda sola en su fila', () => {
  assert.equal(productosPorPagina(2), 8);
  assert.equal(productosPorPagina(2) % 2, 0);
});

test('en computador, con tres columnas, se mantienen las nueve', () => {
  assert.equal(productosPorPagina(3), 9);
});

test('siempre filas completas, sin pasar de nueve', () => {
  for (const columnas of [1, 2, 3, 4, 5]) {
    const n = productosPorPagina(columnas);
    assert.equal(n % columnas, 0, `con ${columnas} columnas`);
    assert.ok(n <= 9 || n === columnas, `con ${columnas} columnas`);
  }
});

test('un valor raro no deja la pagina vacia', () => {
  assert.equal(productosPorPagina(0), 9);
  assert.equal(productosPorPagina(undefined), 9);
});
