import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buscarPagosAprobados,
  conciliarPagosAprobados,
  describirReferencia,
  esReferenciaPavoa,
  seleccionarHuerfanos,
} from './mp-reconcile.js';

const pagoAprobado = (id, referencia = '1060511613068|ana@correo.com|0') => ({
  id,
  status: 'approved',
  external_reference: referencia,
});

const respuesta = (status, cuerpo) => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => JSON.stringify(cuerpo),
});

test('solo se reconocen los pagos que nacieron en el checkout', () => {
  assert.equal(esReferenciaPavoa('1060511613068|ana@correo.com|1'), true);
  assert.equal(esReferenciaPavoa('1060511613068|ana@correo.com|0'), true);

  // Un cobro hecho a mano desde Mercado Pago no tiene draft que convertir en
  // orden: procesarlo no haria nada y ensuciaria el reporte.
  assert.equal(esReferenciaPavoa(''), false);
  assert.equal(esReferenciaPavoa(null), false);
  assert.equal(esReferenciaPavoa('pedido-de-prueba'), false);
  assert.equal(esReferenciaPavoa('1060511613068|ana@correo.com'), false);
});

test('un pago que ya tiene pedido no se vuelve a procesar', () => {
  const { huerfanos, descartados } = seleccionarHuerfanos({
    pagos: [pagoAprobado('181848593392'), pagoAprobado('999')],
    idsConPedido: ['181848593392'],
  });

  assert.deepEqual(huerfanos, ['999']);
  assert.deepEqual(descartados, [{ paymentId: '181848593392', motivo: 'ya tiene pedido' }]);
});

test('cada descarte dice por que, no solo que no quedo nada', () => {
  const { huerfanos, descartados } = seleccionarHuerfanos({
    pagos: [
      { id: '1', status: 'pending', external_reference: '10|ana@correo.com|0' },
      { id: '2', status: 'approved', external_reference: '' },
    ],
  });

  assert.deepEqual(huerfanos, []);
  assert.deepEqual(descartados, [
    { paymentId: '1', motivo: 'status pending' },
    { paymentId: '2', motivo: 'cobro sin referencia, hecho por fuera de la tienda' },
  ]);
});

test('un cobro de fuera de la tienda no se confunde con una referencia a medias', () => {
  // Los dos se descartan, pero el primero es rutina y el segundo es dinero
  // cobrado que quizas no llego a ser pedido. Tratarlos igual fue lo que dejo
  // el pago 178269392080 descartado en silencio.
  assert.equal(describirReferencia('').clase, 'ausente');
  assert.equal(describirReferencia(null).clase, 'ausente');
  assert.equal(describirReferencia('1060511613068|ana@correo.com|0').clase, 'completa');
  assert.equal(describirReferencia('2000018392202434').clase, 'incompleta');
  assert.equal(describirReferencia('2000018392202434|ana@correo.com').clase, 'incompleta');
});

test('el motivo no delata el correo del cliente', () => {
  const { motivo } = describirReferencia('2000018392202434|ana@correo.com');
  assert.doesNotMatch(motivo, /ana@correo.com/);
  assert.equal(motivo, 'referencia incompleta (2 partes)');
});

test('una referencia a medias sin pedido se avisa, no se traga', () => {
  const { huerfanos, anomalias } = seleccionarHuerfanos({
    pagos: [
      { id: '178269392080', status: 'approved', external_reference: '2000018392202434' },
      { id: '55', status: 'approved', external_reference: '' },
    ],
  });

  assert.deepEqual(huerfanos, []);
  assert.deepEqual(anomalias, [{ paymentId: '178269392080', motivo: 'referencia incompleta (1 parte)' }]);
});

test('una referencia a medias que ya tiene pedido no se avisa', () => {
  // Avisar cada diez minutos de un pago que esta bien seria ruido, y el ruido
  // acaba tapando el aviso que si importa.
  const { anomalias, descartados } = seleccionarHuerfanos({
    pagos: [{ id: '178269392080', status: 'approved', external_reference: '2000018392202434' }],
    idsConPedido: ['178269392080'],
  });

  assert.deepEqual(anomalias, []);
  assert.deepEqual(descartados, [{ paymentId: '178269392080', motivo: 'ya tiene pedido' }]);
});

test('se le pregunta a Supabase por todo pago aprobado, no solo por los de referencia limpia', async () => {
  // Si solo se preguntara por los limpios, un pago de referencia rara que ya
  // tiene pedido se reportaria como anomalia para siempre.
  let consultados = [];
  const resultado = await conciliarPagosAprobados({
    buscar: async () => ({
      ok: true,
      rango: 'date_last_updated',
      total: 2,
      pagos: [
        pagoAprobado('44'),
        { id: '178269392080', status: 'approved', external_reference: '2000018392202434' },
      ],
    }),
    pedidosExistentes: async (ids) => {
      consultados = ids;
      return ['44', '178269392080'];
    },
    procesar: async () => assert.fail('no habia nada que rescatar'),
  });

  assert.deepEqual(consultados.sort(), ['178269392080', '44']);
  assert.deepEqual(resultado.anomalias, []);
});

test('lo que no cabe en la tanda queda anotado, no perdido', () => {
  // La funcion de Vercel se corta a los diez segundos. Si un lote se recorta en
  // silencio, el reporte diria "revisados: 3" y nadie sabria que faltaban dos.
  const { huerfanos, postergados } = seleccionarHuerfanos({
    pagos: ['1', '2', '3', '4', '5'].map((id) => pagoAprobado(id)),
    tope: 3,
  });

  assert.deepEqual(huerfanos, ['1', '2', '3']);
  assert.deepEqual(postergados, ['4', '5']);
});

test('un pago repetido en la respuesta se procesa una sola vez', () => {
  const { huerfanos } = seleccionarHuerfanos({
    pagos: [pagoAprobado('7'), pagoAprobado('7')],
  });

  assert.deepEqual(huerfanos, ['7']);
});

test('si la cuenta no admite el rango por actualizacion, se busca por creacion', async () => {
  const urls = [];
  const resultado = await buscarPagosAprobados({
    accessToken: 'token-de-prueba',
    fetchImpl: async (url) => {
      urls.push(url);
      if (url.includes('date_last_updated')) return respuesta(400, { message: 'invalid range' });
      return respuesta(200, { paging: { total: 1 }, results: [pagoAprobado('5')] });
    },
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.rango, 'date_created');
  assert.equal(resultado.pagos.length, 1);
  assert.equal(urls.length, 2);
});

test('se busca por fecha de actualizacion para no perder un pago viejo aprobado hoy', async () => {
  // Una transferencia creada hace nueve dias y aprobada hoy es justo la que hay
  // que rescatar, y por fecha de creacion no aparece.
  let urlUsada = '';
  await buscarPagosAprobados({
    accessToken: 'token-de-prueba',
    fetchImpl: async (url) => {
      urlUsada = url;
      return respuesta(200, { paging: { total: 0 }, results: [] });
    },
  });

  assert.match(urlUsada, /range=date_last_updated/);
  assert.match(urlUsada, /status=approved/);
});

test('una busqueda fallida no se reporta como "nada que rescatar"', async () => {
  // Es la confusion que importa: si un fallo de la consulta se viera igual que
  // una tanda limpia, el pedido perdido volveria a pasar desapercibido.
  const resultado = await conciliarPagosAprobados({
    buscar: async () => ({ ok: false, error: 'Mercado Pago respondio 401' }),
    pedidosExistentes: async () => assert.fail('no deberia consultarse Supabase'),
    procesar: async () => assert.fail('no deberia procesarse ningun pago'),
  });

  assert.equal(resultado.ok, false);
  assert.match(resultado.error, /401/);
});

test('un pago aprobado sin pedido se rescata y queda nombrado', async () => {
  const procesados = [];
  const resultado = await conciliarPagosAprobados({
    buscar: async () => ({ ok: true, rango: 'date_last_updated', total: 2, pagos: [pagoAprobado('181848593392'), pagoAprobado('777')] }),
    pedidosExistentes: async () => ['777'],
    procesar: async (paymentId) => {
      procesados.push(paymentId);
      return { shopifyCompleted: true, shopifyOrderName: '#1072' };
    },
  });

  assert.deepEqual(procesados, ['181848593392']);
  assert.equal(resultado.ok, true);
  assert.deepEqual(resultado.rescatados, [{ paymentId: '181848593392', orden: '#1072' }]);
  assert.equal(resultado.aprobadosEnVentana, 2);
});

test('un pago que no llega a orden se reporta, no se da por rescatado', async () => {
  const resultado = await conciliarPagosAprobados({
    buscar: async () => ({ ok: true, rango: 'date_created', total: 1, pagos: [pagoAprobado('12')] }),
    pedidosExistentes: async () => [],
    procesar: async () => ({ shopifyCompleted: false, status: 'underpaid' }),
  });

  assert.deepEqual(resultado.rescatados, []);
  assert.deepEqual(resultado.sinCambio, [{ paymentId: '12', status: 'underpaid' }]);
});

test('si Supabase falla no se tratan todos los pagos como huerfanos', async () => {
  const resultado = await conciliarPagosAprobados({
    buscar: async () => ({ ok: true, rango: 'date_created', total: 1, pagos: [pagoAprobado('12')] }),
    pedidosExistentes: async () => {
      throw new Error('conexion rechazada');
    },
    procesar: async () => assert.fail('no deberia procesarse a ciegas'),
  });

  assert.equal(resultado.ok, false);
  assert.match(resultado.error, /conexion rechazada/);
});
