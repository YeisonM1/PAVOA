# CODEX_HANDOFF.md

Estado de cierre al 2026-05-03.

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
- Correos transaccionales redisenados
- Flujo Mailtrap integrado

### Punto descartado hoy
- Se probo agregar un bloque de decision arriba del selector en PDP
- No gusto
- Ya fue revertido y empujado

Commit de revert:
- `8933e12` `Revert PDP decision block`

### Ultimos cambios importantes en main
- `34d0d1d` `Refresh transactional email system`
- `3a1f6cd` `Add Mailtrap sandbox email provider`
- `8933e12` `Revert PDP decision block`

### Siguiente trabajo recomendado en storefront
1. Reescribir bloque de confianza en `src/components/product/ProductVariantSelector.jsx`
2. Extender medicion del embudo en `src/lib/analytics.js`
3. Mover newsletter del footer a endpoint backend conservando UI
4. Corregir escalabilidad de `getProductos()` para no depender de `products(first: 100)`

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

### Pedidos espejo
- Modulo montado
- Tabla puede estar vacia segun datos actuales

### Mailtrap en app
- `PAVOA Control` tambien ya soporta `mailtrap_sandbox`

### Commits importantes en app repo
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
- luego sigue con el bloque de confianza de compra o con analytics del embudo

