# QA Checklist - PAVOA

Checklist operativa para validar storefront, Shopify, Mercado Pago, Supabase y `PAVOA Control`.

## Objetivo

Confirmar que el flujo comercial real funciona de punta a punta:

- navegacion y UI del storefront
- creacion de draft orders en Shopify
- redireccion y pago con Mercado Pago
- persistencia de datos en Supabase
- visibilidad operativa en `PAVOA Control`

## Preparacion minima

Antes de probar:

- usar `main` desplegado en `https://pavoa.vercel.app`
- confirmar que el deploy mas reciente no fallo en Vercel
- tener acceso a:
  - Shopify Admin
  - Mercado Pago cuenta receptora
  - Supabase
  - `PAVOA Control`
- definir un producto de prueba barato en Shopify
- definir una variante sin stock para prueba negativa
- definir un email de prueba para usuario invitado
- definir un email de prueba para usuario registrado
- si se va a probar descuento de bienvenida, usar un usuario verificado que no lo haya consumido

## Datos que conviene guardar en cada prueba

- fecha y hora
- ambiente probado
- producto y variante
- email usado
- `draftOrderId`
- nombre del pedido Shopify
- `preference_id`
- `payment_id`
- estado final del pago

## Orden recomendado

1. Smoke test de navegacion
2. Checkout sin pagar
3. Draft order en Shopify
4. Redirect a Mercado Pago
5. Pago aprobado
6. Pago rechazado o fallido
7. Verificacion en Supabase
8. Verificacion en `PAVOA Control`
9. Regresiones auxiliares

## 1. Smoke test storefront

Validar manualmente:

- home carga sin textos rotos ni bloques vacios
- hero, categorias, productos, filosofia, footer y enlaces visibles funcionan
- `/categoria` carga productos y filtros
- PDP carga imagenes, tallas, colores y CTA
- carrito abre, suma cantidades y totaliza correctamente
- checkout carga y deja completar todos los campos
- cuenta carga pedidos, deseos y perfil
- contacto carga correctamente
- cambios y devoluciones abre desde footer y desde cuenta

## 2. Checkout sin pagar

Objetivo: validar frontend y payload antes de cobrar.

Casos:

- dejar campos vacios y confirmar errores visibles
- probar nombre, email, telefono, ciudad, direccion, barrio y horario
- confirmar que el boton no permite doble click util
- confirmar que al volver a checkout el formulario persiste en `sessionStorage`
- confirmar que el resumen muestra producto, talla, color y total correctos

Resultado esperado:

- validaciones coherentes
- sin rutas rotas
- sin errores visibles en consola del navegador

## 3. Draft order en Shopify

Objetivo: validar que el backend cree correctamente el pedido base.

Pasos:

- iniciar checkout con un producto real
- pulsar pagar
- antes de completar pago, revisar Shopify Admin

Validar en el draft:

- producto correcto
- variante correcta
- cantidad correcta
- telefono correcto
- ciudad correcta
- barrio en `address2`
- direccion en `address1`
- nota con horario y punto de referencia
- tags esperados: `pavoa-web,mercadopago`

Si aplica descuento de bienvenida:

- validar que el draft tenga descuento aplicado

## 4. Redirect a Mercado Pago

Objetivo: validar que la preferencia se genere bien.

Validar:

- redireccion exitosa al checkout de Mercado Pago
- total correcto
- items correctos
- cuenta receptora correcta
- no aparece error de seller/account mismatch

Si falla:

- usar el boton de diagnostico en checkout
- revisar la respuesta del flujo `mp-diagnostico`

## 5. Pago aprobado

Objetivo: validar el flujo completo positivo.

Pasos:

- completar un pago aprobado
- esperar redireccion de vuelta
- abrir `orden-confirmada`

Validar en storefront:

- llega a la pagina correcta
- se muestra el resumen esperado
- el carrito se limpia

Validar en Mercado Pago:

- pago con estado `approved`
- `payment_id` disponible

Validar en Shopify:

- el draft order asociado existe o ya fue transformado segun la logica actual
- no queda un draft huerfano si el flujo lo cerro correctamente

Validar en Supabase:

- existe fila de pedido si la integracion lo persiste para ese caso
- email, total e items son coherentes
- se registran eventos de embudo ligados al checkout

## 6. Pago fallido o rechazado

Objetivo: validar el flujo negativo.

Probar uno de estos escenarios:

- rechazo explicito
- abandono en Mercado Pago
- error tecnico al volver

Validar:

- el usuario vuelve a checkout sin romper la sesion
- aparece mensaje razonable
- el boton de diagnostico funciona
- el draft order fallido se limpia si corresponde

## 7. Supabase

Revisar tablas y datos que el storefront ya usa.

Validar:

- pedidos creados correctamente cuando corresponde
- newsletter entra por backend
- eventos de embudo se registran
- stock alerts no quedan en estado incoherente
- wishlist merge no rompe `wishlist_events`

Chequeos concretos:

- `pedidos`
- `usuarios`
- `newsletter_subscribers`
- `wishlist_events`
- tablas del embudo cargadas por `SUPABASE_FUNNEL_EVENTS.sql` y `SUPABASE_FUNNEL_JOURNEYS.sql`
- `stock_alerts` si el caso de prueba las toca

## 8. PAVOA Control

Abrir `https://pavoa-control.vercel.app` despues de la ronda de pruebas.

Validar por modulo:

- resumen: refleja actividad reciente
- pedidos espejo: muestra pedido nuevo si ese modulo depende del flujo probado
- newsletter: muestra nuevos registros si se probo suscripcion
- wishlist insights: sin errores si se probo wishlist
- embudo: registra `begin_checkout`, errores y eventos de pago
- stock alerts: no requiere esta prueba salvo que se fuerce un caso de reposicion

## 9. Regresiones auxiliares

Despues del flujo principal, probar rapido:

- login
- registro
- verificacion de cuenta
- recuperar contrasena
- wishlist
- contacto
- newsletter footer
- orden confirmada con recarga
- navegacion desde cuenta a cambios/devoluciones

## Escenarios recomendados

Hacer al menos estas 6 pruebas:

1. Invitado + pago aprobado
2. Usuario logueado + pago aprobado
3. Usuario con descuento de bienvenida + pago aprobado
4. Pago rechazado
5. Variante sin stock
6. Navegacion a cambios y devoluciones desde cuenta

## Criterio de aprobacion

La ronda se puede considerar sana si:

- no hay rutas rotas
- no hay textos corruptos
- Shopify recibe bien direccion, ciudad, barrio y telefono
- Mercado Pago redirige y cobra sobre la cuenta correcta
- el flujo aprobado vuelve sin errores
- Supabase persiste lo esperado
- `PAVOA Control` refleja actividad real

## Criterio de bloqueo

Detener deploys o campanas si pasa cualquiera de estos:

- draft orders sin direccion
- total distinto entre storefront y Mercado Pago
- seller incorrecto en Mercado Pago
- pago aprobado sin reflejo esperado en Shopify o Supabase
- ruta rota en checkout, cuenta o cambios/devoluciones
- eventos criticos del embudo no persisten

## Siguiente nivel

Cuando esta checklist manual ya este estable, conviene formalizar:

- una plantilla de evidencia por prueba
- una hoja simple de resultados por fecha
- una rutina post-deploy de 10 minutos
- una rutina semanal completa de extremo a extremo
