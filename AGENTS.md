# AGENTS.md - PAVOA

Este archivo complementa `CLAUDE.md`. No lo reemplaza.

## Regla operativa

Leer siempre en este orden:

1. `CLAUDE.md`
2. `CODEX_HANDOFF.md`
3. `AGENTS.md`

`AGENTS.md` funciona como guia activa de continuidad.

## Prioridad actual

- Lo principal es el storefront `PAVOA`.
- `PAVOA Control` sigue activo, pero no es la prioridad inmediata.
- Evitar cambios que vuelvan pesada la web.
- Favorecer mejoras de conversion, confianza y logica antes que cambios visuales grandes.

## Restricciones vigentes

- No tocar diseno sin validacion clara.
- No refactorizar por gusto.
- No agregar dependencias sin justificarlo.
- Explicar antes de editar.
- Validar con `npm run build`.
- Hacer commit y push a `main` al cerrar un cambio.

## Decisiones ya tomadas

- La seccion home con tabs `Nuevo`, `Mas vendido`, `Tendencia` se queda con solo 2 productos.
- El intento de agregar un bloque extra de decision en PDP no gusto y fue revertido.
- El texto actual del producto debe seguir siendo la base principal de beneficios en PDP.
- La mejora futura mas segura en PDP es un bloque de confianza debajo del CTA, no arriba del texto.
- PAVOA Control: Contenido del sitio esta completado — todos los metaobjects renderizados tienen editor.
- Boton flotante de WhatsApp rediseñado como pilula minimalista (no el circulo con glows anterior).

## Estado operativo que conviene recordar

- Home, categorias, PDP, checkout y cuenta estan estables.
- El funnel propio ya existe en frontend y backend.
- Newsletter del footer ya entra por backend, no directo desde frontend a Supabase.
- El catalogo ya pagina Shopify; no depende de `products(first: 100)`.
- `Nosotros`, `Contacto`, `Footer` y `Help pages` ya tiran de metaobjects.

## Enfoque recomendado para proximos cambios

1. Validar con data real en Supabase que los journeys de checkout no esten duplicando recorridos viejos.
2. Cruzar mejor `journey -> pago -> pedido espejo -> pedido Shopify` dentro del modulo `Embudo`, no solo en `Pedidos`.
3. Notificaciones de stock alerts al cliente cuando el producto vuelve a estar disponible.
4. Mejorar newsletter por backend.
## Repos y produccion

- Storefront principal:
  - `C:\Users\Usuario\PAVOA`
  - `https://pavoa.com.co`
- App embebida Shopify:
  - `C:\Users\Usuario\PAVOA\pavoa-control\pavoa-control`
  - `https://pavoa-control.vercel.app`

## Regla para abrir otro chat

Pedir explicitamente:

- leer `CLAUDE.md`
- leer `AGENTS.md`
- leer `CODEX_HANDOFF.md`
