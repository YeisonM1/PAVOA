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

## Estado operativo que conviene recordar

- Home, categorias, PDP, checkout y cuenta estan estables.
- El funnel propio ya existe en frontend y backend.
- Newsletter del footer ya entra por backend, no directo desde frontend a Supabase.
- El catalogo ya pagina Shopify; no depende de `products(first: 100)`.
- `Nosotros`, `Contacto`, `Footer` y `Help pages` ya tiran de metaobjects.

## Enfoque recomendado para proximos cambios

1. Validar que el embudo este registrando data real en Supabase.
2. Dar visibilidad operativa a pagos y pedidos en `PAVOA Control`.
3. Mejorar newsletter por backend.
4. Mejorar escalabilidad del catalogo.

## Repos y produccion

- Storefront principal:
  - `C:\Users\Usuario\PAVOA`
  - `https://pavoa.vercel.app`
- App embebida Shopify:
  - `C:\Users\Usuario\PAVOA\pavoa-control\pavoa-control`
  - `https://pavoa-control.vercel.app`

## Regla para abrir otro chat

Pedir explicitamente:

- leer `CLAUDE.md`
- leer `AGENTS.md`
- leer `CODEX_HANDOFF.md`
