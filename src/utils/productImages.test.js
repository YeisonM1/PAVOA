import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProductImageCollections } from './productImages.js';

test('keeps every product image in Shopify order', () => {
  const imageNodes = Array.from({ length: 8 }, (_, index) => ({
    url: `image-${index + 1}`,
    altText: '',
  }));

  const result = buildProductImageCollections(imageNodes, []);

  assert.deepEqual(result.images, imageNodes.map((image) => image.url));
});

test('groups color images and shares one variant cover without duplicates', () => {
  const result = buildProductImageCollections(
    [
      { url: 'negro-modelo', altText: 'Negro' },
      { url: 'foto-grupal', altText: 'Chaqueta Astra' },
    ],
    [
      { color: 'Negro', variantImage: 'negro-modelo' },
      { color: 'Verde Pistacho', variantImage: 'foto-grupal' },
      { color: 'Blanco', variantImage: 'foto-grupal' },
    ],
  );

  assert.deepEqual(result.imagesByColor.Negro, ['negro-modelo']);
  assert.deepEqual(result.imagesByColor['Verde Pistacho'], ['foto-grupal']);
  assert.deepEqual(result.imagesByColor.Blanco, ['foto-grupal']);
});
