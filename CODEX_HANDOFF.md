# CODEX_HANDOFF.md

Estado de cierre al 2026-05-09.

## Storefront principal `PAVOA`

### Estado general
- La pagina quedo mas solida
- Mailtrap Sandbox ya funciona para pruebas de correo
- Se mantuvo el diseño general
- El cambio de bloque nuevo en PDP fue revertido porque no gusto

### Produccion
- URL: `https://pavoa.vercel.app`
- Shopify store visible: `pavoa-4502`
- Dominio permanente/API que puede aparecer en webhooks: `pnxbbs-hd.myshopify.com`

### Correo
- Se agrego proveedor por entorno con switch:
  - `resend`
  - `mailtrap_sandbox`
- Mailtrap ya fue probado con otros correos y funciona
- Correos transaccionales del repo principal fueron pulidos visualmente

### Cambios relevantes ya hechos
- Shopify content conectado:
  - `site_settings`
  - `filosofia_section`
  - `nosotros_page` + `nosotros_block`
  - `contact_page`
  - `footer_content`
- Paginas de ayuda conectadas a Shopify via:
  - `help_page`
  - `help_page_block`
  - Nota: en esta tienda el campo de referencias quedo con key `blocks_1`, no `blocks`
- La descripcion principal de PDP ahora prioriza `descriptionHtml` de Shopify para respetar parrafos reales
- Se agrego bloque corto de confianza en PDP debajo de la imagen principal:
  - `Envios a todo Colombia`
  - `Cambios dentro de los primeros 5 dias habiles`
  - `Pago seguro`
- Correos transaccionales redisenados
- Flujo Mailtrap integrado
- Wishlist corregido para consolidar guest -> cuenta al iniciar sesion
- Login y logout emiten cambio de auth para resincronizar wishlist real

### Punto descartado hoy
- Se probo agregar un bloque de decision arriba del selector en PDP
- No gusto
- Ya fue revertido y empujado

Commit de revert:
- `8933e12` `Revert PDP decision block`

### Ultimos cambios importantes en main
- `2095921` `Merge guest wishlist into account`
- `91bb4c4` `Align product card colors and hover price`
- `5c44309` `Use Shopify product HTML for PDP paragraphs`
- `76672e7` `Normalize escaped help page line breaks`
- `680459e` `Load help pages from Shopify metaobjects`
- `34d0d1d` `Refresh transactional email system`
- `3a1f6cd` `Add Mailtrap sandbox email provider`
- `8933e12` `Revert PDP decision block`

### Nota importante sobre wishlist en storefront
- `producto.id` en `PAVOA` sigue siendo `node.handle`
- Si en Shopify cambia el titulo pero no el handle, en wishlist y analytics seguira apareciendo el handle viejo
- Si hace falta corregir lectura visual para cliente, mostrar `title` real desde Shopify en `PAVOA Control`, no solo el handle formateado

### Nota manual aplicada en Supabase
- La tabla `wishlist_events` tenia un check constraint que solo permitia `add` y `remove`
- Se actualizo manualmente en Supabase para permitir tambien `guest_merge`
- SQL aplicado:
  - `alter table public.wishlist_events drop constraint if exists wishlist_events_action_type_check;`
  - `alter table public.wishlist_events add constraint wishlist_events_action_type_check check (action_type in ('add', 'remove', 'guest_merge'));`
- Si se clona este entorno en otra base, este ajuste debe repetirse o el KPI `Interes anonimo convertido en cuenta` no va a subir aunque el merge visual funcione

### Siguiente trabajo recomendado en storefront
1. Extender medicion del embudo en `src/lib/analytics.js`
2. Mover newsletter del footer a endpoint backend conservando UI
3. Corregir escalabilidad de `getProductos()` para no depender de `products(first: 100)`
4. Si se quiere volver editable el bloque de confianza del PDP, llevarlo a Shopify en lugar de hardcodearlo

### Auditoria resumida
- PDP necesita mas confianza, no mas texto
- Analytics aun es demasiado corto para optimizar conversion
- Newsletter actual inserta directo desde frontend
- Catalogo depende de maximo 100 productos
- Home tabs con 2 productos se dejan asi por decision de la dueña

## App embebida `PAVOA Control`

### Estado general
- App desplegada y estable en Vercel
- Ya no depende de terminal ni tunnel
- Repo remoto configurado y sincronizado

### Produccion
- URL: `https://pavoa-control.vercel.app`
- Repo: `https://github.com/YeisonM1/pavoa-control.git`

### Modulos ya montados
- Dashboard resumen
- Stock alerts
- Newsletter
- Pedidos espejo
- Wishlist insights

### Stock alerts
- Flujo real validado
- Guarda `variant_id`
- Cuando sube stock:
  - webhook entra
  - envia correo
  - marca `notified = true`
  - marca `notified_at`
- Se limpio el debug temporal
- Correo de stock alerts alineado con el nuevo sistema visual transaccional

### Newsletter
- Vista lista
- Exportacion a Excel funcionando
- Se corrigio para que descargue dentro de la sesion embebida sin mandar a login

### Wishlist
- Vista y exportacion montadas
- El resumen ya no lee la tabla vieja `wishlists` para KPI principal; ahora usa `wishlist_actor_state`
- La UI se tradujo a lenguaje de negocio:
  - `Interes en productos`
  - `Favoritos activos hoy`
  - `Interes anonimo convertido en cuenta`
  - `Productos retirados de favoritos`
- Se agrego conteo de `guest_merge` en insights y exportacion
- Se agrego caja guia para explicar como leer la metrica
- Se redeployo manualmente Vercel porque produccion seguia sirviendo una build vieja del 2026-05-03

### Pedidos espejo
- Modulo montado
- Tabla puede estar vacia segun datos actuales

### Mailtrap en app
- `PAVOA Control` tambien ya soporta `mailtrap_sandbox`

### Commits importantes en app repo
- `36ea18e` `Clarify wishlist conversion metrics`
- `0f6337a` `Fix wishlist summary source`
- `965179e` `Align stock alert email with transactional design`
- `89d83f5` `Add Mailtrap sandbox support to stock alerts`
- `1656bec` `Download newsletter export inside Shopify session`
- `13dfc41` `Add mirror orders module`
- `8ad8a01` `Add wishlist insights module`

## Archivos que no deben tocarse por ruido local
- `.claude/settings.local.json`
- `.cursor/`
- `.gemini/`
- `REF 1.jpeg`
- `Skills de Claude Construyendo IA.pdf`
- `TEXTO`

## Recordatorio para retomar
Si se abre otro chat, decir:
- lee `CLAUDE.md`
- lee `AGENTS.md`
- lee `CODEX_HANDOFF.md`
- luego sigue con uno de estos frentes:
  - bloque de confianza de compra en PDP
  - analytics del embudo
  - newsletter del footer por backend
  - escalabilidad del catalogo
