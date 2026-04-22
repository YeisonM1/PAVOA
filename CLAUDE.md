# CLAUDE.md — PAVOA

PAVOA is a headless e-commerce platform for Colombian fashion/sports apparel.
- **URL:** https://pavoa.vercel.app — **Shopify:** pavoa-4502.myshopify.com
- **Stack:** React + Vite + Tailwind CSS v4 + Vercel serverless (`/api/`)

---

## ⚠️ Reglas críticas

1. **NO tocar el diseño** — no cambiar clases Tailwind, estructura visual ni estilos
2. **NO asumir** — pedir el archivo antes de modificarlo
3. **NO refactorizar** sin permiso explícito
4. **NO agregar dependencias** sin justificarlo primero
5. **Explicar QUÉ y CÓMO** antes de mostrar código
6. Si hay duda → **preguntar antes de actuar**

---

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # Production build → dist/
npm run lint     # ESLint
```

---

## Architecture

### Frontend (`src/`)
- **Routing:** React Router DOM v7, lazy-loaded. Auth pages sin Header/Footer, resto usa AppShell
- **Styling:** Tailwind v4. Colores brand en `src/index.css` — negro `#0B0B0B`, beige `#F6F1EA`, gold `#DFCDB4`, fuente Raleway
- **Path aliases:** `@/` → `src/`

```
src/
  pages/       # Una por ruta
  sections/    # Header, Footer, CartDrawer
  components/  # ProductCard, SEO, SkeletonCard
  hooks/       # useLocalStorage, useCarousel
  services/    # productService.js, authService.js
  context/     # CartContext (persiste en localStorage)
```

### Backend (`api/`)
| Archivo | Función |
|---|---|
| `pedido.js` | Draft Order en Shopify — token via Client Credentials Grant, cacheado |
| `procesar-pago.js` | Crea preferencia MercadoPago |
| `webhook-mercadopago.js` | Actualiza orden en Supabase al pagar |
| `register.js` / `login.js` | Auth con bcrypt + Supabase + Resend |

### Flujo de checkout
1. `POST /api/pedido` → Draft Order en Shopify
2. `POST /api/procesar-pago` → preferencia MP, devuelve `init_point`
3. MP redirige a `OrdenConfirmadaPage`
4. `POST /api/webhook-mercadopago` → orden completa en Supabase

---

## Variables de entorno
Ver `.env.example`. Las `VITE_*` son públicas (build time). Las secretas solo en `/api/`.

---
## 🦴 Caveman Mode (Efficiency Layer)
- **No filler:** No "Happy to help", no "Based on your request".
- **Direct execution:** If a tool is needed, call it immediately.
- **Concise output:** Use minimalist linguistics. Result > Explanation.
- **Token priority:** Maximize context utility by pruning unnecessary particles.

---

## Git workflow
Commit + push a `main` después de cada cambio. Vercel auto-deploys. **Nunca dejar commits sin sincronizar.**