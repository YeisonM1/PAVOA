import assert from 'node:assert/strict';
import test from 'node:test';

import { diagnosticarClientes, traerClientesShopify } from './clientes-diagnostico.js';

const cliente = ({ id, nombre, correo = null, telefono = null, pedidos = 0, eventos = [] }) => ({
  id: `gid://shopify/Customer/${id}`,
  displayName: nombre,
  createdAt: '2026-09-01T10:00:00Z',
  numberOfOrders: String(pedidos),
  amountSpent: { amount: '0.0' },
  defaultEmailAddress: correo ? { emailAddress: correo, marketingState: 'NOT_SUBSCRIBED' } : null,
  defaultPhoneNumber: telefono ? { phoneNumber: telefono } : null,
  defaultAddress: { city: 'Medellín', province: 'Antioquia' },
  events: { nodes: eventos.map((message) => ({ message, createdAt: '2026-09-01T10:00:00Z' })) },
});

test('un registrado sin compras sigue siendo registrado', () => {
  // Es justo el que ella quiere ver en la pestana: que no se confunda con ruido.
  const { clientes, resumen } = diagnosticarClientes({
    clientes: [cliente({ id: 1, nombre: 'Ana Ruiz', correo: 'ANA@correo.com' })],
    registrados: [{ email: 'ana@correo.com', email_verified: true }],
  });

  assert.equal(clientes[0].clase, 'registrado');
  assert.equal(clientes[0].verificado, true);
  assert.equal(resumen.registrados, 1);
});

test('un comprador sin cuenta no es basura', () => {
  const { clientes } = diagnosticarClientes({
    clientes: [cliente({ id: 2, nombre: 'Luis', correo: 'luis@correo.com', pedidos: 1 })],
  });

  assert.equal(clientes[0].clase, 'comprador');
});

test('sin correo y sin pedidos es huerfano, con o sin correo se distingue', () => {
  const { clientes, resumen } = diagnosticarClientes({
    clientes: [
      cliente({ id: 3, nombre: 'Yeison García' }),
      cliente({ id: 4, nombre: 'Yeison García', correo: 'otro@correo.com' }),
    ],
  });

  assert.deepEqual(clientes.map((c) => c.clase), ['huerfano-sin-correo', 'huerfano-con-correo']);
  assert.equal(resumen.huerfanosSinCorreo, 1);
  assert.equal(resumen.huerfanosConCorreo, 1);
});

test('los repetidos se agrupan aunque cambien tildes, mayusculas o espacios', () => {
  const { repetidos } = diagnosticarClientes({
    clientes: [
      cliente({ id: 5, nombre: 'Yeison García', telefono: '+573001112233' }),
      cliente({ id: 6, nombre: 'yeison  garcia', telefono: '+573001112233' }),
      cliente({ id: 7, nombre: 'YEISON GARCÍA', correo: 'y@correo.com', pedidos: 1 }),
      cliente({ id: 8, nombre: 'Daianna pabon' }),
    ],
  });

  assert.equal(repetidos.length, 1);
  assert.deepEqual(repetidos[0], {
    nombre: 'Yeison García',
    veces: 3,
    conCorreo: 1,
    sinCorreo: 2,
    conPedidos: 1,
    correosDistintos: 1,
    telefonosDistintos: 1,
  });
});

test('un registrado que no esta en Shopify se nombra', () => {
  const { registradosFaltantes, resumen } = diagnosticarClientes({
    clientes: [cliente({ id: 9, nombre: 'Ana', correo: 'ana@correo.com' })],
    registrados: [{ email: 'ana@correo.com' }, { email: 'amiga.espana@correo.es' }],
  });

  assert.deepEqual(registradosFaltantes, ['amiga.espana@correo.es']);
  assert.equal(resumen.registradosQueFaltanEnShopify, 1);
});

test('el origen se lee del historial sin el html de Shopify', () => {
  const { clientes } = diagnosticarClientes({
    clientes: [cliente({ id: 10, nombre: 'X', eventos: ['<a href="/apps/1">PAVOA Backend</a> created this customer.'] })],
  });

  assert.deepEqual(clientes[0].origen, ['PAVOA Backend created this customer.']);
});

test('un error de GraphQL no se devuelve como una lista vacia', async () => {
  // Shopify responde 200 con el error adentro. Sin esto, un permiso faltante
  // se veria como "no hay clientes" y el diagnostico mentiria.
  const r = await traerClientesShopify({
    dominio: 'tienda',
    token: 'secreto',
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({ errors: [{ message: 'Access denied for customers field' }] }),
    }),
  });

  assert.equal(r.ok, false);
  assert.match(r.error, /Access denied/);
});

test('se siguen las paginas hasta el final y se dice si quedo corta', async () => {
  const paginas = [
    { customers: { nodes: [cliente({ id: 1, nombre: 'A' })], pageInfo: { hasNextPage: true, endCursor: 'c1' } } },
    { customers: { nodes: [cliente({ id: 2, nombre: 'B' })], pageInfo: { hasNextPage: true, endCursor: 'c2' } } },
  ];

  const r = await traerClientesShopify({
    dominio: 'tienda',
    token: 'secreto',
    maxPaginas: 2,
    fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({ data: paginas.shift() }) }),
  });

  assert.equal(r.clientes.length, 2);
  assert.equal(r.truncado, true);
});

import { elegirParaBorrar, borrarClientes } from './clientes-diagnostico.js';

const fila = (campos) => ({ id: '1', clase: 'huerfano-sin-correo', pedidos: 0, gastado: 0, verificado: null, ...campos });

test('nunca se elige para borrar a un registrado, aunque no haya comprado', () => {
  const elegidos = elegirParaBorrar({
    filas: [fila({ id: '1', clase: 'registrado', verificado: false })],
  });
  assert.deepEqual(elegidos, []);
});

test('nunca se elige para borrar a quien tenga pedidos o haya gastado', () => {
  const elegidos = elegirParaBorrar({
    filas: [
      fila({ id: '1', clase: 'comprador', pedidos: 1 }),
      // Un huerfano que compro entre la pasada en seco y la real deja de serlo.
      fila({ id: '2', pedidos: 1 }),
      fila({ id: '3', gastado: 19000 }),
    ],
  });
  assert.deepEqual(elegidos, []);
});

test('se eligen los huerfanos, con o sin correo', () => {
  const elegidos = elegirParaBorrar({
    filas: [fila({ id: '1' }), fila({ id: '2', clase: 'huerfano-con-correo' })],
  });
  assert.deepEqual(elegidos.map((f) => f.id), ['1', '2']);
});

test('la pasada real solo borra a quien vino en la lista confirmada', () => {
  // Un huerfano nuevo que aparecio despues de la pasada en seco no se ha
  // revisado: no se toca aunque cumpla las condiciones.
  const elegidos = elegirParaBorrar({
    filas: [fila({ id: '1' }), fila({ id: '99' })],
    confirmados: ['1'],
  });
  assert.deepEqual(elegidos.map((f) => f.id), ['1']);
});

test('un cliente que Shopify se niega a borrar se reporta y se sigue', async () => {
  const r = await borrarClientes({
    dominio: 'tienda',
    token: 'secreto',
    ids: ['1', '2'],
    fetchImpl: async (_url, opts) => {
      const id = JSON.parse(opts.body).variables.input.id;
      const data = id.endsWith('/1')
        ? { customerDelete: { deletedCustomerId: id, userErrors: [] } }
        : { customerDelete: { deletedCustomerId: null, userErrors: [{ message: 'Customer can’t be deleted because they have orders' }] } };
      return { ok: true, status: 200, json: async () => ({ data }) };
    },
  });

  assert.deepEqual(r.borrados, ['1']);
  assert.equal(r.fallidos.length, 1);
  assert.match(r.fallidos[0].motivo, /have orders/);
});
