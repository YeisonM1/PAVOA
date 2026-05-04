# AGENTS.md - PAVOA

Este archivo complementa `CLAUDE.md`. No lo reemplaza.

## Regla operativa
- Leer primero `CLAUDE.md`
- Leer después `CODEX_HANDOFF.md`
- Tratar `AGENTS.md` como guía activa de continuidad

## Prioridades actuales
- Lo primordial es la pagina principal `PAVOA`
- `PAVOA Control` ya existe y sigue vivo, pero no es la prioridad inmediata
- Evitar cambios que vuelvan pesada la web
- Favorecer mejoras de conversion, confianza y logica antes que cambios visuales grandes

## Restricciones vigentes
- No tocar diseño sin validacion clara
- No refactorizar por gusto
- No agregar dependencias sin justificarlo
- Explicar antes de editar
- Validar con `npm run build`
- Hacer commit y push a `main` despues de cerrar un cambio

## Decisiones ya tomadas
- La seccion home de productos con tabs `Nuevo`, `Mas vendido`, `Tendencia` se queda con solo 2 productos por decision de la dueña
- El intento de agregar un bloque nuevo de decision en PDP no gusto y fue revertido
- El texto actual del producto debe seguir siendo la base principal de beneficios en PDP
- La mejora futura mas segura en PDP es el bloque de confianza debajo del CTA, no arriba del texto

## Enfoque recomendado para cambios futuros
1. Mejorar confianza en compra
2. Mejorar medicion del embudo
3. Mejorar newsletter por backend
4. Mejorar escalabilidad del catalogo

## Proyectos y repos
- Storefront principal:
  - `C:\Users\Usuario\PAVOA`
  - Produccion: `https://pavoa.vercel.app`
- App embebida Shopify:
  - `C:\Users\Usuario\PAVOA\pavoa-control\pavoa-control`
  - Produccion: `https://pavoa-control.vercel.app`

## Nota de contexto
Si se abre una conversacion nueva, pedir explicitamente:
- leer `CLAUDE.md`
- leer `AGENTS.md`
- leer `CODEX_HANDOFF.md`

