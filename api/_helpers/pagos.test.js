import assert from 'node:assert/strict';
import test from 'node:test';

process.env.JWT_SECRET = 'pavoa-pagos-test-secret';
process.env.MP_ACCESS_TOKEN = 'TEST-access-token-solo-para-pruebas';
process.env.VITE_SHOPIFY_DOMAIN = 'pavoa-test.myshopify.com';

const { aplicarDescuentoBienvenida, DESCUENTO_BIENVENIDA } = await import('../procesar-pago.js');
const { permiteReintento } = await import('./mercadopago-order.js');

test('a declined payment keeps the draft alive so a second card can still pay', () => {
  // Rechazo y cancelación no cierran el checkout: el cliente sigue en Mercado
  // Pago. Borrar el draft ahí dejaba al pago aprobado sin nada que completar.
  assert.equal(permiteReintento('rejected'), true);
  assert.equal(permiteReintento('cancelled'), true);

  // Un pago aprobado sí consume el draft, y los demás estados no entran aquí.
  assert.equal(permiteReintento('approved'), false);
  assert.equal(permiteReintento('pending'), false);
  assert.equal(permiteReintento('in_process'), false);
  assert.equal(permiteReintento(undefined), false);
});

test('the welcome discount takes exactly 10% off what the customer is charged', () => {
  const [item] = aplicarDescuentoBienvenida([
    { id: '1', title: 'Body mist', quantity: 1, unit_price: 30000, currency_id: 'COP' },
  ]);

  assert.equal(item.unit_price, 27000);
  assert.equal(DESCUENTO_BIENVENIDA, 0.1);
  // Lo que no cambia tiene que sobrevivir intacto: la cantidad y el id son lo
  // que ata el cobro a la variante real.
  assert.equal(item.quantity, 1);
  assert.equal(item.id, '1');
  assert.equal(item.currency_id, 'COP');
});

test('discounted prices stay whole pesos', () => {
  // Mercado Pago cobra en COP y un precio con decimales descuadra el total
  // contra el draft de Shopify, que es contra lo que se valida el pago.
  const items = aplicarDescuentoBienvenida([
    { title: 'A', unit_price: 33333 },
    { title: 'B', unit_price: 15 },
    { title: 'C', unit_price: 1 },
  ]);

  items.forEach((item) => {
    assert.equal(Number.isInteger(item.unit_price), true);
  });
  assert.equal(items[0].unit_price, 30000);
  assert.equal(items[1].unit_price, 14);
  assert.equal(items[2].unit_price, 1);
});

test('the discount describes itself with the original price, not the discounted one', () => {
  const [item] = aplicarDescuentoBienvenida([{ title: 'Body mist', unit_price: 30000 }]);

  assert.match(item.title, /Descuento bienvenida 10%/);
  assert.match(item.description, /Precio original \$30\.000/);
  assert.match(item.description, /Precio final \$27\.000/);
});

test('an empty or malformed cart does not throw', () => {
  assert.deepEqual(aplicarDescuentoBienvenida([]), []);
  assert.deepEqual(aplicarDescuentoBienvenida(null), []);
  assert.equal(aplicarDescuentoBienvenida([{ title: 'X' }])[0].unit_price, 0);
});
