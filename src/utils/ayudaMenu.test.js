import assert from 'node:assert/strict';
import test from 'node:test';

import { AYUDA_MENU_DEFAULTS, normalizeAyudaMenu } from './ayudaMenu.js';

test('a missing or corrupt config falls back to the current menu', () => {
  assert.deepEqual(normalizeAyudaMenu(undefined), AYUDA_MENU_DEFAULTS);
  assert.deepEqual(normalizeAyudaMenu(null), AYUDA_MENU_DEFAULTS);
  assert.deepEqual(normalizeAyudaMenu('no soy un objeto'), AYUDA_MENU_DEFAULTS);
  assert.deepEqual(normalizeAyudaMenu([]), AYUDA_MENU_DEFAULTS);
});

test('present keys survive and missing ones are filled in', () => {
  const config = normalizeAyudaMenu({ pedidos: { titulo: 'ENVÍOS' } });

  assert.equal(config.pedidos.titulo, 'ENVÍOS');
  assert.equal(config.pedidos.subtitulo, AYUDA_MENU_DEFAULTS.pedidos.subtitulo);
  assert.deepEqual(config.pedidos.enlaces, AYUDA_MENU_DEFAULTS.pedidos.enlaces);
  assert.deepEqual(config.atencion, AYUDA_MENU_DEFAULTS.atencion);
});

test('an emptied column stays empty instead of coming back', () => {
  // Borrar todos los enlaces es una decisión, no un dato faltante: la columna
  // debe quedarse vacía en el menú, no repoblarse con los de fábrica.
  const config = normalizeAyudaMenu({ pedidos: { enlaces: [] } });
  assert.deepEqual(config.pedidos.enlaces, []);

  // En cambio una clave ausente sí es un dato faltante.
  const sinClave = normalizeAyudaMenu({ pedidos: { titulo: 'X' } });
  assert.deepEqual(sinClave.pedidos.enlaces, AYUDA_MENU_DEFAULTS.pedidos.enlaces);
});

test('links without label or destination are dropped', () => {
  const config = normalizeAyudaMenu({
    atencion: {
      enlaces: [
        { label: 'Contacto', to: '/contacto' },
        { label: '   ', to: '/vacio' },
        { label: 'Sin destino', to: '' },
        { to: '/sin-label' },
        null,
      ],
    },
  });

  assert.deepEqual(config.atencion.enlaces, [{ label: 'Contacto', to: '/contacto' }]);
});

test('a cleared image stays cleared but an absent one uses the default', () => {
  assert.equal(normalizeAyudaMenu({ soporte: { imagen: '' } }).soporte.imagen, '');
  assert.equal(
    normalizeAyudaMenu({ soporte: { eyebrow: 'AYUDA' } }).soporte.imagen,
    AYUDA_MENU_DEFAULTS.soporte.imagen,
  );
});

test('a full config passes through untouched', () => {
  const completo = {
    pedidos: { titulo: 'A', subtitulo: 'B', enlaces: [{ label: 'L', to: '/l' }] },
    atencion: { titulo: 'C', subtitulo: 'D', enlaces: [{ label: 'M', to: '/m' }] },
    soporte: { eyebrow: 'E', lineaFina: 'F', lineaFuerte: 'G', imagen: 'https://cdn/x.jpg' },
  };

  assert.deepEqual(normalizeAyudaMenu(completo), completo);
});
