import assert from 'node:assert/strict';
import test from 'node:test';

import { getSwipeImageIndex } from './productGallery.js';

test('moves left and right without wrapping at either end', () => {
  assert.equal(getSwipeImageIndex({
    startX: 200, startY: 20, endX: 100, endY: 25, currentIndex: 0, total: 4,
  }), 1);
  assert.equal(getSwipeImageIndex({
    startX: 100, startY: 20, endX: 200, endY: 25, currentIndex: 2, total: 4,
  }), 1);
  assert.equal(getSwipeImageIndex({
    startX: 200, startY: 20, endX: 100, endY: 25, currentIndex: 3, total: 4,
  }), 3);
  assert.equal(getSwipeImageIndex({
    startX: 100, startY: 20, endX: 200, endY: 25, currentIndex: 0, total: 4,
  }), 0);
});

test('ignores short gestures and gestures that are mainly vertical', () => {
  assert.equal(getSwipeImageIndex({
    startX: 100, startY: 20, endX: 75, endY: 22, currentIndex: 1, total: 4,
  }), 1);
  assert.equal(getSwipeImageIndex({
    startX: 100, startY: 20, endX: 80, endY: 140, currentIndex: 1, total: 4,
  }), 1);
});

test('does nothing when there is only one image', () => {
  assert.equal(getSwipeImageIndex({
    startX: 200, startY: 20, endX: 100, endY: 25, currentIndex: 0, total: 1,
  }), 0);
});
