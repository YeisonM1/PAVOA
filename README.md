# PAVOA

Storefront headless de PAVOA.

## Stack
- React 19
- Vite 8
- Tailwind CSS v4
- Shopify Storefront API
- Supabase
- Mercado Pago
- Vercel Serverless Functions

## Estructura
- `src/`: storefront
- `api/`: funciones serverless
- `public/`: assets públicos
- `SUPABASE_FUNNEL_EVENTS.sql`: tabla de eventos del embudo
- `SUPABASE_FUNNEL_JOURNEYS.sql`: tabla derivada de recorridos

## Comandos
```bash
npm install
npm run dev
npm run build
npm run lint
```

## Entorno
Ver `.env.example`.

Variables relevantes:
- `VITE_SHOPIFY_DOMAIN`
- `VITE_SHOPIFY_TOKEN`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MP_ACCESS_TOKEN`
- `RESEND_API_KEY`

## Producción
- Storefront: `https://pavoa.vercel.app`
- Shopify visible: `pavoa-4502.myshopify.com`

## Documentación operativa
- `CLAUDE.md`: reglas base de trabajo
- `AGENTS.md`: guía activa de continuidad
- `CODEX_HANDOFF.md`: estado actual del proyecto y pendientes reales

## Nota
`PAVOA Control` vive como repo/app separado dentro de `pavoa-control/`, pero no es la prioridad principal de este repo.
