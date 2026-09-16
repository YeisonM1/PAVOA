# Seguimiento de miniaturas en la galería móvil

## Objetivo

Al deslizar horizontalmente la imagen principal de una PDP en móvil, la tira de miniaturas debe acompañar la selección hasta la última imagen, sin quedarse visualmente atrasada.

## Comportamiento aprobado

- La miniatura activa siempre permanece visible dentro de la tira horizontal.
- La tira se desplaza suavemente solo cuando la miniatura activa sale o está por salir del área visible.
- No se fuerza un centrado constante; se conserva un movimiento natural y reducido.
- El comportamiento aplica tanto al gesto horizontal sobre la imagen principal como a la selección directa de una miniatura.
- El desplazamiento horizontal no bloquea el desplazamiento vertical normal de la página.
- No se modifican tamaños, espaciados, colores ni estructura visual de la galería.
- En los extremos no hay recorrido circular: la primera y la última imagen siguen siendo los límites.

## Texto de confianza

Cambiar `Cambios dentro de los primeros 5 días hábiles` por `Cambios dentro de los primeros 2 días`.

## Implementación prevista

- Mantener una referencia al contenedor móvil de miniaturas y una referencia por miniatura.
- Cuando cambie el índice seleccionado, desplazar la miniatura activa con comportamiento suave y alineación mínima necesaria para hacerla visible.
- Mantener el cálculo actual del gesto horizontal y la apertura del lightbox.

## Verificación

- Prueba automatizada del criterio que decide cuándo y hacia dónde acompañar la miniatura activa.
- Pruebas existentes completas del storefront.
- Build de producción.
- Comprobación móvil de que la tira llega hasta la última miniatura y permite regresar a la primera.
- Comprobación de que un gesto principalmente vertical no cambia de imagen ni bloquea la página.

