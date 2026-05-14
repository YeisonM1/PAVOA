# PAVOA

Storefront headless principal de PAVOA.

## Stack

- React 19
- Vite 8
- Tailwind CSS v4
- Shopify Storefront API
- Supabase
- Mercado Pago
- Vercel Serverless Functions
- Resend

## Estructura

- `src/`: storefront
- `api/`: funciones serverless
- `api/_helpers/`: helpers backend
- `public/`: assets publicos
- `pavoa-control/`: app Shopify separada, no prioritaria
- `SUPABASE_FUNNEL_EVENTS.sql`: tabla de eventos del embudo
- `SUPABASE_FUNNEL_JOURNEYS.sql`: tabla derivada de recorridos

## Funciones serverless activas

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

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Entorno

Ver `.env.example`.

Variables relevantes:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SHOPIFY_DOMAIN`
- `VITE_SHOPIFY_TOKEN`
- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_ADMIN_TOKEN`
- `SHOPIFY_WEBHOOK_SECRET`
- `VITE_APP_URL`
- `MP_ACCESS_TOKEN`
- `MP_EXPECTED_USER_ID`
- `MP_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `MAIL_PROVIDER`
- `MAILTRAP_SANDBOX_API_TOKEN`
- `MAILTRAP_SANDBOX_INBOX_ID`
- `JWT_SECRET`

## Produccion

- Storefront: `https://pavoa.vercel.app`
- Shopify visible: `pavoa-4502.myshopify.com`
- PAVOA Control: `https://pavoa-control.vercel.app`

## Documentacion operativa

- `CLAUDE.md`: reglas base de trabajo
- `AGENTS.md`: guia activa de continuidad
- `CODEX_HANDOFF.md`: estado actual del proyecto y pendientes reales
- `QA_CHECKLIST.md`: validacion manual end-to-end

## Nota

La prioridad de este repo es el storefront principal. `PAVOA Control` vive dentro de `pavoa-control/`, pero no es el frente principal salvo necesidad operativa concreta.
