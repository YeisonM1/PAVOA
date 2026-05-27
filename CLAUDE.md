# CLAUDE.md - PAVOA

PAVOA es el storefront headless principal de la marca.

- URL: `https://pavoa.com.co`
- Shopify: `pavoa-4502.myshopify.com`
- Stack: React 19 + Vite 8 + Tailwind CSS v4 + Vercel serverless en `api/`

## Reglas criticas

1. No tocar el diseno sin validacion clara.
2. No asumir: leer el archivo real antes de modificarlo.
3. No refactorizar sin permiso explicito.
4. No agregar dependencias sin justificarlo primero.
5. Explicar que se va a cambiar antes de editar.
6. Si hay duda operativa o comercial, preguntar antes de actuar.

## Comandos

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Arquitectura

### Frontend (`src/`)

- Routing: React Router DOM v7 con lazy loading.
- Estilos: Tailwind v4.
- Fuente principal: Raleway.
- Alias: `@/` -> `src/`

Estructura activa:

```text
src/
  assets/
  components/
  context/
  hooks/
  lib/
  pages/
  sections/
  services/
  utils/
```

Puntos reales del storefront:

- `src/services/productService.js`
  - Shopify Storefront API version `2026-04`
  - paginacion real del catalogo
  - metaobjects para home, filosofia, nosotros, contacto, footer y help pages
- `src/lib/funnel.js`
  - sesion local del embudo
  - eventos enviados a `/api/contacto`
- `src/lib/analytics.js`
  - eventos de analytics y `begin_checkout`

### Backend (`api/`)

Funciones activas hoy:

| Archivo | Funcion |
| --- | --- |
| `check-descuento.js` | valida descuento de bienvenida |
| `contacto.js` | contacto, newsletter, funnel y stock alerts |
| `forgot-password.js` | inicio de recuperacion |
| `login.js` | login cliente |
| `mis-pedidos.js` | pedidos, wishlist y merge guest/user |
| `pedido.js` | draft order Shopify + validaciones + funnel |
| `procesar-pago.js` | preferencia Mercado Pago + diagnostico |
| `register.js` | registro cliente |
| `reset-password.js` | cambio de password |
| `verify.js` | verificacion de cuenta |
| `webhook-mercadopago.js` | confirmacion de pago |
| `webhook-shopify.js` | sincronizacion operativa desde Shopify |

Helpers relevantes:

- `api/_helpers/funnel.js`
- `api/_helpers/mail.js`
- `api/_helpers/mercadopago-order.js`
- `api/_helpers/shopify-token.js`
- `api/_helpers/cart-validation.js`

## Flujo comercial principal

1. `POST /api/pedido` crea draft order en Shopify.
2. `POST /api/procesar-pago` crea preferencia Mercado Pago.
3. Mercado Pago redirige a `orden-confirmada`.
4. `POST /api/webhook-mercadopago` confirma el pago y actualiza persistencia.
5. `POST /api/contacto` cubre contacto, newsletter, funnel y stock alerts.

## Variables de entorno

Ver `.env.example`.

Notas:

- Las `VITE_*` son publicas y viven en build time.
- Las secretas solo deben usarse en backend.
- Variables server-only relevantes:
  - `SHOPIFY_CLIENT_SECRET`
  - `SHOPIFY_WEBHOOK_SECRET`
  - `MP_ACCESS_TOKEN`
  - `MP_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `MAILTRAP_SANDBOX_API_TOKEN`
  - `MAILTRAP_SANDBOX_INBOX_ID`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `JWT_SECRET`

## Git workflow

Cada cambio cerrado debe terminar con:

1. `npm run build`
2. commit a `main`
3. push a `main`

No dejar cambios funcionales sin sincronizar.

## Limite de Vercel Hobby

El plan Hobby permite maximo 12 archivos en `api/` y hoy ya estan ocupados.

Antes de crear una funcion nueva:

1. Verificar si la necesidad cabe en una funcion existente.
2. Preferir ampliar `contacto.js` o consolidar funciones antes de abrir otra.
3. Evitar crecer `api/` por conveniencia si el frontend o Shopify ya resuelven el caso.
