# Galeria completa de producto y gesto de deslizamiento movil

Fecha: 2026-09-15  
Repos afectados: `PAVOA` y `pavoa-control`.

## Objetivo

Completar el comportamiento de la galeria de la PDP sin cambiar el diseno ya
aprobado:

- sin color seleccionado, mostrar todas las imagenes cargadas para el producto;
- con un color seleccionado, mostrar solo las imagenes asociadas a ese color;
- permitir navegar la imagen principal con un gesto horizontal en movil;
- usar la foto grupal unicamente en los colores que no tienen foto con modelo.

## Restriccion principal

No se redisenan la PDP ni su galeria. Se conservan dimensiones, proporciones,
espaciados, imagen principal, miniaturas, transiciones, bloque de confianza y
distribucion general. Solo se completa la carga y la navegacion de las imagenes.

## Estado actual y causa

La consulta de detalle pide hasta diez imagenes de Shopify, pero el mapeo del
producto solo conserva `imagen1` a `imagen5` para la galeria general. Por eso el
estado sin color no puede mostrar una imagen que quede despues de la quinta.

Cuando se selecciona un color, la PDP cambia a `imagesByColor[color]`. Esa
coleccion se construye con las imagenes cuyo texto alternativo coincide con el
nombre del color. La foto grupal aparece con Negro porque actualmente esta
asociada a ese color.

Ademas, la imagen principal de la galeria normal no tiene manejo de gestos. El
lightbox si entiende deslizamientos, pero la vista movil de la PDP solo cambia
al pulsar una miniatura.

## Enfoques evaluados

### 1. Mantener la galeria y habilitar desplazamiento en sus miniaturas

Es el enfoque elegido. La imagen principal permanece igual. En escritorio, la
columna de miniaturas obtiene desplazamiento vertical interno cuando excede el
alto disponible. En movil, la fila de miniaturas obtiene desplazamiento
horizontal. Es el cambio visual mas pequeno.

### 2. Apilar todas las imagenes grandes

Se descarta porque alargaria mucho la PDP, alejaria la informacion de compra y
cambiaria de forma visible el diseno aprobado.

### 3. Agregar un carrusel nuevo con flechas e indicadores

Se descarta porque introduce controles y lenguaje visual nuevos para resolver
algo que la galeria actual ya puede cubrir.

## Diseno funcional

### Estado sin color

- La galeria recibe el arreglo completo de imagenes del producto, en el orden
  definido en Shopify.
- No se limita a cinco elementos.
- Navegar mediante miniatura o gesto cambia solo la imagen visible.
- Navegar por las fotos no selecciona automaticamente ningun color.

### Estado con color

- Al tocar un circulo de color, la galeria muestra exclusivamente la coleccion
  de ese color.
- El cambio de color conserva la transicion existente y vuelve a la primera
  imagen de la coleccion.
- Volver a deseleccionar el color restaura la coleccion completa.

### Colores sin modelo

- La foto grupal se usa como portada compartida solo para los colores sin foto
  con modelo.
- Los colores que si tienen modelo conservan sus galerias actuales y no reciben
  la foto grupal.
- La asignacion se administra dentro del editor de producto existente en PAVOA
  Control; no se crea una pantalla nueva.
- El storefront debe leer la imagen vinculada a la variante para que una misma
  foto pueda funcionar como respaldo de mas de un color sin duplicar archivos.

### PAVOA Control

- La seccion actual de imagenes y sus galerias por color se conserva.
- Se agrega un bloque compacto `Imagen compartida para colores sin modelo`.
- El bloque permite elegir una imagen existente del producto y marcar uno o
  varios colores mediante casillas.
- La foto compartida se agrega como portada de los colores marcados, pero no
  elimina sus otras imagenes.
- Las fotos de modelo se siguen asignando, ordenando, desvinculando y marcando
  como portada con el flujo actual.
- Desmarcar un color retira de ese color la portada compartida sin afectar las
  galerias de los demas colores.
- La seleccion se persiste con las vinculaciones de imagen de las variantes que
  Shopify ya soporta; no se agrega un metaobject ni una pantalla administrativa.

### Escritorio

- La imagen principal y la columna de miniaturas mantienen sus medidas.
- Si las miniaturas superan el alto disponible, solo esa columna se desplaza
  verticalmente.
- El desplazamiento no mueve por separado la informacion del producto ni cambia
  el comportamiento sticky actual.

### Movil

- La fotografia principal acepta un gesto horizontal con el dedo.
- Deslizar a la izquierda avanza y deslizar a la derecha retrocede.
- En los extremos no se hace un salto circular: el gesto se detiene en la
  primera o ultima fotografia.
- El gesto solo se activa cuando el movimiento horizontal domina al vertical,
  para no bloquear el desplazamiento normal de la pagina.
- La fila de miniaturas sigue visible, seleccionable y desplazable
  horizontalmente.
- El gesto no cambia ni selecciona colores.

## Datos y compatibilidad

- La consulta de detalle solicitara una cantidad suficiente de imagenes para el
  catalogo actual, en lugar de depender de las primeras diez.
- El objeto de producto expondra un arreglo `imagenes` completo.
- `imagen1` a `imagen5` se conservan para los consumidores existentes como
  tarjetas, SEO, carrito y productos vistos recientemente.
- Las colecciones por color eliminaran URLs duplicadas antes de renderizarse.
- La consulta de variantes incluira su imagen vinculada, porque el mapeador ya
  contempla `variantImage` pero la consulta de detalle actual no la solicita.

## Manejo de casos borde

| Caso | Comportamiento |
| --- | --- |
| Producto con una imagen | No muestra controles innecesarios y el gesto no hace nada |
| Producto con muchas imagenes | Mantiene la imagen principal y desplaza solo las miniaturas |
| Color con varias imagenes | Muestra todas las asignadas, sin duplicados |
| Color sin modelo | Muestra la foto grupal que se le haya vinculado como portada |
| Color sin ninguna asignacion | Muestra la imagen principal general para no dejar la galeria vacia; debe corregirse despues desde PAVOA Control |
| Gesto principalmente vertical | La pagina se desplaza normalmente; no cambia la foto |

## Verificacion

- Prueba unitaria del mapeo de imagenes generales y por color, incluyendo
  deduplicacion y portada compartida.
- Validacion manual en movil del gesto izquierda/derecha y del desplazamiento
  vertical de la pagina.
- Validacion manual en escritorio con mas de cinco miniaturas.
- Comprobar que navegar fotos no selecciona un color.
- Comprobar que seleccionar y deseleccionar colores filtra y restaura la
  galeria correctamente.
- `npm test`, lint focalizado y `npm run build` en `PAVOA`.
- Validacion del bloque de imagen compartida y `npm run build` en
  `pavoa-control`.

## Fuera de alcance

- Redisenar la PDP o la galeria.
- Redisenar el editor de productos de PAVOA Control.
- Agregar flechas, puntos, contadores o controles visuales nuevos.
- Analizar imagenes con IA para detectar si aparece una modelo.
- Reordenar automaticamente las fotos de Shopify.
- Cambiar tarjetas de catalogo, quick view o lightbox salvo lo necesario para
  mantener compatibilidad con el nuevo arreglo completo.
