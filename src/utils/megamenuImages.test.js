import assert from 'node:assert/strict';
import test from 'node:test';

import { getMegamenuImage } from './megamenuImages.js';

const config = (images) => ({
  images,
  mujerSuperior: [{ label: 'Camisetas' }, { label: 'Buzos' }],
  hombre: [{ label: 'Camisetas' }, { label: 'Buzos' }, { label: 'Joggers' }],
});

test('cada lado del menu muestra su foto de Camisetas', () => {
  const c = config({ Camisetas: 'chica.jpg', 'hombre:Camisetas': 'chico.jpg' });
  assert.equal(getMegamenuImage(c, 'mujer', 'Camisetas'), 'chica.jpg');
  assert.equal(getMegamenuImage(c, 'hombre', 'Camisetas'), 'chico.jpg');
});

test('Hombre no muestra la foto de Buzos de Mujer', () => {
  assert.equal(getMegamenuImage(config({ Buzos: 'chica.jpg' }), 'hombre', 'Buzos'), '');
});

test('Joggers conserva la foto que ya tenia', () => {
  assert.equal(getMegamenuImage(config({ Joggers: 'j.jpg' }), 'hombre', 'Joggers'), 'j.jpg');
});
