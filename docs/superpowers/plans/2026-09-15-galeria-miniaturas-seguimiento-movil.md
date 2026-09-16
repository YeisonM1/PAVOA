# Mobile Thumbnail Gallery Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mantener visible la miniatura activa mientras se desliza la galería móvil y actualizar el mensaje de cambios a 2 días.

**Architecture:** La decisión de desplazamiento será una función pura en `productGallery.js`, probada con Node. `ProductGallery.jsx` medirá el contenedor y la miniatura activa mediante referencias, solicitará un `scrollTo` suave solo cuando la miniatura salga del área visible y reutilizará una constante probada para el nuevo texto.

**Tech Stack:** React 19, Vite 8, Tailwind CSS, Node test runner.

## Global Constraints

- No cambiar tamaños, espaciados, colores ni estructura visual de la galería.
- Mantener libre el desplazamiento vertical de la página con `touchAction: pan-y`.
- No agregar dependencias.
- El carrusel no debe envolver entre la primera y la última imagen.
- El texto exacto debe ser `Cambios dentro de los primeros 2 días`.

---

### Task 1: Criterio de seguimiento y texto de confianza

**Files:**
- Modify: `src/utils/productGallery.test.js`
- Modify: `src/utils/productGallery.js`

**Interfaces:**
- Produces: `getThumbnailScrollLeft({ scrollLeft, viewportWidth, itemOffsetLeft, itemWidth, maxScrollLeft, edgePadding? }): number | null`.
- Produces: `PRODUCT_EXCHANGE_COPY: string`.

- [ ] **Step 1: Escribir las pruebas fallidas**

Agregar casos que comprueben que una miniatura visible devuelve `null`, una miniatura fuera del borde derecho avanza sin superar `maxScrollLeft`, una miniatura fuera del borde izquierdo retrocede hasta cero y el texto tiene el valor exacto:

```js
import {
  getSwipeImageIndex,
  getThumbnailScrollLeft,
  PRODUCT_EXCHANGE_COPY,
} from './productGallery.js';

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
```

- [ ] **Step 2: Ejecutar las pruebas y confirmar el fallo**

Run: `node --test src/utils/productGallery.test.js`

Expected: FAIL porque `getThumbnailScrollLeft` y `PRODUCT_EXCHANGE_COPY` todavía no están exportados.

- [ ] **Step 3: Implementar la función pura y la constante**

Añadir a `src/utils/productGallery.js`:

```js
export const PRODUCT_EXCHANGE_COPY = 'Cambios dentro de los primeros 2 días';

export const getThumbnailScrollLeft = ({
  scrollLeft,
  viewportWidth,
  itemOffsetLeft,
  itemWidth,
  maxScrollLeft,
  edgePadding = 8,
}) => {
  const visibleStart = scrollLeft + edgePadding;
  const visibleEnd = scrollLeft + viewportWidth - edgePadding;
  const itemEnd = itemOffsetLeft + itemWidth;

  if (itemOffsetLeft < visibleStart) {
    return Math.max(0, itemOffsetLeft - edgePadding);
  }
  if (itemEnd > visibleEnd) {
    return Math.min(maxScrollLeft, itemEnd - viewportWidth + edgePadding);
  }
  return null;
};
```

- [ ] **Step 4: Ejecutar la prueba focal**

Run: `node --test src/utils/productGallery.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/productGallery.js src/utils/productGallery.test.js
git commit -m "Add mobile thumbnail tracking logic"
```

### Task 2: Conectar el seguimiento a la galería móvil

**Files:**
- Modify: `src/components/product/ProductGallery.jsx`

**Interfaces:**
- Consumes: `getThumbnailScrollLeft(...)` y `PRODUCT_EXCHANGE_COPY` de `src/utils/productGallery.js`.
- Produces: desplazamiento suave del carrusel móvil cuando cambia `selectedImage`.

- [ ] **Step 1: Añadir referencias estables**

Dentro de `ProductGallery`, añadir un `mobileThumbsRef` para el contenedor y un arreglo `mobileThumbRefs` para los botones:

```jsx
const mobileThumbsRef = useRef(null);
const mobileThumbRefs = useRef([]);
```

- [ ] **Step 2: Conectar el efecto de acompañamiento**

Agregar un efecto que mida la miniatura activa después de cada cambio de selección y solo desplace cuando la función pura devuelve un destino:

```jsx
useEffect(() => {
  if (phase !== 'idle') return;
  const container = mobileThumbsRef.current;
  const activeThumb = mobileThumbRefs.current[selectedImage];
  if (!container || !activeThumb) return;

  const left = getThumbnailScrollLeft({
    scrollLeft: container.scrollLeft,
    viewportWidth: container.clientWidth,
    itemOffsetLeft: activeThumb.offsetLeft,
    itemWidth: activeThumb.offsetWidth,
    maxScrollLeft: Math.max(0, container.scrollWidth - container.clientWidth),
  });
  if (left !== null) container.scrollTo({ left, behavior: 'smooth' });
}, [displayed.length, phase, selectedImage]);
```

- [ ] **Step 3: Asignar las referencias al JSX móvil**

Usar `ref={mobileThumbsRef}` en la fila horizontal y guardar cada botón con:

```jsx
ref={(node) => {
  mobileThumbRefs.current[i] = node;
}}
```

Mantener intactas las clases y estilos existentes.

- [ ] **Step 4: Aplicar el texto aprobado**

Importar `PRODUCT_EXCHANGE_COPY` y reemplazar únicamente el texto del segundo elemento de `TRUST_ITEMS`:

```jsx
{ icon: Undo2, text: PRODUCT_EXCHANGE_COPY },
```

- [ ] **Step 5: Ejecutar verificación completa**

Run: `npm test`

Expected: 69 pruebas o más, 0 fallos.

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 6: Verificar comportamiento móvil**

Abrir una PDP con más miniaturas que el ancho móvil, deslizar hasta la última imagen y regresar a la primera. Confirmar que la miniatura activa permanece visible, la tira se mueve suavemente y un gesto vertical desplaza la página sin cambiar la foto.

- [ ] **Step 7: Commit**

```bash
git add src/components/product/ProductGallery.jsx
git commit -m "Keep mobile gallery thumbnails in view"
```

