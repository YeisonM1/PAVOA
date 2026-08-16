# Menú de Ayuda editable — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que los títulos, enlaces, imagen y frase del panel `AYUDA` del header se editen desde PAVOA Control, sin deploy.

**Architecture:** Un campo `ayuda_menu_config` (JSON) en el metaobject `site_settings`, hermano de `megamenu_config`. El storefront lo lee por la cadena que ya existe (`site_settings → useSiteSettings → Header → AyudaMenu`) y lo pasa por una función de normalización que garantiza la forma. PAVOA Control gana una pantalla que lo escribe, calcada del editor de megamenú.

**Tech Stack:** React 19 + Vite (storefront), React Router 7 + Shopify Admin API (pavoa-control), `node --test` para pruebas.

## Global Constraints

- No agregar dependencias nuevas en ningún repo.
- El diseño del panel no cambia: la rejilla `1fr 1px 1fr 1px 0.85fr` y sus dos columnas se mantienen.
- En pavoa-control, no importar módulos `*.server.js` fuera de `loader` y `action` (usar `await import(...)` dentro).
- Los textos de la UI de pavoa-control hablan en segunda persona.
- Validar con `npm run build` en el repo tocado antes de cada commit.
- Rutas: storefront en `D:\Proyectos\PAVOA`, panel en `D:\Proyectos\pavoa-control`.

---

### Task 1: Normalización y defaults del menú de Ayuda

Pieza pura, sin red. Es la única parte verificable localmente, así que va primero y con pruebas.

**Files:**
- Create: `D:\Proyectos\PAVOA\src\utils\ayudaMenu.js`
- Test: `D:\Proyectos\PAVOA\src\utils\ayudaMenu.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `AYUDA_MENU_DEFAULTS` — objeto con la forma completa `{ pedidos, atencion, soporte }`.
  - `normalizeAyudaMenu(raw: unknown) => { pedidos: Columna, atencion: Columna, soporte: Soporte }`
    donde `Columna = { titulo: string, subtitulo: string, enlaces: Array<{label: string, to: string}> }`
    y `Soporte = { eyebrow: string, lineaFina: string, lineaFuerte: string, imagen: string }`.

- [ ] **Step 1: Escribir la prueba que falla**

Crear `src/utils/ayudaMenu.test.js`:

```js
import assert from 'node:assert/strict';
import test from 'node:test';

import { AYUDA_MENU_DEFAULTS, normalizeAyudaMenu } from './ayudaMenu.js';

test('a missing or corrupt config falls back to the current menu', () => {
  assert.deepEqual(normalizeAyudaMenu(undefined), AYUDA_MENU_DEFAULTS);
  assert.deepEqual(normalizeAyudaMenu(null), AYUDA_MENU_DEFAULTS);
  assert.deepEqual(normalizeAyudaMenu('no soy un objeto'), AYUDA_MENU_DEFAULTS);
  assert.deepEqual(normalizeAyudaMenu([]), AYUDA_MENU_DEFAULTS);
});

test('present keys survive and missing ones are filled in', () => {
  const config = normalizeAyudaMenu({ pedidos: { titulo: 'ENVÍOS' } });

  assert.equal(config.pedidos.titulo, 'ENVÍOS');
  assert.equal(config.pedidos.subtitulo, AYUDA_MENU_DEFAULTS.pedidos.subtitulo);
  assert.deepEqual(config.pedidos.enlaces, AYUDA_MENU_DEFAULTS.pedidos.enlaces);
  assert.deepEqual(config.atencion, AYUDA_MENU_DEFAULTS.atencion);
});

test('an emptied column stays empty instead of coming back', () => {
  // Borrar todos los enlaces es una decisión, no un dato faltante: la columna
  // debe desaparecer del menú, no repoblarse con los de fábrica.
  const config = normalizeAyudaMenu({ pedidos: { enlaces: [] } });
  assert.deepEqual(config.pedidos.enlaces, []);

  // En cambio una clave ausente sí es un dato faltante.
  const sinClave = normalizeAyudaMenu({ pedidos: { titulo: 'X' } });
  assert.deepEqual(sinClave.pedidos.enlaces, AYUDA_MENU_DEFAULTS.pedidos.enlaces);
});

test('links without label or destination are dropped', () => {
  const config = normalizeAyudaMenu({
    atencion: {
      enlaces: [
        { label: 'Contacto', to: '/contacto' },
        { label: '   ', to: '/vacio' },
        { label: 'Sin destino', to: '' },
        { to: '/sin-label' },
        null,
      ],
    },
  });

  assert.deepEqual(config.atencion.enlaces, [{ label: 'Contacto', to: '/contacto' }]);
});

test('a cleared image stays cleared but an absent one uses the default', () => {
  assert.equal(normalizeAyudaMenu({ soporte: { imagen: '' } }).soporte.imagen, '');
  assert.equal(
    normalizeAyudaMenu({ soporte: { eyebrow: 'AYUDA' } }).soporte.imagen,
    AYUDA_MENU_DEFAULTS.soporte.imagen,
  );
});

test('a full config passes through untouched', () => {
  const completo = {
    pedidos: { titulo: 'A', subtitulo: 'B', enlaces: [{ label: 'L', to: '/l' }] },
    atencion: { titulo: 'C', subtitulo: 'D', enlaces: [{ label: 'M', to: '/m' }] },
    soporte: { eyebrow: 'E', lineaFina: 'F', lineaFuerte: 'G', imagen: 'https://cdn/x.jpg' },
  };

  assert.deepEqual(normalizeAyudaMenu(completo), completo);
});
```

- [ ] **Step 2: Correr la prueba y verificar que falla**

```bash
cd "D:/Proyectos/PAVOA" && node --test "src/utils/ayudaMenu.test.js"
```

Esperado: FAIL con `ERR_MODULE_NOT_FOUND` — `src/utils/ayudaMenu.js` no existe.

- [ ] **Step 3: Escribir la implementación mínima**

Crear `src/utils/ayudaMenu.js`:

```js
/**
 * El panel de AYUDA se edita desde PAVOA Control, así que su contenido llega
 * como JSON de Shopify y puede venir incompleto, corrupto o a medio migrar.
 * Todo lo que se renderiza pasa por aquí: el menú nunca debe romperse por un
 * dato mal formado, y lo que el usuario borró a propósito debe seguir borrado.
 */

export const AYUDA_MENU_DEFAULTS = {
  pedidos: {
    titulo: 'PEDIDOS',
    subtitulo: 'LOGÍSTICA',
    enlaces: [
      { label: 'Envíos y entregas', to: '/envios-y-entregas' },
      { label: 'Cambios y devoluciones', to: '/cambios-y-devoluciones' },
      { label: 'Guía de tallas', to: '/guia-de-tallas' },
    ],
  },
  atencion: {
    titulo: 'ATENCIÓN',
    subtitulo: 'INFORMACIÓN',
    enlaces: [
      { label: 'Preguntas frecuentes', to: '/preguntas-frecuentes' },
      { label: 'Contacto', to: '/contacto' },
      { label: 'Nosotros', to: '/nosotros' },
    ],
  },
  soporte: {
    eyebrow: 'SOPORTE',
    lineaFina: 'Siempre',
    lineaFuerte: 'aquí para ti.',
    imagen: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80',
  },
};

const texto = (valor, porDefecto) => {
  const limpio = String(valor ?? '').trim();
  return limpio || porDefecto;
};

// Un arreglo vacío es una decisión del usuario y se respeta. Que la clave no
// exista es otra cosa: ahí sí faltan datos y se usan los de fábrica.
const enlaces = (valor, porDefecto) => {
  if (!Array.isArray(valor)) return porDefecto;
  return valor
    .map((enlace) => ({
      label: String(enlace?.label ?? '').trim(),
      to: String(enlace?.to ?? '').trim(),
    }))
    .filter((enlace) => enlace.label && enlace.to);
};

const columna = (valor, porDefecto) => ({
  titulo: texto(valor?.titulo, porDefecto.titulo),
  subtitulo: texto(valor?.subtitulo, porDefecto.subtitulo),
  enlaces: enlaces(valor?.enlaces, porDefecto.enlaces),
});

export const normalizeAyudaMenu = (raw) => {
  const fuente = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const soporte = fuente.soporte;

  return {
    pedidos: columna(fuente.pedidos, AYUDA_MENU_DEFAULTS.pedidos),
    atencion: columna(fuente.atencion, AYUDA_MENU_DEFAULTS.atencion),
    soporte: {
      eyebrow: texto(soporte?.eyebrow, AYUDA_MENU_DEFAULTS.soporte.eyebrow),
      lineaFina: texto(soporte?.lineaFina, AYUDA_MENU_DEFAULTS.soporte.lineaFina),
      lineaFuerte: texto(soporte?.lineaFuerte, AYUDA_MENU_DEFAULTS.soporte.lineaFuerte),
      // Quitar la imagen es una decisión: el bloque queda con el degradado solo.
      imagen: soporte?.imagen === undefined
        ? AYUDA_MENU_DEFAULTS.soporte.imagen
        : String(soporte.imagen ?? '').trim(),
    },
  };
};
```

- [ ] **Step 4: Correr las pruebas y verificar que pasan**

```bash
cd "D:/Proyectos/PAVOA" && npm test
```

Esperado: PASS. El glob de `npm test` ya cubre `src/utils/*.test.js`, así que las 6 pruebas nuevas se suman al total existente.

- [ ] **Step 5: Commit**

```bash
cd "D:/Proyectos/PAVOA" && git add src/utils/ayudaMenu.js src/utils/ayudaMenu.test.js && git commit -m "Add the Ayuda menu config shape and its defaults"
```

---

### Task 2: El storefront consume la configuración

Con los defaults en su lugar, el menú se ve idéntico aunque el campo todavía no exista en Shopify.

**Files:**
- Modify: `D:\Proyectos\PAVOA\src\services\productService.js` (`SITE_SETTINGS_DEFAULTS`, y el bloque de parseo dentro de `getSiteSettings`)
- Modify: `D:\Proyectos\PAVOA\src\sections\Header.jsx:419` (zona donde se pasa `megamenuConfig`)
- Modify: `D:\Proyectos\PAVOA\src\sections\header\AyudaMenu.jsx`

**Interfaces:**
- Consumes: `AYUDA_MENU_DEFAULTS` y `normalizeAyudaMenu` de la Task 1.
- Produces: `settings.ayudaMenuConfig` con la forma normalizada, disponible para cualquier consumidor de `useSiteSettings()`.

- [ ] **Step 1: Agregar el default en productService**

En `src/services/productService.js`, importar al inicio del archivo junto a los demás imports:

```js
import { AYUDA_MENU_DEFAULTS, normalizeAyudaMenu } from '../utils/ayudaMenu.js';
```

Dentro de `SITE_SETTINGS_DEFAULTS`, agregar la clave justo después de `megamenuConfig`:

```js
  ayudaMenuConfig: AYUDA_MENU_DEFAULTS,
```

- [ ] **Step 2: Parsear el campo nuevo**

En `getSiteSettings`, después del bloque de `parsedCatalogHeaders` (termina cerca de la línea 1152) y antes del `return {`, agregar:

```js
      let parsedAyudaMenu = SITE_SETTINGS_DEFAULTS.ayudaMenuConfig;
      const rawAyudaMenu = get('ayuda_menu_config');
      if (rawAyudaMenu) {
        try {
          parsedAyudaMenu = normalizeAyudaMenu(JSON.parse(rawAyudaMenu));
        } catch (e) {
          console.error('Error parsing ayuda_menu_config:', e);
        }
      }
```

Y en el objeto que retorna, después de `megamenuConfig: parsedMegamenu,`:

```js
        ayudaMenuConfig: parsedAyudaMenu,
```

- [ ] **Step 3: Pasar la config desde el Header**

En `src/sections/Header.jsx`, donde se renderiza `<AyudaMenu ... />`, agregar la prop:

```jsx
ayudaMenuConfig={settings.ayudaMenuConfig}
```

Buscar el JSX de `AyudaMenu`; el de `MegaMenu` está en la línea 419 y sirve de referencia de estilo.

- [ ] **Step 4: Consumir la config en AyudaMenu**

En `src/sections/header/AyudaMenu.jsx`:

1. Borrar las constantes `AYUDA_IMAGE`, `LINKS_PEDIDOS` y `LINKS_ATENCION` (líneas 4–16).
2. Agregar el import:

```js
import { normalizeAyudaMenu } from '../../utils/ayudaMenu.js';
```

3. Recibir la prop en la firma del componente, junto a las que ya tiene (`ayudaOpen`, `setAyudaOpen`, etc.):

```js
ayudaMenuConfig
```

4. Dentro del componente, antes del `return`:

```js
  const menu = normalizeAyudaMenu(ayudaMenuConfig);
```

5. Reemplazar el contenido de las columnas. La izquierda:

```jsx
          <div style={{ paddingRight: 48 }}>
            {menu.pedidos.enlaces.length > 0 && (
              <>
                <p style={sectionTitleStyle}>{menu.pedidos.titulo}</p>
                <p style={eyebrowStyle}>{menu.pedidos.subtitulo}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {menu.pedidos.enlaces.map(item => (
                    <AyudaLink key={item.to} item={item} setAyudaOpen={setAyudaOpen} />
                  ))}
                </ul>
              </>
            )}
          </div>
```

La derecha, igual pero con `menu.atencion` y `paddingLeft: 48, paddingRight: 48`.

**El `<div>` de la columna se renderiza siempre.** La rejilla del panel es
`1fr 1px 1fr 1px 0.85fr` y cuenta sus cinco hijos por posición: si se omite el
div de una columna, el separador dorado ocupa su lugar y todo el panel se
descuadra. Lo que desaparece es el contenido, no la celda.

6. En el bloque de soporte, reemplazar los valores fijos:
   - `url(${AYUDA_IMAGE})` → `url(${menu.soporte.imagen})`
   - `SOPORTE` → `{menu.soporte.eyebrow}`
   - `Siempre<br /><strong style={{ fontWeight: 600 }}>aquí para ti.</strong>` → `{menu.soporte.lineaFina}<br /><strong style={{ fontWeight: 600 }}>{menu.soporte.lineaFuerte}</strong>`

7. La capa de la imagen solo se pinta si hay imagen. Envolver ese `<div>` (el del `backgroundImage`) en:

```jsx
              {menu.soporte.imagen && (
                <div style={{ /* ...los mismos estilos que ya tenía... */ }} />
              )}
```

- [ ] **Step 5: Verificar**

```bash
cd "D:/Proyectos/PAVOA" && npm test && npx eslint src/utils/ayudaMenu.js src/services/productService.js src/sections/Header.jsx src/sections/header/AyudaMenu.jsx && npm run build
```

Esperado: pruebas en verde, ESLint sin salida (exit 0), build exitoso.

- [ ] **Step 6: Commit**

```bash
cd "D:/Proyectos/PAVOA" && git add src/services/productService.js src/sections/Header.jsx src/sections/header/AyudaMenu.jsx && git commit -m "Read the Ayuda menu from site settings"
```

---

### Task 3: El campo nuevo en site_settings

**Files:**
- Modify: `D:\Proyectos\pavoa-control\app\site-settings.server.js`

**Interfaces:**
- Consumes: nada del storefront — el JSON viaja como texto.
- Produces: `values.ayudaMenuConfig` (string JSON) en el retorno de `getSiteSettingsPageData`, y la capacidad de persistirlo vía `saveSiteSettings`.

- [ ] **Step 1: Registrar el campo**

En `app/site-settings.server.js`, agregar al final del arreglo `SITE_SETTINGS_FIELDS` (línea ~76):

```js
  ["ayuda_menu_config", "ayudaMenuConfig"],
```

- [ ] **Step 2: Declarar la definición del campo**

En el objeto de definiciones, después de la entrada `megamenuConfig` (línea ~124):

```js
  ayudaMenuConfig: {
    key: "ayuda_menu_config",
    name: "Ayuda menu config",
    type: "multi_line_text_field",
  },
```

Los helpers crean el campo en la definición del metaobject si no existe, así que no hay que tocar Shopify a mano.

- [ ] **Step 3: Agregar el valor por defecto**

En el objeto de defaults del inicio del archivo (donde está `megamenuConfig: JSON.stringify({...})`), agregar:

```js
  ayudaMenuConfig: JSON.stringify({
    pedidos: {
      titulo: "PEDIDOS",
      subtitulo: "LOGÍSTICA",
      enlaces: [
        { label: "Envíos y entregas", to: "/envios-y-entregas" },
        { label: "Cambios y devoluciones", to: "/cambios-y-devoluciones" },
        { label: "Guía de tallas", to: "/guia-de-tallas" },
      ],
    },
    atencion: {
      titulo: "ATENCIÓN",
      subtitulo: "INFORMACIÓN",
      enlaces: [
        { label: "Preguntas frecuentes", to: "/preguntas-frecuentes" },
        { label: "Contacto", to: "/contacto" },
        { label: "Nosotros", to: "/nosotros" },
      ],
    },
    soporte: {
      eyebrow: "SOPORTE",
      lineaFina: "Siempre",
      lineaFuerte: "aquí para ti.",
      imagen: "",
    },
  }),
```

`imagen` arranca vacío aquí a propósito: el default de Unsplash vive en el storefront (Task 1) y solo aplica mientras nadie haya guardado. En cuanto se guarde desde el panel, manda lo que diga este campo.

- [ ] **Step 4: Verificar**

```bash
cd "D:/Proyectos/pavoa-control" && npm run build
```

Esperado: build exitoso.

- [ ] **Step 5: Commit**

```bash
cd "D:/Proyectos/pavoa-control" && git add app/site-settings.server.js && git commit -m "Add the Ayuda menu field to site settings"
```

---

### Task 4: La pantalla del editor

**Files:**
- Create: `D:\Proyectos\pavoa-control\app\routes\app.ayuda-menu.jsx`
- Modify: `D:\Proyectos\pavoa-control\app\routes\app.jsx` (arreglo `navSections`, grupo `Contenido del sitio`)

**Interfaces:**
- Consumes: `getSiteSettingsPageData` y `saveSiteSettings` de `../site-settings.server`; `getOptionalImageFile` y `uploadImageFile` de `../shopify-files.server`; el componente `ImageCropperField` de `../components/ImageCropperField`.
- Produces: escribe `values.ayudaMenuConfig` como string JSON con la forma de la Task 1.

- [ ] **Step 1: Leer el editor de referencia completo**

Antes de escribir nada, leer `app/routes/app.megamenu.jsx` de principio a fin. Esta pantalla es su calco: mismo `loader`, mismo patrón de `action`, mismo manejo de `_editorId`, mismo modal de confirmación de borrado, mismos `cardStyle` e `inputStyle`.

- [ ] **Step 2: Escribir la ruta**

Crear `app/routes/app.ayuda-menu.jsx` replicando la estructura de `app.megamenu.jsx` con estas diferencias:

- El `loader` es idéntico: `getSiteSettingsPageData(admin)`.
- El `action` lee `formData.get("ayudaMenuConfig")`, lo parsea, sube la imagen si viene una (`getOptionalImageFile(formData, "imagen_soporte")` → `uploadImageFile({ admin, file, alt: "Menú de ayuda" })` → guardar `previewUrl` en `parsedConfig.soporte.imagen`), limpia los `_editorId` de `pedidos.enlaces` y `atencion.enlaces`, y guarda con `saveSiteSettings(admin, { ...currentData.values, ayudaMenuConfig: JSON.stringify(parsedConfig) })`.
- El estado inicial ante JSON inválido es la forma completa con arreglos vacíos:

```js
{ pedidos: { titulo: "", subtitulo: "", enlaces: [] },
  atencion: { titulo: "", subtitulo: "", enlaces: [] },
  soporte: { eyebrow: "", lineaFina: "", lineaFuerte: "", imagen: "" } }
```

- Tres tarjetas: **Columna izquierda**, **Columna derecha** y **Bloque de soporte**. Las dos primeras con campos de título y sub-título, más la lista de enlaces (`label` y `to`) con botón de agregar y borrado con confirmación. La tercera con `ImageCropperField` (name `imagen_soporte`) y los campos `eyebrow`, `lineaFina` y `lineaFuerte`.
- Bloque "Dónde se ve" apuntando a `https://pavoa.com.co` con la indicación de abrir el menú `AYUDA` del header.
- Todos los textos en segunda persona.

- [ ] **Step 3: Agregar la entrada al sidebar**

En `app/routes/app.jsx`, dentro de la sección `contenido` del arreglo `navSections`, agregar el item después del de `megamenu`:

```js
      {
        to: "/app/ayuda-menu",
        label: "Menú de ayuda",
        detail: "Edita los enlaces, la imagen y los textos del menú Ayuda.",
      },
```

- [ ] **Step 4: Verificar**

```bash
cd "D:/Proyectos/pavoa-control" && npm run build
```

Esperado: build exitoso. La verificación visual de la pantalla queda del lado del usuario, abriendo PAVOA Control tras el deploy.

- [ ] **Step 5: Commit**

```bash
cd "D:/Proyectos/pavoa-control" && git add app/routes/app.ayuda-menu.jsx app/routes/app.jsx && git commit -m "Add the Ayuda menu editor"
```

---

## Cierre

Después de la Task 4, push en ambos repos:

```bash
cd "D:/Proyectos/PAVOA" && git push origin main
cd "D:/Proyectos/pavoa-control" && git push origin main
```

Verificación del usuario, en orden:

1. Abrir la tienda: el menú `AYUDA` debe verse **idéntico a hoy** (los defaults hacen su trabajo).
2. Abrir PAVOA Control → `Contenido del sitio` → `Menú de ayuda`: la pantalla carga con los textos actuales.
3. Cambiar un texto, guardar, recargar la tienda: el cambio aparece.
4. Subir una imagen propia: reemplaza la de Unsplash.

Cuando el paso 4 esté hecho, la constante de Unsplash sale del código: quitar la URL de `AYUDA_MENU_DEFAULTS.soporte.imagen` en `src/utils/ayudaMenu.js` y dejarla en `''`.
