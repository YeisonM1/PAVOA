import assert from 'node:assert/strict';
import test from 'node:test';

import { acumularDescuadre, esOrdenDelStorefront, traerOrdenesDesde } from './inventario-faltante.js';

const TAGS_WEB = 'pavoa-web,mercadopago';
const orden = (campos) => ({ tags: TAGS_WEB, ...campos });

const linea = (variantId, cantidad, extra = {}) => ({
  variant_id: variantId,
  quantity: cantidad,
  title: 'TOP EVA',
  variant_title: 'NEGRO / S',
  sku: 'EVA-NEG-S',
  ...extra,
});

const respuesta = (status, cuerpo, link = null) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (nombre) => (String(nombre).toLowerCase() === 'link' ? link : null) },
  json: async () => cuerpo,
  text: async () => JSON.stringify(cuerpo),
});

test('lo que sobra es lo vendido', () => {
  const { totalQueSobra, porVariante } = acumularDescuadre([
    orden({ line_items: [linea(111, 2)] }),
    orden({ line_items: [linea(111, 1), linea(222, 3, { variant_title: 'NEGRO / M' })] }),
  ]);

  assert.equal(totalQueSobra, 6);
  assert.equal(porVariante.find((f) => f.variantId === '111').sobran, 3);
  assert.equal(porVariante.find((f) => f.variantId === '222').sobran, 3);
});

test('una devolucion no cambia lo que sobra, solo se informa', () => {
  // La devolucion sube el numero de Shopify y tambien el real —la prenda vuelve
  // al estante— asi que se cancelan. Si se restara, la cuenta quedaria corta.
  const { totalQueSobra, porVariante } = acumularDescuadre([
    orden({
      line_items: [linea(111, 2)],
      refunds: [{ refund_line_items: [{ quantity: 1, line_item: linea(111, 1) }] }],
    }),
  ]);

  assert.equal(totalQueSobra, 2);
  assert.equal(porVariante[0].devueltas, 1);
});

test('una orden cancelada se cuenta aparte, no como sobrante', () => {
  // Nunca se descontó ni se devolvió nada: no mueve la diferencia.
  const { totalQueSobra, canceladas, porVariante } = acumularDescuadre([
    orden({ cancelled_at: '2026-08-01T10:00:00-05:00', line_items: [linea(111, 5)] }),
  ]);

  assert.equal(totalQueSobra, 0);
  assert.equal(canceladas, 1);
  assert.equal(porVariante[0].enCanceladas, 5);
});

test('una linea sin variante no tiene unidades que descontar', () => {
  const { totalQueSobra, porVariante } = acumularDescuadre([
    orden({ line_items: [{ title: 'Ajuste manual', quantity: 1, variant_id: null }] }),
  ]);

  assert.equal(totalQueSobra, 0);
  assert.deepEqual(porVariante, []);
});

test('las tallas salen ordenadas por lo que mas sobra', () => {
  const { porVariante } = acumularDescuadre([
    orden({ line_items: [linea(1, 1, { variant_title: 'NEGRO / S' })] }),
    orden({ line_items: [linea(2, 9, { variant_title: 'NEGRO / L' })] }),
    orden({ line_items: [linea(3, 4, { variant_title: 'NEGRO / M' })] }),
  ]);

  assert.deepEqual(porVariante.map((f) => f.sobran), [9, 4, 1]);
});

test('se sigue la paginacion de Shopify hasta el final', async () => {
  const paginas = [
    respuesta(200, { orders: [orden({ line_items: [linea(111, 1)] })] }, '<https://tienda/pagina2>; rel="next"'),
    respuesta(200, { orders: [orden({ line_items: [linea(111, 1)] })] }),
  ];

  const r = await traerOrdenesDesde({
    dominio: 'tienda',
    token: 'secreto',
    desde: '2026-06-30T00:02:18-05:00',
    fetchImpl: async () => paginas.shift(),
  });

  assert.equal(r.ok, true);
  assert.equal(r.ordenes.length, 2);
  assert.equal(r.paginas, 2);
  assert.equal(r.truncado, false);
});

test('una cuenta incompleta se declara incompleta', async () => {
  // Agotar los diez segundos de Vercel y no devolver nada seria peor, pero un
  // total parcial que se presente como total es lo unico inaceptable.
  const r = await traerOrdenesDesde({
    dominio: 'tienda',
    token: 'secreto',
    desde: '2026-06-30T00:02:18-05:00',
    maxPaginas: 1,
    fetchImpl: async () => respuesta(200, { orders: [] }, '<https://tienda/pagina2>; rel="next"'),
  });

  assert.equal(r.truncado, true);
});

test('un fallo de Shopify no se devuelve como una cuenta en cero', async () => {
  const r = await traerOrdenesDesde({
    dominio: 'tienda',
    token: 'secreto',
    desde: '2026-06-30T00:02:18-05:00',
    fetchImpl: async () => respuesta(401, { errors: 'Invalid API key' }),
  });

  assert.equal(r.ok, false);
  assert.match(r.error, /401/);
});

test('una orden creada a mano en Shopify no cuenta: esa si descontó', () => {
  // Solo las del storefront pasaron por POST /orders.json sin reclamar
  // inventario. Sumar una del panel inflaria el descuadre y mandaria a recontar
  // prendas que estan bien.
  const { totalQueSobra, ajenas } = acumularDescuadre([
    { name: '#1001', tags: 'manual', line_items: [linea(111, 7)] },
  ]);

  assert.equal(totalQueSobra, 0);
  assert.deepEqual(ajenas, [{ orden: '#1001', motivo: 'no nacio en el storefront' }]);
});

test('la etiqueta se reconoce aunque venga con espacios o mayusculas', () => {
  assert.equal(esOrdenDelStorefront({ tags: 'PAVOA-WEB, contraentrega' }), true);
  assert.equal(esOrdenDelStorefront({ tags: 'pavoa-web,mercadopago' }), true);
  assert.equal(esOrdenDelStorefront({ tags: '' }), false);
  assert.equal(esOrdenDelStorefront({}), false);
  // "pavoa-webhook" no es "pavoa-web": se compara la etiqueta entera.
  assert.equal(esOrdenDelStorefront({ tags: 'pavoa-webhook' }), false);
});

test('la ventana se cierra en el arreglo, no sigue abierta hacia el futuro', async () => {
  // Desde que la orden reclama inventario, una venta nueva si descuenta.
  // Contarla haria crecer el descuadre con cada compra —el pedido de prueba
  // #1074 fue el primero que lo habria disparado— y mandaria a restar prendas
  // que ya estan bien.
  let urlUsada = '';
  await traerOrdenesDesde({
    dominio: 'tienda',
    token: 'secreto',
    desde: '2026-06-30T00:02:18-05:00',
    hasta: '2026-10-02T20:46:32-05:00',
    fetchImpl: async (url) => {
      urlUsada = url;
      return respuesta(200, { orders: [] });
    },
  });

  assert.match(urlUsada, /created_at_max=2026-10-02/);
  assert.match(urlUsada, /created_at_min=2026-06-30/);
});

test('sin cierre explicito no se inventa uno', async () => {
  let urlUsada = '';
  await traerOrdenesDesde({
    dominio: 'tienda',
    token: 'secreto',
    desde: '2026-06-30T00:02:18-05:00',
    fetchImpl: async (url) => {
      urlUsada = url;
      return respuesta(200, { orders: [] });
    },
  });

  assert.doesNotMatch(urlUsada, /created_at_max/);
});
