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
