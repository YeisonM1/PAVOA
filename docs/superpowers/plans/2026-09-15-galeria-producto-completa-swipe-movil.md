# Galeria completa de producto y swipe movil - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mostrar todas las imagenes antes de elegir color, conservar las galerias filtradas, habilitar swipe movil y permitir una portada grupal compartida para colores sin modelo.

**Architecture:** El storefront separara la construccion de colecciones de imagenes y el calculo del gesto en helpers puros. PAVOA Control conservara las galerias exclusivas por color, pero permitira que una imagen declarada compartida sea portada de varias variantes mediante las vinculaciones de media que Shopify ya soporta.

**Tech Stack:** React 19, Vite 8, Shopify Storefront API, React Router 7, Shopify Admin GraphQL, `node:test`.

## Global Constraints

- No cambiar el diseno aprobado de la PDP ni del editor.
- No agregar dependencias ni nuevas pantallas.
- Navegar imagenes no selecciona colores.
- Las fotos de modelo y sus asignaciones actuales siguen funcionando.
- La imagen compartida no se duplica en Shopify.
- Validar build en ambos repositorios.
- Preservar todos los cambios locales preexistentes del usuario.

---

### Task 1: Construir todas las colecciones de imagenes del storefront

**Files:**
- Create: `D:\Proyectos\PAVOA\src\utils\productImages.js`
- Test: `D:\Proyectos\PAVOA\src\utils\productImages.test.js`
- Modify: `D:\Proyectos\PAVOA\src\services\productService.js`

**Interfaces:**
- Consumes: `imageNodes: Array<{url, altText}>` y `variants: Array<{color, variantImage}>`.
- Produces: `buildProductImageCollections(imageNodes, variants) => { images, imagesByColor }`.

- [ ] **Step 1: Escribir la prueba que falla**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildProductImageCollections } from './productImages.js';

test('keeps all images and shares one variant cover across colors', () => {
  const imageNodes = [
    { url: 'modelo-negro', altText: 'Negro' },
    { url: 'foto-grupal', altText: 'Chaqueta Astra' },
    ...Array.from({ length: 6 }, (_, index) => ({ url: `extra-${index}` })),
  ];
  const result = buildProductImageCollections(imageNodes, [
    { color: 'Negro', variantImage: 'modelo-negro' },
    { color: 'Verde', variantImage: 'foto-grupal' },
    { color: 'Blanco', variantImage: 'foto-grupal' },
  ]);

  assert.equal(result.images.length, 8);
  assert.deepEqual(result.imagesByColor.Negro, ['modelo-negro']);
  assert.deepEqual(result.imagesByColor.Verde, ['foto-grupal']);
  assert.deepEqual(result.imagesByColor.Blanco, ['foto-grupal']);
});
```

- [ ] **Step 2: Confirmar el fallo**

Run: `cd D:\Proyectos\PAVOA && node --test src/utils/productImages.test.js`  
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar el helper minimo**

```js
const uniqueUrls = (values) => [...new Set(values.filter(Boolean))];

export const buildProductImageCollections = (imageNodes = [], variants = []) => {
  const images = uniqueUrls(imageNodes.map((image) => image?.url));
  const colors = new Set(variants.map((variant) => variant?.color).filter(Boolean));
  const imagesByColor = {};

  imageNodes.forEach(({ url, altText } = {}) => {
    if (!url || !altText || !colors.has(altText)) return;
    imagesByColor[altText] = uniqueUrls([...(imagesByColor[altText] || []), url]);
  });
  variants.forEach(({ color, variantImage } = {}) => {
    if (!color || !variantImage) return;
    imagesByColor[color] = uniqueUrls([variantImage, ...(imagesByColor[color] || [])]);
  });
  return { images, imagesByColor };
};
```

- [ ] **Step 4: Integrar en `productService.js`**

Importar el helper; reemplazar la construccion local; devolver `imagenes: images`; mantener `imagen1` a `imagen5`; cambiar `images(first: 10)` por `images(first: 50)`; agregar `image { url }` a las variantes del fragmento completo.

- [ ] **Step 5: Verificar y commit**

Run: `npm test`  
Expected: PASS.

```powershell
git add src/utils/productImages.js src/utils/productImages.test.js src/services/productService.js
git commit -m "Load every product image and shared color covers"
```

---

### Task 2: Mostrar todas las fotos y navegar con swipe

**Files:**
- Create: `D:\Proyectos\PAVOA\src\utils\productGallery.js`
- Test: `D:\Proyectos\PAVOA\src\utils\productGallery.test.js`
- Modify: `D:\Proyectos\PAVOA\src\pages\ProductPage.jsx`
- Modify: `D:\Proyectos\PAVOA\src\components\product\ProductGallery.jsx`

**Interfaces:**
- Produces: `getSwipeImageIndex({ startX, startY, endX, endY, currentIndex, total, threshold? }) => number`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { getSwipeImageIndex } from './productGallery.js';

test('moves horizontally without wrapping', () => {
  assert.equal(getSwipeImageIndex({ startX: 200, startY: 20, endX: 100, endY: 25, currentIndex: 0, total: 4 }), 1);
  assert.equal(getSwipeImageIndex({ startX: 100, startY: 20, endX: 200, endY: 25, currentIndex: 2, total: 4 }), 1);
  assert.equal(getSwipeImageIndex({ startX: 200, startY: 20, endX: 100, endY: 25, currentIndex: 3, total: 4 }), 3);
});

test('ignores short and vertical gestures', () => {
  assert.equal(getSwipeImageIndex({ startX: 100, startY: 20, endX: 75, endY: 22, currentIndex: 1, total: 4 }), 1);
  assert.equal(getSwipeImageIndex({ startX: 100, startY: 20, endX: 80, endY: 140, currentIndex: 1, total: 4 }), 1);
});
```

- [ ] **Step 2: Confirmar el fallo**

Run: `node --test src/utils/productGallery.test.js`  
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar el calculo del gesto**

```js
export const getSwipeImageIndex = ({ startX, startY, endX, endY, currentIndex, total, threshold = 48 }) => {
  if (total <= 1) return currentIndex;
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) return currentIndex;
  return deltaX < 0 ? Math.min(currentIndex + 1, total - 1) : Math.max(currentIndex - 1, 0);
};
```

- [ ] **Step 4: Integrar la galeria completa**

En `ProductPage.jsx`, usar `producto.imagenes` con respaldo legacy. Quitar de `handleSelectImage` la busqueda de `imageColor` y la llamada a `applyVariantColor`; navegar fotos solo cambia el indice.

- [ ] **Step 5: Integrar swipe y scroll interno**

En `ProductGallery.jsx`, guardar las coordenadas de `touchstart` sobre la imagen principal movil y resolver `touchend` con el helper. Aplicar `touchAction: 'pan-y'`; añadir `overflowX: 'auto'` a la fila movil y `maxHeight: '78vh', overflowY: 'auto', overscrollBehavior: 'contain'` a la columna de miniaturas de escritorio.

- [ ] **Step 6: Verificar y commit**

Run: `npm test`  
Run: `npx eslint src/utils/productGallery.js src/pages/ProductPage.jsx src/components/product/ProductGallery.jsx`  
Run: `npm run build`  
Expected: exit 0.

```powershell
git add src/utils/productGallery.js src/utils/productGallery.test.js src/pages/ProductPage.jsx src/components/product/ProductGallery.jsx
git commit -m "Show the full gallery and add mobile swipe"
```

---

### Task 3: Persistir una portada compartida en PAVOA Control

**Files:**
- Create: `D:\Proyectos\pavoa-control\app\shared-color-image.js`
- Test: `D:\Proyectos\pavoa-control\app\shared-color-image.test.js`
- Modify: `D:\Proyectos\pavoa-control\app\product-edit.server.js`

**Interfaces:**
- Produces: `applySharedColorImage(state, imageId, selectedColors)`.
- Produces: `normalizeSharedColorSelection(imageId, selectedColors, validColors, validMediaIds)`.

- [ ] **Step 1: Escribir las pruebas que fallan**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { applySharedColorImage, normalizeSharedColorSelection } from './shared-color-image.js';

test('shares one cover without deleting model photos', () => {
  const next = applySharedColorImage({
    colorGalleryAssignments: { Negro: ['modelo-negro'], Blanco: [] },
    colorCoverAssignments: { Negro: 'modelo-negro', Blanco: '' },
    previousSharedImageId: '', previousSharedColors: [],
  }, 'foto-grupal', ['Blanco']);
  assert.deepEqual(next.colorGalleryAssignments.Negro, ['modelo-negro']);
  assert.deepEqual(next.colorGalleryAssignments.Blanco, ['foto-grupal']);
  assert.equal(next.colorCoverAssignments.Negro, 'modelo-negro');
  assert.equal(next.colorCoverAssignments.Blanco, 'foto-grupal');
});

test('removes a shared cover only from deselected colors', () => {
  const next = applySharedColorImage({
    colorGalleryAssignments: { Blanco: ['foto-grupal'], Verde: ['foto-grupal'] },
    colorCoverAssignments: { Blanco: 'foto-grupal', Verde: 'foto-grupal' },
    previousSharedImageId: 'foto-grupal', previousSharedColors: ['Blanco', 'Verde'],
  }, 'foto-grupal', ['Verde']);
  assert.deepEqual(next.colorGalleryAssignments.Blanco, []);
  assert.deepEqual(next.colorGalleryAssignments.Verde, ['foto-grupal']);
});

test('drops invalid colors and media IDs', () => {
  assert.deepEqual(
    normalizeSharedColorSelection('foto-grupal', ['Blanco', 'Fantasma'], ['Blanco'], ['foto-grupal']),
    { imageId: 'foto-grupal', colors: ['Blanco'] },
  );
});
```

- [ ] **Step 2: Confirmar el fallo**

Run: `cd D:\Proyectos\pavoa-control && node --test app/shared-color-image.test.js`  
Expected: FAIL con `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar los helpers**

Deduplicar IDs; retirar la imagen compartida anterior solo de sus colores previos; añadir la nueva como primera imagen y portada de cada color marcado; conservar todas las demas imagenes y portadas.

- [ ] **Step 4: Integrar en el servidor**

Extender `normalizeGalleryAssignments` con `sharedImageId` y `sharedColors`: las imagenes normales siguen siendo exclusivas, pero `sharedImageId` se permite en todos los colores marcados. Omitir ese ID al construir `assignedColorByMediaId` para no convertir su alt en un color individual. Pasar `sharedColorImageId` y `sharedColorNames` desde el payload.

- [ ] **Step 5: Reconstruir el estado al cargar**

En `buildGallerySnapshot`, agrupar `coverImageByColor` por media ID. La portada usada por dos o mas colores se devuelve como `sharedColorImageId` y `sharedColorNames`, y se inserta al inicio de esas galerias para que el editor refleje lo guardado.

- [ ] **Step 6: Verificar y commit**

Run: `node --test app/shared-color-image.test.js`  
Expected: PASS.

```powershell
git add app/shared-color-image.js app/shared-color-image.test.js app/product-edit.server.js
git commit -m "Support shared variant covers for colors without models"
```

---

### Task 4: Agregar el bloque al editor y cerrar

**Files:**
- Modify: `D:\Proyectos\pavoa-control\app\routes\app.productos.editar.$handle.jsx`

**Interfaces:**
- Consumes: `applySharedColorImage`.
- Persiste: `sharedColorImageId: string` y `sharedColorNames: string[]` en el payload existente.

- [ ] **Step 1: Inicializar estado**

Agregar a `createEditFormState`:

```js
sharedColorImageId: product.sharedColorImageId || '',
sharedColorNames: product.sharedColorNames || [],
```

- [ ] **Step 2: Conectar handlers**

Al elegir foto o alternar color, llamar `applySharedColorImage` y guardar juntos `colorGalleryAssignments`, `colorCoverAssignments`, `sharedColorImageId` y `sharedColorNames`.

- [ ] **Step 3: Renderizar el bloque aprobado**

Antes de las galerias por color, añadir una tarjeta con los estilos existentes, miniaturas de las imagenes activas y casillas para los colores. Copy exacto:

- `Imagen compartida para colores sin modelo`
- `Elige una foto grupal y marca solo los colores que no tienen fotos con modelo.`
- `No usar una imagen compartida`

- [ ] **Step 4: Verificar PAVOA Control**

Run: `node --test app/shared-color-image.test.js`  
Run: `npm run typecheck`  
Run: `npm run build`  
Expected: exit 0.

- [ ] **Step 5: Commit**

```powershell
git add 'app/routes/app.productos.editar.$handle.jsx'
git commit -m "Add shared color image controls to product editing"
```

- [ ] **Step 6: Revision integrada y push**

Revisar ambos diffs, confirmar que solo contienen archivos planeados y preservar los cambios locales del usuario. Repetir `npm test && npm run build` en PAVOA y `node --test app/shared-color-image.test.js && npm run typecheck && npm run build` en PAVOA Control. Despues hacer `git push origin main` en ambos repositorios.
