# DUAL_BEAUTY_KICKOFF.md

Documento de arranque para abrir un proyecto nuevo de `Dual Beauty` desde cero.

La idea es que cualquier agente nuevo entre, lea este archivo y pueda empezar a construir el sistema con contexto suficiente, sin mezclarlo con `PAVOA`.

---

## Objetivo

Construir el sistema digital de `Dual Beauty` con buena base operativa desde el inicio:

- marca clara
- estructura tecnica limpia
- sistema facil de mantener
- foco en conversion
- automatizaciones utiles
- posibilidad de crecer sin rehacer todo

---

## Regla principal

`Dual Beauty` es un proyecto aparte.

No mezclar:
- tono de marca de `PAVOA`
- arquitectura de `PAVOA`
- decisiones visuales de `PAVOA`
- flujos operativos de `PAVOA`

Puede reutilizarse metodologia, pero no identidad.

---

## Lo que debe hacer el agente al empezar

1. Entender que este proyecto arranca desde cero
2. No asumir stack ni arquitectura sin validarlo
3. Proponer primero una estructura clara
4. Priorizar sistema, conversion y operacion antes que adornos
5. Separar:
   - marca
   - contenido
   - tienda
   - automatizaciones
   - analitica
   - backoffice

---

## Primeras preguntas que debe resolver el agente

Antes de construir, debe aclarar:

1. `Dual Beauty` vende:
   - productos fisicos
   - servicios
   - ambos

2. La web sera:
   - ecommerce
   - landing comercial
   - sistema mixto

3. El canal principal sera:
   - Shopify
   - sitio propio con checkout externo
   - agenda / reservas
   - WhatsApp como cierre

4. Se necesita o no:
   - login de clientes
   - panel interno
   - CRM
   - automatizacion de correos
   - integracion con inventario

---

## Prioridades sugeridas

Orden recomendado de construccion:

1. Definir identidad funcional de marca
2. Definir arquitectura del proyecto
3. Definir recorrido de conversion
4. Definir stack
5. Construir version minima util
6. Medir
7. Automatizar

---

## Skills recomendadas para Dual Beauty

### 1. DualBeauty Brand Voice

Para fijar:
- tono
- vocabulario
- estilo
- palabras que si usar
- palabras que no usar

Debe servir para:
- home
- producto/servicio
- captions
- correos
- WhatsApp
- respuestas de soporte

### 2. DualBeauty Operator

Para tomar decisiones operativas:
- que construir primero
- que automatizar
- que es deuda tecnica
- que mueve conversion
- que no vale la pena tocar todavia

### 3. DualBeauty Content Engine

Para:
- reels
- guiones
- hooks
- carruseles
- campañas
- calendario de contenido

### 4. DualBeauty Offer Builder

Para:
- bundles
- promos
- lanzamientos
- upsells
- ofertas por temporada

### 5. DualBeauty Support System

Para:
- respuestas
- objeciones
- tiempos
- politicas
- seguimiento

### 6. DualBeauty Researcher

Para investigar:
- competidores
- packaging
- pricing
- tendencias de beauty
- ofertas
- herramientas

---

## Estructura recomendada del proyecto

Si el proyecto se crea en repo nuevo, usar algo asi:

```txt
dual-beauty/
  AGENTS.md
  CODEX_HANDOFF.md
  README.md
  docs/
    brand.md
    offers.md
    funnels.md
    automations.md
    integrations.md
  src/
  api/
```

---

## Archivos base recomendados

### `AGENTS.md`
Guia operativa activa del proyecto.

### `CODEX_HANDOFF.md`
Estado real del proyecto al cerrar cada sesion.

### `docs/brand.md`
Definicion de marca:
- tono
- publico
- promesa
- objeciones
- posicionamiento

### `docs/funnels.md`
Como convierte:
- trafico
- pagina
- CTA
- checkout
- post compra

### `docs/automations.md`
Flujos:
- bienvenida
- abandono
- recordatorios
- seguimiento
- recompra

---

## Arquitectura sugerida segun escenario

### Si es tienda de productos

Base sugerida:
- Shopify o headless simple
- panel interno solo si hace falta
- email transaccional bien definido
- analytics desde el dia 1

### Si es beauty con servicios/reservas

Base sugerida:
- landing + sistema de citas
- WhatsApp y agenda integrados
- CRM liviano
- automatizaciones de recordatorio

### Si es mixto

Separar claramente:
- producto
- servicio
- educacion de marca
- seguimiento del cliente

---

## Sistema minimo que deberia existir

El agente debe empujar primero a un MVP serio, no a un sistema inflado.

MVP recomendado:

1. Home clara
2. Oferta principal clara
3. CTA visible
4. Captura de leads o ventas
5. Medicion
6. Correos base
7. Soporte de confianza

---

## Lo que no conviene hacer al inicio

- no sobrecargar diseño
- no meter demasiadas apps
- no construir paneles complejos sin necesidad
- no crear automatizaciones sin definir antes el funnel
- no copiar `PAVOA` por inercia

---

## Forma de trabajar recomendada para el agente

1. Primero diagnosticar
2. Luego proponer
3. Luego construir por capas
4. Validar cada capa
5. Dejar handoff claro

---

## Prompt corto para arrancar otro agente

Usa algo como esto:

```txt
Lee DUAL_BEAUTY_KICKOFF.md y luego ayúdame a diseñar Dual Beauty desde cero.
No mezcles este proyecto con PAVOA.
Quiero empezar por estructura, conversion, stack recomendado y sistema base.
```

---

## Resultado esperado

Cuando este proyecto avance bien, debe terminar con:

- marca consistente
- sistema liviano
- conversion clara
- automatizaciones utiles
- buen handoff entre sesiones
- crecimiento ordenado

