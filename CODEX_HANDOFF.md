# CODEX_HANDOFF.md

Estado de continuidad al 2026-05-18.

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
- `ticker_bar` — 6 items del ticker animado
- `home_productos_section` — eyebrow, titulo (2 lineas), tabs, textos de categorias, estado vacio
- `instagram_post` — 2 posts con imagen
- `announcement_bar` — mensajes del announcement bar

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
- No es el frente principal de este repo, pero en esta ronda ya se avanzo bastante en su capa editorial.
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

### Contenido del sitio ya migrado

Pantallas editoriales ya creadas dentro de `Contenido del sitio`:

- `Ajustes generales`
  - Metaobject: `site_settings`
  - Edita: correo, horario, nota, tiempo de respuesta, WhatsApp, Instagram, Facebook
- `Footer y newsletter`
  - Metaobject: `footer_content`
  - Edita solo textos editoriales del footer y newsletter
  - No duplica email, horario ni redes
- `Contacto`
  - Metaobject: `contact_page`
  - Edita estructura y textos de la pagina
  - No duplica datos operativos que ya viven en `site_settings`
- `Nosotros`
  - Metaobject: `nosotros_page`
  - Edita cabecera, manifiesto, introduccion y cierre editorial
- `Nosotros pilares`
  - Metaobject: `nosotros_block`
  - Edita la grilla de principios de la marca
  - Orden, etiqueta, titulo y cuerpo por bloque
- `Home barra superior`
  - Metaobject: `announcement_bar`
  - Edita si la franja esta activa y sus 3 mensajes rotativos

### Reglas editoriales que ya quedaron definidas

- Hablarle siempre en segunda persona dentro de `PAVOA Control`.
- No usar textos tipo “la clienta” o “la dueña” dentro de la UI.
- Cada pantalla nueva debe explicar:
  - que estas cambiando
  - donde se ve
  - una vista rapida
  - link para abrir la tienda
- No mezclar demasiadas partes en una sola pantalla.
- Si una pagina grande tiene varias zonas, dividirla en subpantallas.

### Reglas tecnicas que ya aparecieron y no conviene olvidar

- Los editores nuevos de Shopify se estan apoyando en server files dedicados, por ejemplo:
  - `site-settings.server.js`
  - `footer-content.server.js`
  - `contact-page.server.js`
  - `nosotros-page.server.js`
  - `nosotros-blocks.server.js`
  - `announcement-bar.server.js`
- Estos helpers ya crean fields faltantes en definiciones cuando hace falta, si la app tiene scopes suficientes.
- Scopes que ya hubo que agregar para esto:
  - `read_metaobjects`
  - `write_metaobjects`
  - `read_metaobject_definitions`
  - `write_metaobject_definitions`
- Importante con React Router:
  - no importar modulos `*.server.js` directamente en codigo cliente fuera de `loader` y `action`
  - si una ruta cliente necesita defaults o helpers compartidos, moverlos a un archivo no server o duplicarlos localmente si es pequeno
- Validar siempre con `npm run build` en `pavoa-control` despues de cada pantalla nueva.

### Cosas pendientes que no hay que repetir a ciegas

- Los links `Ver:` desde `PAVOA Control` hacia anchors del storefront siguen sin bajar fino al bloque correcto dentro del contexto embebido de Shopify.
  - ya se intento:
    - ids en storefront
    - soporte de `hash`
    - reintento de scroll
  - sigue pendiente
  - no asumir que ya esta resuelto
- No mezclar datos operativos con textos editoriales:
  - `site_settings` concentra datos globales
  - `footer_content` y `contact_page` no deben duplicar esos datos
- `Nosotros` ya esta partido correctamente:
  - `Nosotros` para manifiesto y cierre
  - `Nosotros pilares` para la grilla
  - no volver a fusionarlos en una sola pantalla pesada

### Lo siguiente mas natural en Contenido del sitio

Si se sigue esta linea, el siguiente bloque recomendado es Home editorial por partes:

1. `Hero principal`
2. `Ticker`
3. `Categorias destacadas`
4. `Filosofia`

No conviene intentar “editar toda la home” en una sola vista.

### Commits utiles de esta ronda en `pavoa-control`

- `50812df` - `Reorganize admin navigation layout`
- `695d88e` - `Polish admin sidebar accordions`
- `51fdb7a` - `Add nosotros pillars editor`
- `e56507c` - `Add announcement bar editor`

## Siguientes frentes pendientes

1. Validar que el embudo este registrando data real en Supabase.
2. Dar visibilidad operativa a pagos y pedidos en `PAVOA Control`.

## Descartados

- Abandono de carrito con email de recuperacion — el tracking ya existe (checkout_abandon en funnel), el email se descarto.
- Reviews/valoraciones en PDP — descartado.

## Archivos locales que no deben tocarse

- `.claude/settings.local.json`
- `.cursor/`
- `.gemini/`

## Regla para retomar en otro chat

Pedir explicitamente:

- leer `CLAUDE.md`
- leer `AGENTS.md`
- leer `CODEX_HANDOFF.md`
