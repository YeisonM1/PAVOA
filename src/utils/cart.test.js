import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCartItem, repairCartItems, resolveVariantImage } from './cart.js';

// Caso real: Body Mist, con la variante más barata en $25.000 y la Rosado L
// en $30.000. El objeto producto trae el mínimo del catálogo y la foto negra.
const IMG_NEGRO = 'https://cdn.shopify.com/body-mist-negro.jpg';
const IMG_ROSADO = 'https://cdn.shopify.com/body-mist-rosado.jpg';

const bodyMist = {
  id: 'body-mist',
  nombre: 'BODY MIST',
  precio: '$25.000',
  precioNumerico: 25000,
  imagen1: IMG_NEGRO,
  imagesByColor: { ROSADO: [IMG_ROSADO], NEGRO: [IMG_NEGRO] },
  variantes: [
    { color: 'NEGRO', talla: 'L', variantId: 'gid://variant/1', precio: '$25.000', precioNumerico: 25000, variantImage: null },
    { color: 'ROSADO', talla: 'L', variantId: 'gid://variant/2', precio: '$30.000', precioNumerico: 30000, variantImage: null },
  ],
};

const rosadoL = bodyMist.variantes[1];

test('the cart item takes the price of the chosen variant, not the catalog minimum', () => {
  const item = buildCartItem(bodyMist, rosadoL, 'ROSADO');

  assert.equal(item.precioNumerico, 30000);
  assert.equal(item.precio, '$30.000');
  assert.equal(item.selectedVariantId, 'gid://variant/2');
  assert.equal(item.colorSeleccionado, 'ROSADO');
});

test('the cart image follows the chosen color through either source', () => {
  // Ficha de producto: el fragmento de detalle no pide image por variante.
  assert.equal(buildCartItem(bodyMist, rosadoL, 'ROSADO').imagen1, IMG_ROSADO);

  // Listados: ahí sí viene variantImage y manda sobre imagesByColor.
  const desdeGrid = { ...rosadoL, variantImage: 'https://cdn.shopify.com/variante.jpg' };
  assert.equal(buildCartItem(bodyMist, desdeGrid, 'ROSADO').imagen1, 'https://cdn.shopify.com/variante.jpg');

  // Sin ninguna de las dos, la imagen principal del producto.
  assert.equal(resolveVariantImage(bodyMist, null, 'AZUL'), IMG_NEGRO);
});

test('a variant without price falls back to the product instead of saving zero', () => {
  const item = buildCartItem(bodyMist, { color: 'ROSADO', talla: 'L', variantId: 'gid://variant/2' }, 'ROSADO');
  assert.equal(item.precioNumerico, 25000);
});

test('carts saved before the fix are repaired from their own variant data', () => {
  // Exactamente lo que quedó guardado: precio mínimo e imagen del otro color.
  const bolsaVieja = [{
    producto: { ...bodyMist, colorSeleccionado: 'ROSADO', selectedVariantId: 'gid://variant/2' },
    talla: 'L',
    cantidad: 1,
  }];

  const { items, changed } = repairCartItems(bolsaVieja);
  assert.equal(changed, true);
  assert.equal(items[0].producto.precioNumerico, 30000);
  assert.equal(items[0].producto.imagen1, IMG_ROSADO);
  assert.equal(items[0].cantidad, 1);
  assert.equal(items[0].talla, 'L');
});

test('a cart that is already correct is left untouched', () => {
  const bolsaBuena = [{
    producto: buildCartItem(bodyMist, rosadoL, 'ROSADO'),
    talla: 'L',
    cantidad: 2,
  }];

  const { items, changed } = repairCartItems(bolsaBuena);
  assert.equal(changed, false);
  assert.equal(items, bolsaBuena);
});
