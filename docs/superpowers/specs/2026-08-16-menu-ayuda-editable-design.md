# Menú de Ayuda editable desde PAVOA Control

Fecha: 2026-08-16
Repos afectados: `PAVOA` (storefront) y `pavoa-control` (app embebida)

## Problema

El panel del menú `AYUDA` del header está hardcodeado en
`src/sections/header/AyudaMenu.jsx`: los títulos de columna, los sub-títulos, los
seis enlaces y la frase de soporte son constantes del archivo. La imagen es peor
que fija — es una URL de Unsplash (`AYUDA_IMAGE`, línea 4), o sea una foto de
banco servida desde un dominio de terceros.

Cualquier cambio de texto o de imagen ahí requiere un desarrollador y un deploy,
mientras que el resto del contenido editorial del sitio ya se edita desde PAVOA
Control. El botón de WhatsApp de ese mismo panel ya lee `site_settings`, así que
el archivo ya sabe consumir configuración; nadie extendió el resto.

## Alcance

Editable desde PAVOA Control:

- Título y sub-título de cada una de las dos columnas
- Los enlaces de ambas columnas, con capacidad de agregar y borrar
- La imagen del bloque de soporte
- El eyebrow y las dos líneas de la frase de soporte

Fuera de alcance:

- El número de columnas. La rejilla del panel es `1fr 1px 1fr 1px 0.85fr` — dos
  columnas de enlaces, dos separadores dorados y la imagen. Hacer variable el
  número de columnas obliga a rediseñar esa rejilla, y eso es tocar el diseño.
- El botón de WhatsApp, que ya sale de `site_settings`.
- El menú de Catálogo, que ya tiene su editor.

## Decisión de almacenamiento

Un campo nuevo `ayuda_menu_config` en el metaobject `site_settings`, hermano de
`megamenu_config`. Se descartaron dos alternativas:

**Meterlo dentro de `megamenu_config`.** El action de `app.megamenu.jsx`
reescribe el campo completo (`megamenuConfig: JSON.stringify(parsedConfig)`), así
que guardar el menú de Catálogo borraría el de Ayuda salvo que ambas pantallas se
coordinen para preservar lo de la otra. Acoplamiento innecesario entre dos
pantallas que no tienen por qué conocerse.

**Un metaobject nuevo `ayuda_menu`.** Aísla más, pero exige definición nueva en
Shopify y un archivo `.server.js` propio sin comprar nada que el campo hermano no
dé ya.

`SITE_SETTINGS_FIELDS` en `site-settings.server.js` mapea llaves de Shopify a
llaves locales, y los helpers crean el campo faltante en la definición del
metaobject cuando la app tiene permisos. No hay que tocar Shopify a mano.

## Modelo de datos

```json
{
  "pedidos": {
    "titulo": "PEDIDOS",
    "subtitulo": "LOGÍSTICA",
    "enlaces": [
      { "label": "Envíos y entregas", "to": "/envios-y-entregas" },
      { "label": "Cambios y devoluciones", "to": "/cambios-y-devoluciones" },
      { "label": "Guía de tallas", "to": "/guia-de-tallas" }
    ]
  },
  "atencion": {
    "titulo": "ATENCIÓN",
    "subtitulo": "INFORMACIÓN",
    "enlaces": [
      { "label": "Preguntas frecuentes", "to": "/preguntas-frecuentes" },
      { "label": "Contacto", "to": "/contacto" },
      { "label": "Nosotros", "to": "/nosotros" }
    ]
  },
  "soporte": {
    "eyebrow": "SOPORTE",
    "lineaFina": "Siempre",
    "lineaFuerte": "aquí para ti.",
    "imagen": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80"
  }
}
```

Ese `imagen` es el default de arranque, no un valor vacío. Ver
"La imagen de Unsplash" más abajo.

Las claves `pedidos` y `atencion` son posicionales: columna izquierda y columna
derecha. Sus `titulo` y `subtitulo` son editables, así que el nombre de la clave
no se muestra en ninguna parte.

La frase va en dos campos porque el panel la pinta en dos pesos tipográficos
distintos (`lineaFina` en 300, `lineaFuerte` en 600). Un solo campo perdería ese
contraste, que es parte del diseño.

## PAVOA Control

Pantalla `app.ayuda-menu.jsx`, siguiendo el patrón que ya usan las demás:
un `<Form>` global, botón "Guardar" fijo al fondo, tarjetas blancas
(`border: #e5e7eb`, `borderRadius: 8px`), confirmación antes de borrar, bloque
"Dónde se ve" con link al storefront, y segunda persona en todos los textos.

Tres tarjetas:

1. **Columna izquierda** — título, sub-título y lista de enlaces
2. **Columna derecha** — lo mismo
3. **Bloque de soporte** — imagen con `ImageCropperField`, eyebrow y las dos
   líneas de la frase

Los enlaces se editan con el mismo mecanismo del megamenú: `_editorId` generado
en cliente para las keys de React, eliminado antes de persistir. Cada fila tiene
`label` y `to`.

La imagen se sube con `getOptionalImageFile` + `uploadImageFile` de
`shopify-files.server.js`, que devuelve una URL del CDN de Shopify.

Entrada nueva en el sidebar de `app.jsx`, dentro del grupo `Contenido del sitio`.

## Storefront

`AyudaMenu.jsx` pierde sus constantes `LINKS_PEDIDOS`, `LINKS_ATENCION` y
`AYUDA_IMAGE`, y recibe `ayudaMenuConfig` por props desde `Header.jsx`, igual que
`MegaMenu` recibe `megamenuConfig`.

Cadena de datos:

```
site_settings → useSiteSettings() → Header.jsx → <AyudaMenu ayudaMenuConfig={...} />
```

Los valores actuales del archivo pasan a ser los defaults en
`SITE_SETTINGS_DEFAULTS` de `productService.js`, de modo que el menú se ve
idéntico el día del deploy, antes de que nadie edite nada.

Una función `normalizeAyudaMenu(raw)` en `src/utils/ayudaMenu.js` garantiza la
forma del objeto antes de renderizar: rellena llaves faltantes con los defaults,
descarta enlaces sin `label` o sin `to`, y devuelve la estructura completa aunque
el JSON venga corrupto.

## Casos borde

| Caso | Comportamiento |
| --- | --- |
| Columna sin enlaces | Se oculta el contenido, no la celda. La rejilla `1fr 1px 1fr 1px 0.85fr` cuenta sus hijos por posición: omitir el `<div>` de una columna haría que el separador dorado ocupe su lugar y el panel se descuadre |
| Sin imagen | Queda el degradado y los textos, sin foto rota |
| JSON corrupto o ausente | `normalizeAyudaMenu` devuelve los defaults; el menú nunca se rompe |
| Enlace sin `label` o sin `to` | Se descarta al normalizar |

## La imagen de Unsplash

El default de `soporte.imagen` es la URL de Unsplash que hay hoy, para que el
panel no se vea incompleto entre el deploy y la primera carga de imagen. La
dependencia de Unsplash no desaparece con este cambio: desaparece cuando se suba
una imagen propia. En ese momento la constante se elimina del código.

## Pruebas

`normalizeAyudaMenu` se prueba con `npm test` en el storefront, sin red:

- JSON corrupto devuelve los defaults completos
- Llaves faltantes se rellenan sin perder las presentes
- Enlaces inválidos se descartan y los válidos sobreviven
- Una configuración completa pasa intacta

`npm run build` en ambos repos. La validación visual del panel queda del lado del
usuario: no hay `.env` local, así que el storefront no puede levantarse aquí.

## Orden de implementación

El storefront primero, con los defaults puestos: así queda funcionando igual que
hoy aunque el campo del metaobject todavía no exista. Después la pantalla de
PAVOA Control, que empieza a escribirlo.
