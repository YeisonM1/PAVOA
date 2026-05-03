# PAVOA - Mapa Shopify / Supabase

Fecha: 3 de mayo de 2026

## Objetivo

Volver Shopify el panel operativo de la clienta sin exponerle Supabase ni duplicar fuentes de datos.

La regla base para no romper el proyecto es esta:

- cada dato debe tener una sola fuente de verdad
- Shopify debe quedarse con lo editorial y operativo de negocio
- Supabase debe quedarse con lo interno, técnico o app-owned

---

## 1. Qué ya vive en Shopify

### Catálogo nativo

El catálogo principal ya sale de Shopify por Storefront API en [src/services/productService.js](/C:/Users/Usuario/PAVOA/src/services/productService.js):

- productos
- variantes
- stock disponible por variante
- imágenes
- product type
- tags
- colecciones

También ya se consumen metafields de producto:

- `pavoa.detalles`
- `pavoa.cuidados`
- `custom.hex_color`

Esto significa que:

- nombres de productos
- descripciones
- imágenes
- categorías base
- colores/tallas/variantes
- parte del contenido de ficha

ya tienen a Shopify como fuente de verdad.

### Metaobjetos ya activos

En este momento ya existen y se usan estos metaobjetos:

- `hero_slide`
- `categoria_destacada`
- `announcement_bar`
- `instagram_post`

Se consumen desde [src/services/productService.js](/C:/Users/Usuario/PAVOA/src/services/productService.js).

Eso ya le da a Shopify control sobre:

- hero del home
- announcement bar
- categorías destacadas del home
- imágenes de la sección de Instagram

### Shopify Admin / Backoffice

Además del storefront, Shopify ya controla operativamente:

- draft orders
- órdenes reales
- inventario
- fulfillment
- refunds

Y el proyecto ya reacciona a eventos de Shopify en [api/webhook-shopify.js](/C:/Users/Usuario/PAVOA/api/webhook-shopify.js).

---

## 2. Qué vive hoy en Supabase

### Tablas detectadas

#### `usuarios`

La usa el auth custom y parte del checkout:

- registro
- login
- verificación
- reset password
- descuento de bienvenida

Archivos:

- [api/register.js](/C:/Users/Usuario/PAVOA/api/register.js)
- [api/login.js](/C:/Users/Usuario/PAVOA/api/login.js)
- [api/verify.js](/C:/Users/Usuario/PAVOA/api/verify.js)
- [api/forgot-password.js](/C:/Users/Usuario/PAVOA/api/forgot-password.js)
- [api/reset-password.js](/C:/Users/Usuario/PAVOA/api/reset-password.js)
- [api/check-descuento.js](/C:/Users/Usuario/PAVOA/api/check-descuento.js)
- [api/procesar-pago.js](/C:/Users/Usuario/PAVOA/api/procesar-pago.js)
- [api/_helpers/mercadopago-order.js](/C:/Users/Usuario/PAVOA/api/_helpers/mercadopago-order.js)

#### `pedidos`

Es un espejo interno de órdenes pagadas para el perfil PAVOA y trazabilidad de checkout.

Guarda cosas como:

- email del cliente
- `payment_id`
- nombre/id de orden Shopify
- total
- descuento aplicado
- estado financiero
- fulfillment
- tracking
- items

Archivos:

- [api/_helpers/mercadopago-order.js](/C:/Users/Usuario/PAVOA/api/_helpers/mercadopago-order.js)
- [api/mis-pedidos.js](/C:/Users/Usuario/PAVOA/api/mis-pedidos.js)
- [api/webhook-shopify.js](/C:/Users/Usuario/PAVOA/api/webhook-shopify.js)
- [src/services/authService.js](/C:/Users/Usuario/PAVOA/src/services/authService.js)

#### `newsletter_subscribers`

Se inserta directamente desde frontend en el footer.

Archivo:

- [src/sections/Footer.jsx](/C:/Users/Usuario/PAVOA/src/sections/Footer.jsx)

#### `stock_alerts`

Se usa para alertas de reposición.

Archivo:

- [api/contacto.js](/C:/Users/Usuario/PAVOA/api/contacto.js)

#### Wishlist y analítica de wishlist

- `wishlists`
- `wishlist_events`
- `wishlist_actor_state`
- `wishlist_guest_window`

Archivo:

- [api/mis-pedidos.js](/C:/Users/Usuario/PAVOA/api/mis-pedidos.js)

### Qué significa esto

Supabase hoy no es solo “una base cualquiera”. Está sosteniendo:

- autenticación de clientes
- perfil interno “Mi Cuenta”
- historial de pedidos dentro de PAVOA
- wishlist
- newsletter
- alertas de stock
- reglas de descuento de bienvenida

Eso no conviene moverlo a Shopify de golpe.

---

## 3. Qué sigue hardcodeado en frontend

Todavía hay contenido visible que no está en Shopify ni en Supabase.

Ejemplos detectados:

- email visible `hola@pavoa.co`
- horario visible
- URL de Instagram repetida en varias secciones
- textos institucionales
- parte del footer
- parte del contacto
- copy fijo de categorías y filosofía

Archivos relevantes:

- [src/sections/Footer.jsx](/C:/Users/Usuario/PAVOA/src/sections/Footer.jsx)
- [src/pages/ContactPage.jsx](/C:/Users/Usuario/PAVOA/src/pages/ContactPage.jsx)
- [src/components/GuiaTallasModal.jsx](/C:/Users/Usuario/PAVOA/src/components/GuiaTallasModal.jsx)
- [src/sections/Header.jsx](/C:/Users/Usuario/PAVOA/src/sections/Header.jsx)
- [src/sections/header/MobileMenu.jsx](/C:/Users/Usuario/PAVOA/src/sections/header/MobileMenu.jsx)
- [src/sections/Categorias.jsx](/C:/Users/Usuario/PAVOA/src/sections/Categorias.jsx)
- [src/sections/Filosofia.jsx](/C:/Users/Usuario/PAVOA/src/sections/Filosofia.jsx)

Esto es justamente lo mejor para mover a Shopify porque:

- la clienta sí puede editarlo
- no depende de tablas técnicas
- no afecta lógica crítica

---

## 4. Qué NO conviene mover a Shopify ahora

Estas piezas hoy tienen mejor encaje en Supabase o en lógica propia:

- auth custom de clientes
- tokens de verificación y reset
- wishlist y sus analíticas
- espejo interno de pedidos para el panel PAVOA
- alertas de stock
- lógica de descuento de bienvenida
- eventos técnicos de checkout

Razón:

- Shopify no reemplaza limpio este modelo actual sin refactor grande
- moverlo a medias duplicaría estados
- parte de esto no es para que la clienta lo edite, sino para que lo use en una interfaz simple

---

## 5. Qué sí conviene mover a Shopify

### Prioridad alta

Mover a Shopify metaobjects o shop metafields:

- email visible de contacto
- horario visible
- observación de atención 24/7
- links de redes sociales
- copy de filosofía
- copy institucional del home
- textos del footer
- textos de ayuda visibles
- títulos/subtítulos de bloques promocionales
- badges o mensajes comerciales de temporada

### Prioridad media

Mover a Shopify:

- slides del home que todavía dependan de fallbacks
- configuración de categorías destacadas si todavía hay labels fijos en UI
- assets institucionales editables

### Prioridad baja

Evaluar después:

- newsletter
- alertas de stock
- panel de leads/contactos

---

## 6. Qué debería ver la clienta en Shopify

La experiencia ideal para ella es esta:

### En Shopify nativo

- Productos
- Colecciones
- Inventario
- Pedidos
- Clientes
- Descuentos
- Contenido
- Metaobjetos

### En una app propia dentro de Shopify

Una app embebida tipo `PAVOA Control` para mostrar de forma simple lo que hoy vive en Supabase:

- alertas de stock
- suscripciones de newsletter
- wishlist más guardados
- indicadores de intención de compra
- resumen de pedidos espejo
- métricas internas

Así la clienta entra siempre a Shopify y siente que todo está centralizado, aunque parte siga usando Supabase por detrás.

---

## 7. Recomendación de arquitectura sin duplicados

### Fuente de verdad por dominio

#### Shopify

Debe ser la fuente de verdad para:

- catálogo
- inventario
- órdenes reales
- fulfillment
- contenido editorial editable
- redes, horarios, contacto visible
- metaobjetos de home y secciones

#### Supabase

Debe ser la fuente de verdad para:

- auth custom PAVOA
- wishlist
- newsletter si se mantiene custom
- alertas de stock
- analítica propia
- pedidos espejo para cuenta PAVOA

### Regla operativa

No hacer doble escritura del mismo dato en dos sitios si ambos pretenden mandar.

Ejemplo correcto:

- el horario visible manda Shopify
- Supabase no guarda horario

Ejemplo incorrecto:

- Instagram URL en metaobjeto Shopify
- pero también hardcodeada en Header/Footer/MobileMenu

---

## 8. Orden recomendado de implementación

### Fase 1 - Contenido editable sin riesgo

Mover primero a Shopify:

- contacto visible
- horario
- redes
- textos institucionales
- footer content
- bloques de ayuda visibles

Esto tiene riesgo bajo y mejora mucho la autonomía de la clienta.

### Fase 2 - Limpiar hardcodes

Una vez creados esos metaobjetos/metafields:

- reemplazar strings hardcodeados en React
- dejar un fallback temporal
- luego eliminar el fallback cuando el contenido ya exista en Shopify

### Fase 3 - Panel operativo

Construir una app embebida `PAVOA Control` para exponer sin dolor:

- newsletter
- stock alerts
- wishlist insights
- pedidos internos

### Fase 4 - Consolidación

Revisar si alguna tabla de Supabase ya no aporta valor y se puede retirar.

---

## 9. Qué no romper al migrar

Antes de mover cualquier cosa:

- definir la fuente de verdad del dato
- revisar si ya existe en metaobjetos
- revisar si ya existe hardcodeado
- revisar si ya se persiste en Supabase
- evitar dejar dos lugares editables para lo mismo

Checklist rápido por cada dato:

1. ¿Ya sale de Shopify?
2. ¿Está hardcodeado en React?
3. ¿Se guarda en Supabase?
4. ¿La clienta necesita editarlo?
5. ¿Ese cambio es editorial o lógico?

Si es editorial, casi siempre debería vivir en Shopify.
Si es lógico o técnico, casi siempre debería quedarse fuera del panel de la clienta.

---

## 10. Recomendación final

La mejor decisión para PAVOA hoy es esta:

- no darle acceso a Supabase a la clienta
- convertir Shopify en el centro de operación
- mover contenido editable a metaobjetos/metafields
- dejar Supabase solo como capa interna
- montar después una app embebida dentro de Shopify para la parte operativa que no cabe nativamente

Eso te da:

- menos riesgo de romper producción
- menos duplicados
- mejor experiencia para la clienta
- una arquitectura más limpia para seguir escalando

