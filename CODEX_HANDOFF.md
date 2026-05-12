# CODEX_HANDOFF.md

Estado de continuidad al 2026-05-11.

## Leer junto con
- `CLAUDE.md`
- `AGENTS.md`

## Prioridad real
- La prioridad sigue siendo el storefront `PAVOA`.
- `PAVOA Control` sigue activo, pero no es el frente principal salvo que haya una falla operativa concreta.
- Evitar cambios visuales grandes sin validación.
- Favorecer estabilidad, medición, conversión y lógica antes que rediseños.

## Estado actual del storefront
- Home, categorías, PDP, checkout y cuenta están estables.
- La home con tabs `Nuevo`, `Mas vendido`, `Tendencia` se mantiene con 2 productos por decisión de la dueña.
- El intento de agregar un bloque nuevo de decisión en PDP fue descartado. La mejora segura sigue siendo confianza debajo del CTA, no más texto arriba.
- La página `Nosotros` ya fue reorientada a filosofía de marca y el copy visible del storefront fue normalizado en español.

## Integraciones y arquitectura
- Frontend: React 19 + Vite 8 + Tailwind v4.
- Backend: funciones serverless en `api/`.
- Catálogo y contenido editorial: Shopify Storefront API + metaobjects.
- Pagos: Mercado Pago.
- Datos internos: Supabase.
- Correo transaccional: Resend con soporte de `mailtrap_sandbox` para pruebas.

## Lo que ya quedó resuelto
- Newsletter del footer ya no inserta directo a Supabase desde frontend.
  - Ahora entra por `/api/contacto` con `type: newsletter-subscribe`.
- El catálogo ya no depende de `products(first: 100)`.
  - `getProductos()` ya pagina Shopify.
- Checkout/pago quedó más sólido.
  - mejor idempotencia para creación de preferencia de pago
  - mejor validación de drafts cacheados
- El embudo propio ya existe y registra eventos frontend/backend.
  - `src/lib/funnel.js`
  - `api/_helpers/funnel.js`
- `Nosotros` ya soporta una estructura más editorial orientada a filosofía.

## Stock alerts
- El problema reciente no era visual ni del panel.
- La causa real estaba en Supabase: el índice viejo impedía repetir alertas históricas para la misma combinación de `email + producto + variante`.
- La solución correcta fue en base de datos:
  - dejar unicidad solo para alertas pendientes
  - permitir nuevas alertas cuando la anterior ya fue notificada
- El backend quedó simplificado después de eso.
- Si este entorno se replica en otra base, hay que repetir esa regla.

## Ajustes manuales importantes en Supabase

### 1. `wishlist_events`
Si se clona otra base, repetir:

```sql
alter table public.wishlist_events drop constraint if exists wishlist_events_action_type_check;
alter table public.wishlist_events add constraint wishlist_events_action_type_check check (action_type in ('add', 'remove', 'guest_merge'));
```

### 2. Embudo
Ejecutar:
- `SUPABASE_FUNNEL_EVENTS.sql`
- `SUPABASE_FUNNEL_JOURNEYS.sql`

Sin eso:
- no persisten eventos del embudo
- `PAVOA Control` no puede mostrar recorridos reales

### 3. Stock alerts
La base debe mantener la lógica de unicidad para solo una alerta pendiente por variante.
Si se reconstruye la tabla, verificar que el índice no vuelva a bloquear historial completo.

## Shopify / contenido editable ya activo
- `site_settings`
- `filosofia_section`
- `nosotros_page`
- `nosotros_block`
- `contact_page`
- `footer_content`
- `help_page`
- `help_page_block`

Nota:
- en esta tienda, el campo de referencias de ayuda quedó con key `blocks_1`, no `blocks`

## PAVOA Control
Estado general:
- desplegado y estable en Vercel
- repo separado
- módulos ya montados: resumen, stock alerts, newsletter, pedidos espejo, wishlist insights, embudo

Notas útiles:
- conviene abrir `PAVOA Control` después de deploys relevantes para que la app vuelva a registrar `inventory_levels/update`
- el módulo de stock alerts depende de que Shopify y Supabase sigan alineados en `variant_id`, `notified` y `notified_at`

## Archivos locales que no deben tocarse por ruido
- `.claude/settings.local.json`
- `.cursor/`
- `.gemini/`
- archivos de apoyo temporales que no estén versionados

## Siguientes frentes recomendados
1. Validar que el embudo esté completamente operativo en la base real.
2. Mejorar confianza de compra en PDP con cambios pequeños y medibles.
3. Añadir visibilidad operativa simple en `PAVOA Control` para pagos/pedidos cuando se retome ese frente.
4. Mantener limpio el contenido editable en Shopify para reducir hardcode.

## Regla para retomar en otro chat
Pedir explícitamente:
- leer `CLAUDE.md`
- leer `AGENTS.md`
- leer `CODEX_HANDOFF.md`
