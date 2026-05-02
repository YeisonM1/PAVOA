# CODEX Handoff (PAVOA)

Usa este archivo para retomar trabajo en una nueva sesión sin perder contexto.

## Cómo usarlo en una sesión nueva

1. Abre una sesión nueva.
2. Escribe: `Lee CODEX_HANDOFF.md y continuamos desde ahí`.
3. Si necesitas más detalle, pide además: `revisa los últimos commits en main`.

## Plantilla rápida de traspaso

Copia y actualiza estos 6 puntos:

1. Objetivo actual:
2. Estado actual:
3. Último cambio aplicado:
4. Archivos tocados:
5. Próximo paso exacto:
6. Riesgos / notas:

## Estado actual (última actualización)

1. Objetivo actual:
   Refinar UX de Home y cuenta de cliente.

2. Estado actual:
   - Se eliminó `Vista rápida` en catálogo.
   - Se creó `/nosotros` y páginas de ayuda del footer.
   - Se implementó menú desplegable de cuenta en header.
   - Se sincronizó `AnnouncementBar` con el slide activo del Hero.

3. Último cambio aplicado:
   `0131f2d` — Sync announcement messages with hero slide changes.

4. Archivos tocados recientemente:
   - `src/sections/AnnouncementBar.jsx`
   - `src/sections/HeroFullscreen.jsx`
   - `src/sections/Header.jsx`
   - `src/pages/AccountPage.jsx`

5. Próximo paso sugerido:
   Validar visualmente en Home que cada cambio de slide del Hero actualiza el texto del announcement al mismo tiempo.

6. Riesgos / notas:
   - No incluir `.claude/settings.local.json` en commits.
   - Mantener cambios de UI consistentes con el estilo actual (sin rediseño radical).
