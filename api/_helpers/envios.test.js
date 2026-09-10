import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DEFAULT_NATIONAL_SHIPPING,
  parseShippingConfig,
  resolverEnvio,
  validarShippingConfig,
  zonaDeDestino,
} from './envios.js';

const CONFIG = {
  base: 18900,
  zonas: [
    { nombre: 'Bogotá', departamentos: ['Bogotá D.C.'], precio: 10000 },
    { nombre: 'Sabana de Bogotá', departamentos: ['Cundinamarca'], precio: 14000 },
    {
      nombre: 'Zonas especiales',
      departamentos: ['Amazonas', 'San Andrés y Providencia', 'Vaupés'],
      precio: 35000,
    },
  ],
};

// Lo que pidio la tienda: Bogota y su sabana a una tarifa, el resto de
// Cundinamarca a otra. Los ocho municipios son del mismo departamento que
// Girardot, asi que la unica forma de separarlos es por municipio.
const CONFIG_SABANA = {
  base: 18900,
  zonas: [
    {
      nombre: 'Bogotá y alrededores',
      departamentos: ['Bogotá D.C.'],
      ciudades: ['Soacha', 'Cajicá', 'Sopó', 'Madrid', 'Zipaquirá', 'Chía', 'Facatativá', 'Funza'],
      precio: 12000,
    },
    { nombre: 'Cundinamarca', departamentos: ['Cundinamarca'], precio: 16000 },
    {
      nombre: 'Zonas especiales',
      departamentos: ['Amazonas', 'San Andrés y Providencia'],
      precio: 40000,
    },
  ],
};

test('un departamento en una zona cobra el precio de esa zona', () => {
  assert.equal(resolverEnvio('Bogotá D.C.', CONFIG), 10000);
  assert.equal(resolverEnvio('Cundinamarca', CONFIG), 14000);
  assert.equal(resolverEnvio('Amazonas', CONFIG), 35000);
  assert.equal(resolverEnvio('San Andrés y Providencia', CONFIG), 35000);
});

test('un departamento sin zona cobra la tarifa base', () => {
  assert.equal(resolverEnvio('Antioquia', CONFIG), 18900);
  assert.equal(resolverEnvio('Valle del Cauca', CONFIG), 18900);
  assert.equal(resolverEnvio('Santander', CONFIG), 18900);
});

test('el departamento se compara sin tildes, mayusculas ni puntuacion', () => {
  // El select del checkout manda "Bogotá D.C."; un pedido viejo o una
  // integracion pueden mandar cualquiera de estas formas.
  for (const variante of ['bogota d.c.', 'BOGOTA DC', 'Bogotá D.C.', ' bogota  dc ']) {
    assert.equal(resolverEnvio(variante, CONFIG), 10000, variante);
  }
  assert.equal(resolverEnvio('SAN ANDRES Y PROVIDENCIA', CONFIG), 35000);
});

test('sin departamento cobra la base en vez de reventar', () => {
  assert.equal(resolverEnvio('', CONFIG), 18900);
  assert.equal(resolverEnvio(null, CONFIG), 18900);
  assert.equal(resolverEnvio(undefined, CONFIG), 18900);
});

test('sin configuracion cae al valor por defecto', () => {
  assert.equal(resolverEnvio('Antioquia', null), DEFAULT_NATIONAL_SHIPPING);
  assert.equal(resolverEnvio('Antioquia', undefined), DEFAULT_NATIONAL_SHIPPING);
  assert.equal(resolverEnvio('Antioquia', ''), DEFAULT_NATIONAL_SHIPPING);
  assert.equal(resolverEnvio('Antioquia', 'no soy json'), DEFAULT_NATIONAL_SHIPPING);
});

test('la tarifa unica anterior sigue funcionando', () => {
  // Lo que hay hoy en el metafield `precio_envio` es un numero suelto.
  assert.equal(resolverEnvio('Antioquia', '21000'), 21000);
  assert.equal(resolverEnvio('Bogotá D.C.', 21000), 21000);
  assert.equal(parseShippingConfig('21000').zonas.length, 0);
});

test('el JSON llega como texto desde el metafield', () => {
  const crudo = JSON.stringify(CONFIG);
  assert.equal(resolverEnvio('Cundinamarca', crudo), 14000);
  assert.equal(resolverEnvio('Antioquia', crudo), 18900);
});

test('una zona a cero es envio gratis, no una zona invalida', () => {
  const config = { base: 18900, zonas: [{ nombre: 'Gratis', departamentos: ['Antioquia'], precio: 0 }] };
  assert.equal(resolverEnvio('Antioquia', config), 0);
});

test('se descartan las zonas incompletas sin tumbar el resto', () => {
  const config = {
    base: 18900,
    zonas: [
      { nombre: 'Sin precio', departamentos: ['Tolima'] },
      { nombre: 'Sin departamentos', departamentos: [], precio: 5000 },
      { nombre: 'Buena', departamentos: ['Amazonas'], precio: 30000 },
    ],
  };
  assert.equal(parseShippingConfig(config).zonas.length, 1);
  assert.equal(resolverEnvio('Tolima', config), 18900);
  assert.equal(resolverEnvio('Amazonas', config), 30000);
});

test('zonaDeDestino dice a que zona pertenece', () => {
  assert.equal(zonaDeDestino({ departamento: 'Cundinamarca' }, CONFIG).nombre, 'Sabana de Bogotá');
  assert.equal(zonaDeDestino({ departamento: 'Antioquia' }, CONFIG), null);
  assert.equal(zonaDeDestino({ departamento: '' }, CONFIG), null);
});

test('el municipio le gana al departamento', () => {
  const chia = { departamento: 'Cundinamarca', ciudad: 'Chía' };
  const girardot = { departamento: 'Cundinamarca', ciudad: 'Girardot' };

  assert.equal(resolverEnvio(chia, CONFIG_SABANA), 12000);
  assert.equal(resolverEnvio(girardot, CONFIG_SABANA), 16000);
  assert.equal(zonaDeDestino(chia, CONFIG_SABANA).nombre, 'Bogotá y alrededores');
  assert.equal(zonaDeDestino(girardot, CONFIG_SABANA).nombre, 'Cundinamarca');
});

test('los ocho municipios de la sabana pagan la tarifa de Bogota', () => {
  for (const ciudad of ['Soacha', 'Cajicá', 'Sopó', 'Madrid', 'Zipaquirá', 'Chía', 'Facatativá', 'Funza']) {
    assert.equal(
      resolverEnvio({ departamento: 'Cundinamarca', ciudad }, CONFIG_SABANA),
      12000,
      ciudad,
    );
  }
  assert.equal(resolverEnvio({ departamento: 'Bogotá D.C.', ciudad: 'Bogotá' }, CONFIG_SABANA), 12000);
});

test('un municipio de otro departamento no se cuela por nombre parecido', () => {
  // Madrid tambien existe fuera de Cundinamarca en otros paises, y en Colombia
  // hay municipios homonimos entre departamentos. El municipio manda igual:
  // es lo que la tienda marco en el editor.
  assert.equal(resolverEnvio({ departamento: 'Antioquia', ciudad: 'Medellín' }, CONFIG_SABANA), 18900);
  assert.equal(resolverEnvio({ departamento: 'Amazonas', ciudad: 'Leticia' }, CONFIG_SABANA), 40000);
});

test('sin ciudad decide el departamento', () => {
  assert.equal(resolverEnvio({ departamento: 'Cundinamarca' }, CONFIG_SABANA), 16000);
  assert.equal(resolverEnvio({ departamento: 'Cundinamarca', ciudad: '' }, CONFIG_SABANA), 16000);
});

test('sigue aceptando solo el departamento como antes', () => {
  // La firma vieja recibia un string. Se conserva para no romper llamadas.
  assert.equal(resolverEnvio('Cundinamarca', CONFIG_SABANA), 16000);
  assert.equal(resolverEnvio('Amazonas', CONFIG_SABANA), 40000);
});

test('un municipio en dos zonas no pasa la validacion', () => {
  const ambiguo = {
    base: 18900,
    zonas: [
      { nombre: 'Zona A', ciudades: ['Chía'], precio: 12000 },
      { nombre: 'Zona B', ciudades: ['Chía'], precio: 16000 },
    ],
  };
  const resultado = validarShippingConfig(ambiguo);
  assert.equal(resultado.ok, false);
  assert.match(resultado.errores[0], /Chía/);
});

test('un municipio cuyo departamento esta en otra zona SI es valido', () => {
  // Es justo el caso de la sabana: Chia esta en "Bogota y alrededores" y
  // Cundinamarca en otra zona. No es ambiguo, es la regla.
  assert.equal(validarShippingConfig(CONFIG_SABANA).ok, true);
});

test('un departamento repetido en dos zonas no pasa la validacion', () => {
  const duplicado = {
    base: 18900,
    zonas: [
      { nombre: 'Zona A', departamentos: ['Amazonas'], precio: 30000 },
      { nombre: 'Zona B', departamentos: ['Amazonas'], precio: 40000 },
    ],
  };
  const resultado = validarShippingConfig(duplicado);
  assert.equal(resultado.ok, false);
  assert.match(resultado.errores[0], /Amazonas/);
});

test('una configuracion sana pasa la validacion', () => {
  assert.equal(validarShippingConfig(CONFIG).ok, true);
});

test('la base en cero no pasa la validacion', () => {
  // parseShippingConfig ya repone el default, asi que el caso a cubrir es
  // que una base invalida no se cuele silenciosamente como 0.
  assert.equal(parseShippingConfig({ base: 0, zonas: [] }).base, DEFAULT_NATIONAL_SHIPPING);
});
