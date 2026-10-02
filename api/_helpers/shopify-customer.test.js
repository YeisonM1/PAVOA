import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./shopify-customer.js', import.meta.url), 'utf8');

test('el cliente se crea sin consentimiento de marketing', () => {
  // Registrarse no es aceptar publicidad. Marcarlos como suscritos convertiria
  // cualquier campana posterior en correo no solicitado.
  assert.doesNotMatch(source, /emailMarketingConsent/);
  assert.match(source, /input: \{[\s\S]*?email: correo/);
});

test('un correo que ya tiene cliente no se trata como fallo', () => {
  assert.match(source, /yaExiste\(e\.message\)/);
  assert.match(source, /return \{ ok: true, yaExistia: true \}/);
});

test('los errores de GraphQL no pasan desapercibidos', () => {
  // Sin write_customers Shopify responde 200 con el error dentro del cuerpo:
  // mirar solo el codigo HTTP dejaria el fallo mudo.
  assert.match(source, /Array\.isArray\(data\?\.errors\)/);
});

test('crear el cliente nunca puede tumbar un registro', () => {
  assert.match(source, /catch \(err\) \{[\s\S]*?return \{ ok: false/);
  assert.doesNotMatch(source, /throw new Error/);
});
