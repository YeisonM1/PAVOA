# QA Checklist - PAVOA

Checklist operativa para validar el storefront principal, Shopify, Mercado Pago, Supabase y `PAVOA Control`.

## Objetivo

Confirmar que el flujo comercial real funciona de punta a punta:

- navegación y UI del storefront
- creación de draft orders en Shopify
- redirección y pago con Mercado Pago
- persistencia de datos en Supabase
- visibilidad operativa en `PAVOA Control`

## Preparación mínima

Antes de probar:

- usar `main` desplegado en `https://pavoa.vercel.app`
- confirmar que el deploy más reciente no falló en Vercel
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

## Datos que conviene registrar en cada prueba

Guardar estos identificadores en una nota simple:

- fecha y hora
- ambiente probado
- producto y variante
- email usado
- `draftOrderId`
- nombre del pedido Shopify
- `preference_id`
- `payment_id`
- estado final del pago

## Orden recomendado de ejecución

1. Smoke test de navegación
2. Checkout sin pagar
3. Draft order en Shopify
4. Redirect a Mercado Pago
5. Pago aprobado
6. Pago rechazado o fallido
7. Verificación en Supabase
8. Verificación en `PAVOA Control`
9. Regresiones auxiliares

## 1. Smoke Test Storefront

Validar manualmente:

- home carga sin textos rotos ni bloques vacíos
- hero, categorías, productos, filosofía, footer y enlaces visibles funcionan
- `/categoria` carga productos y filtros
- PDP carga imágenes, tallas, colores y CTA
- carrito abre, suma cantidades y totaliza correctamente
- checkout carga y deja completar todos los campos
- cuenta carga pedidos, deseos y perfil
- contacto carga correctamente
- cambios y devoluciones abre desde footer y desde cuenta

## 2. Checkout Sin Pagar

Objetivo: validar frontend y payload antes de cobrar.

Casos:

- dejar campos vacíos y confirmar errores visibles
- probar nombre, email, teléfono, ciudad, dirección, barrio y horario
- confirmar que el botón no permite doble click útil
- confirmar que al volver a checkout el formulario persiste en `sessionStorage`
- confirmar que el resumen muestra producto, talla, color y total correctos

Resultado esperado:

- validaciones coherentes
- sin rutas rotas
- sin errores visibles en consola del navegador

## 3. Draft Order En Shopify

Objetivo: validar que el backend cree correctamente el pedido base.

Pasos:

- iniciar checkout con un producto real
- pulsar pagar
- antes de completar pago, revisar Shopify Admin

Validar en el draft:

- producto correcto
- variante correcta
- cantidad correcta
- teléfono correcto
- ciudad correcta
- barrio en `address2`
- dirección en `address1`
- nota con horario y punto de referencia
- tags esperados: `pavoa-web,mercadopago`

Si aplica descuento de bienvenida:

- validar que el draft tenga descuento aplicado

## 4. Redirect A Mercado Pago

Objetivo: validar que la preferencia se genere bien.

Validar:

- redirección exitosa al checkout de Mercado Pago
- total correcto
- ítems correctos
- cuenta receptora correcta
- no aparece error de seller/account mismatch

Si falla:

- usar el botón de diagnóstico en checkout
- revisar el resultado del endpoint `mp-diagnostico`

## 5. Pago Aprobado

Objetivo: validar el flujo completo positivo.

Pasos:

- completar un pago aprobado
- esperar redirección de vuelta
- abrir `orden-confirmada`

Validar en storefront:

- llega a la página correcta
- se muestra el resumen esperado
- el carrito se limpia

Validar en Mercado Pago:

- pago con estado `approved`
- `payment_id` disponible

Validar en Shopify:

- el draft order asociado existe o ya fue transformado según la lógica actual
- no queda un draft huérfano si el flujo lo cerró correctamente

Validar en Supabase:

- existe fila de pedido si la integración lo persiste para ese caso
- email, total e items son coherentes

## 6. Pago Fallido O Rechazado

Objetivo: validar el flujo negativo.

Probar uno de estos escenarios:

- rechazo explícito
- abandono en Mercado Pago
- error técnico al volver

Validar:

- el usuario vuelve a checkout sin romper la sesión
- aparece mensaje razonable
- el botón de diagnóstico funciona
- el draft order fallido se limpia si corresponde

## 7. Supabase

Revisar tablas y datos que el storefront ya usa.

Validar:

- pedidos creados correctamente cuando corresponde
- newsletter entra por backend
- eventos de embudo se registran
- stock alerts no quedan en estado incoherente

Chequeos concretos:

- `pedidos`
- `usuarios`
- tablas del embudo cargadas por `SUPABASE_FUNNEL_EVENTS.sql` y `SUPABASE_FUNNEL_JOURNEYS.sql`
- stock alerts si el caso de prueba las toca

## 8. PAVOA Control

Abrir `https://pavoa-control.vercel.app` después de la ronda de pruebas.

Validar por módulo:

- resumen: refleja actividad reciente
- pedidos espejo: muestra pedido nuevo si ese módulo depende del flujo probado
- newsletter: muestra nuevos registros si se probó suscripción
- wishlist insights: sin errores si se probó wishlist
- embudo: registra `begin_checkout`, errores y eventos de pago
- stock alerts: no requiere esta prueba salvo que se fuerce un caso de reposición

## 9. Regresiones Auxiliares

Después del flujo principal, probar rápido:

- login
- registro
- wishlist
- contacto
- newsletter footer
- orden confirmada con recarga
- navegación desde cuenta a cambios/devoluciones

## Escenarios Recomendados

Hacer al menos estas 6 pruebas:

1. Invitado + pago aprobado
2. Usuario logueado + pago aprobado
3. Usuario con descuento de bienvenida + pago aprobado
4. Pago rechazado
5. Variante sin stock
6. Navegación a cambios y devoluciones desde cuenta

## Criterio De Aprobación

La ronda se puede considerar sana si:

- no hay rutas rotas
- no hay textos corruptos
- Shopify recibe bien dirección, ciudad, barrio y teléfono
- Mercado Pago redirige y cobra sobre la cuenta correcta
- el flujo aprobado vuelve sin errores
- Supabase persiste lo esperado
- `PAVOA Control` refleja actividad real

## Criterio De Bloqueo

Detener deploys o campañas si pasa cualquiera de estos:

- draft orders sin dirección
- total distinto entre storefront y Mercado Pago
- seller incorrecto en Mercado Pago
- pago aprobado sin reflejo esperado en Shopify o Supabase
- ruta rota en checkout, cuenta o cambios/devoluciones
- eventos críticos del embudo no persisten

## Siguiente Nivel

Cuando esta checklist manual ya esté estable, conviene formalizar:

- una plantilla de evidencia por prueba
- una hoja simple de resultados por fecha
- una rutina post-deploy de 10 minutos
- una rutina semanal completa de extremo a extremo
