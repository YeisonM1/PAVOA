import assert from 'node:assert/strict';
import test from 'node:test';

import { getVerifiedPaymentState } from './paymentStatus.js';

test('payment stays unconfirmed while the server verification is running', () => {
  const state = getVerifiedPaymentState({
    verifiedStatus: 'approved',
    isVerifying: true,
  });

  assert.equal(state.effectiveStatus, '');
  assert.equal(state.isApproved, false);
  assert.equal(state.isPending, false);
});

test('payment result is shown only after server verification finishes', () => {
  assert.equal(getVerifiedPaymentState({ verifiedStatus: 'approved', isVerifying: false }).isApproved, true);
  assert.equal(getVerifiedPaymentState({ verifiedStatus: 'pending', isVerifying: false }).isPending, true);
  assert.equal(getVerifiedPaymentState({ verifiedStatus: 'rejected', isVerifying: false }).isRejected, true);
});

test('la pagina sigue preguntando solo mientras el pago este en proceso', async () => {
  const { sigueEnProceso } = await import('./paymentStatus.js');

  assert.equal(sigueEnProceso('pending'), true);
  assert.equal(sigueEnProceso('IN_PROCESS'), true);

  // Aprobado o rechazado ya es respuesta final: seguir preguntando no cambia
  // nada y solo gasta llamadas a Mercado Pago.
  assert.equal(sigueEnProceso('approved'), false);
  assert.equal(sigueEnProceso('rejected'), false);
  assert.equal(sigueEnProceso(''), false);
});

test('el limite de preguntas cubre los diez minutos en que se aprueba un PSE', async () => {
  const { INTERVALO_VERIFICACION_MS, MAX_VERIFICACIONES } = await import('./paymentStatus.js');
  const minutos = (INTERVALO_VERIFICACION_MS * MAX_VERIFICACIONES) / 60_000;

  assert.equal(minutos, 10);
});
