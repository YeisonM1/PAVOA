# CODEX_HANDOFF.md

Estado de continuidad al 2026-05-13.

## Leer junto con

- `CLAUDE.md`
- `AGENTS.md`

## Prioridad real

- La prioridad sigue siendo el storefront `PAVOA`.
- `PAVOA Control` sigue activo, pero no es el frente principal salvo falla operativa puntual.
- Evitar cambios visuales grandes sin validacion.
- Favorecer estabilidad, medicion, conversion y logica antes que redisenos.

## Estado actual del storefront

- Home, categorias, PDP, checkout, cuenta y contacto estan estables.
- La home con tabs `Nuevo`, `Mas vendido`, `Tendencia` sigue con 2 productos por decision de la duena.
- El intento de agregar un bloque nuevo de decision en PDP fue descartado.
- La mejora segura para PDP sigue siendo confianza debajo del CTA, no mas texto arriba.
- `Nosotros` ya fue reorientada a filosofia de marca.
- El contenido editorial principal ya depende de Shopify metaobjects.

## Integraciones y arquitectura reales

- Frontend: React 19 + Vite 8 + Tailwind v4.
- Backend: 12 funciones serverless activas en `api/`.
- Catalogo y contenido editorial: Shopify Storefront API + metaobjects.
- Shopify Storefront version usada en frontend: `2026-04`.
- Pagos: Mercado Pago.
- Datos operativos: Supabase.
- Correo transaccional: Resend con soporte opcional de `mailtrap_sandbox`.

## Lo que ya quedo resuelto

- Newsletter del footer ya no inserta directo a Supabase desde frontend.
  - ahora entra por `/api/contacto` con `type: newsletter-subscribe`
- El embudo propio ya existe y registra eventos frontend y backend.
  - `src/lib/funnel.js`
  - `api/_helpers/funnel.js`
- El catalogo ya no depende de `products(first: 100)`.
  - `getProductos()` pagina Shopify
- Checkout y pago quedaron mas solidos.
  - mejor idempotencia
  - mejor validacion de drafts cacheados
  - diagnostico de Mercado Pago en `procesar-pago.js`
- `Nosotros` soporta estructura editorial via `nosotros_page` y `nosotros_block`.
- `Help pages` soportan referencias con `blocks_1` y `blocks`.

## Stock alerts

- El problema reciente no era visual ni del panel.
- La causa real estaba en Supabase: el indice viejo impedia repetir alertas historicas para la misma combinacion de `email + producto + variante`.
- La solucion correcta fue en base de datos:
  - dejar unicidad solo para alertas pendientes
  - permitir nuevas alertas cuando la anterior ya fue notificada
- El backend actual ademas mantiene compatibilidad con tablas legacy sin `variant_id` o sin `notified_at`.
- Si se replica este entorno en otra base, hay que repetir esa logica.

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

La base debe mantener unicidad solo para una alerta pendiente por variante.

Si se reconstruye la tabla:

- verificar que no vuelva un indice que bloquee historial completo
- verificar columnas `variant_id`, `notified` y `notified_at`

## Shopify / contenido editable activo

Metaobjects confirmados en codigo:

- `site_settings`
- `filosofia_section`
- `nosotros_page`
- `nosotros_block`
- `contact_page`
- `footer_content`
- `help_page`

Nota util:

- en esta tienda el campo de referencias de ayuda puede venir como `blocks_1` o `blocks`

## Endpoints activos en `api/`

- `check-descuento.js`
- `contacto.js`
- `forgot-password.js`
- `login.js`
- `mis-pedidos.js`
- `pedido.js`
- `procesar-pago.js`
- `register.js`
- `reset-password.js`
- `verify.js`
- `webhook-mercadopago.js`
- `webhook-shopify.js`

## PAVOA Control

Estado general:

- desplegado y estable en Vercel
- repo separado
- no es el frente principal de este repo

Modulos mencionados en continuidad:

- resumen
- stock alerts
- newsletter
- pedidos espejo
- wishlist insights
- embudo

Notas utiles:

- conviene abrir `PAVOA Control` despues de deploys relevantes para que la app vuelva a registrar `inventory_levels/update`
- stock alerts dependen de que Shopify y Supabase sigan alineados en `variant_id`, `notified` y `notified_at`

## Archivos locales que no deben tocarse por ruido

- `.claude/settings.local.json`
- `.cursor/`
- `.gemini/`
- archivos temporales no versionados

## Siguientes frentes recomendados

1. Validar que el embudo este completamente operativo en la base real.
2. Mejorar confianza de compra en PDP con cambios pequenos y medibles.
3. Dar visibilidad operativa simple a pagos y pedidos cuando se retome `PAVOA Control`.
4. Mantener limpio el contenido editable en Shopify para reducir hardcode.

## Regla para retomar en otro chat

Pedir explicitamente:

- leer `CLAUDE.md`
- leer `AGENTS.md`
- leer `CODEX_HANDOFF.md`
