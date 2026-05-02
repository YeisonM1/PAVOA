# PAVOA — Moda Deportiva Premium

E-commerce headless de moda deportiva femenina de diseño, construido con React 19 + Vite 8 + Tailwind CSS v4.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4 |
| Backend | Vercel Serverless Functions (Node.js) |
| Productos | Shopify Storefront API (GraphQL) |
| Pagos | MercadoPago |
| Auth & DB | Supabase (usuarios, pedidos) |
| Email | Resend |

## Estructura del Proyecto

```
├── api/                    # Vercel Serverless Functions
│   ├── _helpers/           # Helpers compartidos (auth, shopify, email templates)
│   ├── login.js            # Auth con JWT
│   ├── register.js         # Registro + email verificación
│   ├── pedido.js           # Crear draft order en Shopify
│   ├── procesar-pago.js    # Crear preferencia MercadoPago
│   ├── webhook-mercadopago.js  # Webhook MP → completar orden + email
│   ├── webhook-shopify.js      # Webhook Shopify → tracking + emails
│   └── ...
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── product/        # Sub-componentes de ProductPage
│   │   └── ...
│   ├── pages/              # Páginas (lazy loaded)
│   ├── sections/           # Secciones de layout (Header, Footer, etc.)
│   │   └── header/         # Sub-componentes del Header
│   ├── services/           # Servicios (Shopify API, auth)
│   ├── hooks/              # Custom hooks
│   ├── context/            # React Context providers
│   ├── lib/                # Utilidades (analytics, etc.)
│   └── utils/              # Helpers puros
└── public/                 # Assets estáticos
```

## Desarrollo Local

```bash
npm install
npm run dev      # → http://localhost:5173
```

## Variables de Entorno

### Cliente (prefijo `VITE_`)
- `VITE_SHOPIFY_DOMAIN` — Dominio de la tienda Shopify
- `VITE_SHOPIFY_TOKEN` — Token Storefront API
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL` — URL base de la app
- `VITE_WHATSAPP_NUMBER` — Número de WhatsApp para checkout

### Servidor (Vercel)
- `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` — OAuth de Shopify
- `SHOPIFY_ADMIN_TOKEN` — Token admin para webhooks
- `SHOPIFY_WEBHOOK_SECRET` — Secret del webhook de Shopify
- `MP_ACCESS_TOKEN` / `MP_WEBHOOK_SECRET` — MercadoPago
- `RESEND_API_KEY` — API key de Resend
- `JWT_SECRET` — Secret para tokens JWT de sesión

## Deploy

Push a `main` → Vercel despliega automáticamente.

```bash
git add -A && git commit -m "feat: descripción" && git push
```

## Licencia

Privado — © 2026 PAVOA. Todos los derechos reservados.
