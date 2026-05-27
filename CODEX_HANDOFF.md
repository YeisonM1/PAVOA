# CODEX_HANDOFF.md

Estado de continuidad al 2026-05-27.

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
- El contenido editorial principal ya depende de Shopify metaobjects — practicamente sin hardcode en el home ni en paginas editoriales.
- Boton flotante de WhatsApp rediseñado como pilula minimalista oscura con borde dorado PAVOA y texto "Escribenos" que se expande al hover en desktop.

## Performance

- Score Lighthouse actual: **93/100** (subio de 85).
- Google Fonts eliminado — Montserrat ahora se sirve local via `@fontsource/montserrat`.
- Raleway sigue via `@fontsource/raleway`.
- Chunks separados en Vite: `fonts`, `home-above` (Categorias + Productos), `home-below` (Filosofia + Instagram + Ticker).
- vendor-react bajo de 252KB a 202KB gzip.
- Fallbacks de Unsplash eliminados en Instagram y Categorias — todas las imagenes vienen de Shopify CDN.
- `imageUrl.js` tiene funciones especializadas: `productImage`, `heroImage`, `heroImageMobile`, `categoryImage(url, size)`, `thumbImage`, `instagramImage`.
- El techo real del SPA sin SSR es ~93-95. El LCP depende de la imagen del Hero que es dinamica.

## Integraciones y arquitectura reales

- Frontend: React 19 + Vite 8 + Tailwind v4.
- Backend: 12 funciones serverless activas en `api/` — limite del plan Hobby de Vercel.
- Catalogo y contenido editorial: Shopify Storefront API + metaobjects.
- Shopify Storefront version usada en frontend: `2026-04`.
- Shopify Admin API: autenticacion via client credentials (no shpat desde 2026).
  - `SHOPIFY_CLIENT_ID` y `SHOPIFY_CLIENT_SECRET` en `.env` son los de la app PAVOA Backend en Dev Dashboard.
  - El token se obtiene con POST a `/admin/oauth/access_token` con `grant_type=client_credentials`.
  - Expira en 24h — no es estatico.
- Pagos: Mercado Pago.
- Datos operativos: Supabase.
- Correo transaccional: Resend con soporte opcional de `mailtrap_sandbox`.

## Shopify / contenido editable activo

Metaobjects confirmados y poblados:

- `site_settings` — email, horario, redes sociales
- `filosofia_section` — tag, headline, body, cta, imagen
- `nosotros_page` — todos los campos incluyendo manifesto, intro_body, quote, signature
- `nosotros_block` — 4 bloques con label, title, body
- `contact_page` — todos los campos
- `footer_content` — todos los campos
- `help_page` — campos principales (cta_label y cta_url opcionales vacios)
- `hero_slide` — 3 slides con imagen, tag, headline, cta (slide 1 sin imagen mobile)
- `hero_section` — badge_text debajo del CTA del hero
- `categoria_destacada` — 4 categorias con imagen, nombre, href, posicion
- `announcement_bar` — 3 mensajes activos
- `ticker_bar` — 6 items del ticker animado (no renderizado en storefront actualmente)
- `home_productos_section` — eyebrow, titulo (2 lineas), tabs, textos de categorias, estado vacio
- `instagram_post` — 2 posts con imagen

Nota util:
- en esta tienda el campo de referencias de ayuda puede venir como `blocks_1` o `blocks`

## Scripts utiles en `scripts/`

- `scripts/generate-sitemap.mjs` — genera `public/sitemap.xml` con productos reales de Shopify. Se ejecuta automaticamente en cada `npm run build`.

Para operaciones admin de Shopify desde CLI usar scripts `.mjs` con Node (no PowerShell — problemas de encoding UTF-8). Patron:
1. Obtener token con client credentials
2. Ejecutar mutaciones GraphQL
3. Borrar script al terminar

## Lo que ya quedo resuelto

- Newsletter del footer ya no inserta directo a Supabase desde frontend.
  - ahora entra por `/api/contacto` con `type: newsletter-subscribe`
- El embudo propio ya existe y registra eventos frontend y backend.
  - `src/lib/funnel.js`
  - `api/_helpers/funnel.js`
  - Eventos activos: `view_product`, `select_color`, `select_size`, `add_to_cart`, `begin_checkout`, `checkout_error`, `stock_alert_submit`, y eventos de backend en `procesar-pago.js` y `pedido.js`
- El catalogo ya no depende de `products(first: 100)`.
- Checkout y pago solidos con idempotencia y validacion de drafts.
- Sitemap dinamico generado en build con productos reales de Shopify.

### Endurecimientos recientes del embudo

- `payment_approved` ya no equivale automaticamente a `purchase_completed`.
  - `payment_approved` ahora significa solo aprobacion de Mercado Pago.
  - `purchase_completed` solo se emite cuando el cierre final ya quedo consolidado.
- `begin_checkout` ya no se dispara sin control en cada mount del checkout.
  - ahora se deduplica por sesion de checkout y huella de carrito.
- Los journeys de checkout ya no se amarran a `session + primary product`.
  - ahora se agrupan por huella del carrito completo.
  - esto evita que carritos multi-producto queden atribuidos solo al primer producto.

## Stock alerts

- Causa raiz resuelta en Supabase: unicidad solo para alertas pendientes.
- Backend compatible con tablas legacy sin `variant_id` o `notified_at`.
- Si se replica: verificar columnas `variant_id`, `notified`, `notified_at` y el indice de unicidad.

## Ajustes manuales importantes en Supabase

### 1. `wishlist_events`

```sql
alter table public.wishlist_events drop constraint if exists wishlist_events_action_type_check;
alter table public.wishlist_events add constraint wishlist_events_action_type_check check (action_type in ('add', 'remove', 'guest_merge'));
```

### 2. Embudo

Ejecutar:

- `SUPABASE_FUNNEL_EVENTS.sql`
- `SUPABASE_FUNNEL_JOURNEYS.sql`

### 3. Stock alerts

Verificar unicidad solo para alerta pendiente por variante al reconstruir la tabla.

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

**Limite: 12 funciones en plan Hobby de Vercel — ya al tope.**
Para agregar una nueva hay que consolidar dos existentes primero.

## PAVOA Control

- Desplegado y estable en Vercel, repo separado.
- Conviene abrirlo despues de deploys relevantes para que vuelva a registrar `inventory_levels/update`.

### Lo que ya se organizo en UI

- La navegacion superior improvisada ya no existe.
- Ahora `PAVOA Control` usa sidebar izquierdo con estilo alineado a PAVOA.
- El sidebar esta dividido en 2 grupos desplegables:
  - `Operacion`
  - `Contenido del sitio`
- El grupo activo se abre automaticamente segun la ruta actual.

### Operacion ya agrupada

Rutas activas dentro de `Operacion`:

- `Resumen`
- `Pedidos`
- `Newsletter`
- `Wishlist`
- `Embudo`
- `Stock alerts`
- `Nuevo producto`
- `Home productos`

### Operacion ya mejorada

- `Pedidos`
  - ya no solo lista pedidos espejo.
  - ahora detecta:
    - compras completadas sin espejo
    - aprobados sin referencia Shopify
    - pendientes viejos
    - aprobados listos para despacho
    - enviados sin guia
- `Embudo`
  - ya no mezcla igual abandono explicito y abandono inferido.
  - ahora distingue recorridos de `checkout` y recorridos de `producto`.
  - ahora separa:
    - pagos aprobados
    - compras completadas
    - salida explicita del checkout
    - checkout vencido por inactividad
    - carrito vencido por inactividad

### Contenido del sitio — completado

Todas las pantallas editoriales estan creadas. Cobertura completa de metaobjects:

- `Ajustes generales` — `site_settings`
- `Footer y newsletter` — `footer_content`
- `Contacto` — `contact_page`
- `Nosotros` — `nosotros_page`
- `Nosotros pilares` — `nosotros_block`
- `Home barra superior` — `announcement_bar`
- `Hero principal` — `hero_slide` + `hero_section`
- `Categorias destacadas` — `categoria_destacada`
- `Filosofia` — `filosofia_section`
- `Paginas de ayuda` — `help_page`

Metaobjects sin editor (por decision):
- `ticker_bar` — no se renderiza en el storefront, no tiene editor.
- `instagram_post` — solo imagenes, se gestiona directo en Shopify.

### Patron de diseño unificado en PAVOA Control

Todas las pestañas (Operacion y Contenido) usan:
- `cardStyle`: `border: #f3f4f6`, `borderRadius: 12px`, `boxShadow: 0 1px 3px rgba(0,0,0,0.05)`
- Contenedor: `maxWidth: 1100px`
- Bordes internos: `#f3f4f6`
- Boton principal: pill `borderRadius: 999px`, `background: #111827`
- Pantallas editoriales: un solo `<Form>` global, un boton "Guardar" sticky al fondo
- Cada card tiene bloque "Donde se ve" con link `Ver:` al storefront

### Reglas editoriales que ya quedaron definidas

- Hablarle siempre en segunda persona dentro de `PAVOA Control`.
- No usar textos tipo "la clienta" o "la dueña" dentro de la UI.
- Cada pantalla nueva debe explicar:
  - que estas cambiando
  - donde se ve
  - una vista rapida
  - link para abrir la tienda
- No mezclar demasiadas partes en una sola pantalla.
- Si una pagina grande tiene varias zonas, dividirla en subpantallas.

### Reglas tecnicas que ya aparecieron y no conviene olvidar

- Los editores de Shopify se apoyan en server files dedicados:
  - `site-settings.server.js`
  - `footer-content.server.js`
  - `contact-page.server.js`
  - `nosotros-page.server.js`
  - `nosotros-blocks.server.js`
  - `announcement-bar.server.js`
  - `hero.server.js`
  - `categorias.server.js`
  - `filosofia.server.js`
  - `help-pages.server.js`
- Estos helpers ya crean fields faltantes en definiciones cuando hace falta, si la app tiene scopes suficientes.
- Scopes necesarios:
  - `read_metaobjects`
  - `write_metaobjects`
  - `read_metaobject_definitions`
  - `write_metaobject_definitions`
- Importante con React Router:
  - no importar modulos `*.server.js` directamente en codigo cliente fuera de `loader` y `action`
  - si una ruta cliente necesita defaults o helpers compartidos, moverlos a un archivo no server o duplicarlos localmente si es pequeno
- Validar siempre con `npm run build` en `pavoa-control` despues de cada pantalla nueva.

### Estado operativo del embudo

Storefront principal:

- `src/pages/CheckoutPage.jsx`
  - `begin_checkout` deduplicado por sesion de checkout
- `api/_helpers/funnel.js`
  - journeys de checkout agrupados por huella de carrito
  - `purchase_completed` separado de `payment_approved`
- `api/_helpers/mercadopago-order.js`
  - emite `purchase_completed` solo cuando el cierre final ya quedo consolidado

`PAVOA Control`:

- `app/supabase.server.js`
  - clasifica journeys por `checkout` vs `product`
  - separa abandono explicito vs abandono inferido
- `app/routes/app.embudo.jsx`
  - ya puede filtrar recorridos por scope
  - ya muestra mejor el tipo de abandono

### Cosas pendientes que no hay que repetir a ciegas

- Los links `Ver:` desde `PAVOA Control` hacia anchors del storefront siguen sin bajar fino al bloque correcto dentro del contexto embebido de Shopify.
  - ya se intento: ids en storefront, soporte de hash, reintento de scroll
  - sigue pendiente
  - no asumir que ya esta resuelto
- No mezclar datos operativos con textos editoriales:
  - `site_settings` concentra datos globales
  - `footer_content` y `contact_page` no deben duplicar esos datos
- `Nosotros` ya esta partido correctamente:
  - `Nosotros` para manifiesto y cierre
  - `Nosotros pilares` para la grilla
  - no volver a fusionarlos en una sola pantalla pesada

## Deploy de PAVOA Control en Vercel

### Como funciona actualmente (NO tocar sin entender esto)

El deploy usa un approach manual con esbuild porque `@vercel/react-router@1.3.0` genera un `server-index.mjs` que importa `react-router` como externo, pero Vercel no incluye `node_modules` en el bundle de esa funcion — lo que causa `ERR_MODULE_NOT_FOUND` en runtime.

**Estructura del deploy:**

1. `react-router.config.ts` — solo `ssr: true`, SIN `vercelPreset()`. El preset de Vercel esta desactivado.
2. `scripts/bundle-api.mjs` — script que usa esbuild para generar `api/index.js` self-contained con `react-router` bundleado adentro.
3. `api/index.js` — generado por el script, NO editar a mano. Es el handler de la serverless function.
4. `vercel.json` — `framework: null`, `buildCommand` que corre el build + el script de bundle, rewrite de todo a `/api/index`.

**Build command en Vercel dashboard:**
```
npx prisma generate && npm run build && node scripts/bundle-api.mjs
```

**Reglas criticas:**
- NO agregar `vercelPreset()` a `react-router.config.ts` — rompe el deploy.
- NO cambiar `framework: null` en `vercel.json` — rompe el deploy.
- NO editar `api/index.js` a mano — se regenera en cada build.
- Si se agrega una dependencia nueva que usa `require()` de Node (CJS), agregarla a `external` en `scripts/bundle-api.mjs`.
- Si el deploy falla con `Dynamic require of "X" is not supported`, agregar `"X"` al array `external` del script.

**Paquetes actualmente en external (no bundleados):**
- Node built-ins: `node:*`, `stream`, `crypto`, `fs`, etc.
- `@prisma/client`, `prisma` (bindings nativos)
- `exceljs` (usa require() de CJS)
- `@shopify/shopify-api`, `@shopify/shopify-app-react-router`, `@shopify/shopify-app-session-storage-prisma`
- `react`, `react-dom`

**Por que no usamos el preset de Vercel:**
`@vercel/react-router@1.3.0` genera un `server-index.mjs` que importa `react-router` directamente. Vercel no incluye `node_modules/react-router` en el bundle de esa funcion. Esto es un bug del preset que no tiene fix disponible a mayo 2026.



## Sesion 2026-05-27 — FAQ y bloques de ayuda

### Problema resuelto: bloques FAQ no aparecian en storefront

- Causa raiz: los metaobjects `help_page_block` creados por la app no tenian la capacidad `publishable` activada. La Storefront API devuelve `null` para metaobjects no publicados aunque el ID sea valido.
- Fix aplicado: `help-pages.server.js` ahora incluye `capabilities: { publishable: { status: "ACTIVE" } }` en las mutaciones de creacion y actualizacion de bloques.
- Fix adicional: `getHelpPage` en `productService.js` ahora usa dos queries — primero lee los IDs del campo `blocks_1` (value raw), luego los trae con `nodes(ids: [...])` que bypasea la restriccion de publicacion.
- Todos los bloques de todas las paginas de ayuda (22 en total) estan publicados y accesibles.

### Logica de ordenamiento FAQ

- `app.help-pages.jsx`: `updateBlock` re-ordena visualmente en tiempo real cuando cambia `order` o `blockType`, usando `Number()` para comparar strings.
- `PreguntasFrecuentesPage.jsx`: sort explicito por `order` (Number) antes de separar `careBlocks` y `regularBlocks`.
- Se elimino `injectFaqDefaultBlocks` del loader — los bloques se muestran exactamente como estan en Shopify.
- Se agrego campo `activo` (boolean) a los bloques: permite desactivar bloques sin borrarlos. Storefront filtra los inactivos.

### Scopes de PAVOA Control

- `shopify.app.toml` actualizado con lista completa de scopes.
- Deploy realizado via `shopify app deploy` — version `pavoa-control-13` liberada.
- Scopes nuevos agregados: `read_publications`, `write_publications`, `read_orders`, `read_draft_orders`, `read_customers`, `read_fulfillments`, `read_inventory`, `read_metaobjects`, `read_metaobject_definitions`, `read_locations`, `read_files`, `write_files`.
- La proxima vez que se entre a PAVOA Control, Shopify pedira aceptar los nuevos permisos.

### Nota tecnica importante

- Para operaciones Admin de Shopify desde scripts: usar `client_credentials` con `SHOPIFY_API_KEY` + `SHOPIFY_API_SECRET` del Partners Dashboard. El token expira en 24h.
- El `SHOPIFY_ADMIN_TOKEN` del storefront es un token de Storefront API, no sirve para Admin GraphQL.
- Los tokens `shpss_` son tokens de sesion de la app embebida, no funcionan desde scripts externos.

## Descartados

- Abandono de carrito con email de recuperacion — el tracking ya existe (checkout_abandon en funnel), el email se descarto.
- Reviews/valoraciones en PDP — descartado.
- Ticker en storefront — componente existe pero no se renderiza, no se agrego editor.

## Archivos locales que no deben tocarse

- `.claude/settings.local.json`
- `.cursor/`
- `.gemini/`

## Regla para retomar en otro chat

Pedir explicitamente:

- leer `CLAUDE.md`
- leer `AGENTS.md`
- leer `CODEX_HANDOFF.md`
