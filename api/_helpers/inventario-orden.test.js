import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fuente = readFileSync(new URL('./mercadopago-order.js', import.meta.url), 'utf8');

// Solo se mira el cuerpo que viaja a Shopify: los comentarios del archivo
// nombran los otros valores de inventory_behaviour a proposito, para explicar
// por que no se usan.
const cuerpoDeLaOrden = fuente.match(/const orderBody = \{[\s\S]*?\n {2}\};/)?.[0];

test('la orden le pide a Shopify que descuente el inventario', () => {
  // Sin este campo Shopify aplica "bypass" y no reclama nada. Fue lo que paso
  // entre el 30 de junio y el 2 de octubre de 2026: al pasar de
  // draft_orders/complete a POST /orders.json para callar el correo nativo, las
  // unidades dejaron de bajar y nadie lo noto.
  assert.ok(cuerpoDeLaOrden, 'debe existir el cuerpo de la orden');
  assert.match(cuerpoDeLaOrden, /inventory_behaviour: 'decrement_ignoring_policy'/);
});

test('se escribe inventory_behaviour, no inventory_behavior', () => {
  // Shopify usa la grafia britanica. Con la americana el campo se ignora en
  // silencio y el inventario vuelve a quedarse quieto: el fallo seria idendico
  // al original y no habria nada en la respuesta que lo delatara.
  assert.doesNotMatch(cuerpoDeLaOrden, /inventory_behavior\b/);
});

test('el inventario se reclama tambien en contraentrega', () => {
  // Una contraentrega reserva la prenda igual que una compra pagada, asi que el
  // descuento no puede depender del estado financiero.
  assert.doesNotMatch(
    cuerpoDeLaOrden,
    /inventory_behaviour:[^,\n]*financialStatus/,
    'el descuento de inventario no puede depender de si la orden esta pagada',
  );
});

test('solo hay un lugar donde nace una orden de Shopify', () => {
  // Es lo que hace que un arreglo baste para los dos flujos. Si manana aparece
  // otra ruta que crea ordenes por su cuenta, esta prueba lo dice antes de que
  // vuelva a haber ventas sin descontar.
  const creaciones = [
    ...fuente.matchAll(/fetch\(\s*`\$\{base\}\/orders\.json`/g),
  ];
  assert.equal(creaciones.length, 1, 'completarDraftOrder debe ser el unico creador de ordenes');

  const pago = readFileSync(new URL('../procesar-pago.js', import.meta.url), 'utf8');
  assert.match(pago, /await completarDraftOrder\(draftOrderId\)/, 'contraentrega debe pasar por la misma funcion');
  assert.doesNotMatch(pago, /\/orders\.json`?,\s*\{\s*method: 'POST'/);
});

test('el inventario se reclama por variante, que es donde Shopify lo cuenta', () => {
  // Con product_id en vez de variant_id Shopify no sabe que unidad descontar y
  // responde 422. Es la otra forma de que esto falle.
  const lineas = fuente.match(/const lineItems = \(draft\.line_items[\s\S]*?\}\)\);/)?.[0];
  assert.ok(lineas, 'deben existir las lineas de la orden');
  assert.match(lineas, /variant_id: li\.variant_id/);
});
