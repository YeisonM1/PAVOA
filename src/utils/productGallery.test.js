import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSwipeImageIndex,
  getThumbnailScrollLeft,
  PRODUCT_EXCHANGE_COPY,
} from './productGallery.js';

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

test('keeps the active mobile thumbnail visible with the smallest scroll movement', () => {
  assert.equal(getThumbnailScrollLeft({
    scrollLeft: 80,
    viewportWidth: 260,
    itemOffsetLeft: 120,
    itemWidth: 72,
    maxScrollLeft: 400,
  }), null);
  assert.equal(getThumbnailScrollLeft({
    scrollLeft: 0,
    viewportWidth: 260,
    itemOffsetLeft: 300,
    itemWidth: 72,
    maxScrollLeft: 400,
  }), 120);
  assert.equal(getThumbnailScrollLeft({
    scrollLeft: 180,
    viewportWidth: 260,
    itemOffsetLeft: 120,
    itemWidth: 72,
    maxScrollLeft: 400,
  }), 112);
});

test('uses the approved two-day exchange message', () => {
  assert.equal(PRODUCT_EXCHANGE_COPY, 'Cambios dentro de los primeros 2 días');
});
