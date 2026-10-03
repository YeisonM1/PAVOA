import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const fuente = readFileSync(new URL('../procesar-pago.js', import.meta.url), 'utf8');
const url = fuente.match(/const MP_NOTIFICATION_URL = '([^']+)';/)?.[1];

test('el aviso de Mercado Pago va a la direccion que no redirige', () => {
  // pavoa.com.co sin www responde 307, y Mercado Pago no sigue redirecciones:
  // el aviso moria antes de llegar a la funcion. Los pagos PSE que seguian en
  // proceso quedaban sin orden durante horas.
  assert.ok(url, 'debe existir MP_NOTIFICATION_URL');
  assert.match(url, /^https:\/\/www\.pavoa\.com\.co\/api\/webhook-mercadopago$/);
});

test('la preferencia usa esa direccion y no una armada con APP_URL', () => {
  // APP_URL sale de una variable de entorno que no se ve desde el codigo. Si
  // apunta al dominio sin www, el aviso vuelve a morir en silencio.
  assert.match(fuente, /notification_url: MP_NOTIFICATION_URL,/);
  assert.doesNotMatch(fuente, /notification_url: `\$\{APP_URL\}/);
});
