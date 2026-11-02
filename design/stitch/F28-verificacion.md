# F28 — Verificación por pantalla (AC-12, parte web/Playwright)

Fecha: 2026-11-02 · Rama: `feature/F28-visual-verification` · Cliente verificado: `apps/web` (build servida con `vite preview`).

> AC-12 pide comparar cada pantalla de la v1 con su `screen.png` **en el POCO F5 Pro**.
> Playwright no controla la app nativa (AGENTS.md §5): esta tarea cierra la parte
> **web** — cada pantalla del cliente web verificada con Playwright a su ancho de
> referencia (el del `screen.png`) y a 1440/1600 px en escritorio, con las
> comprobaciones automáticas de `AGENTS.md` §5 en verde y las capturas comparadas a
> mano contra el diseño. La parte del POCO F5 Pro / MiBox 4 queda **🧍 pendiente del
> humano** y AC-12 no se cierra todavía (Checkpoint P-E sigue abierto).

## Cómo se ejecutó

- E2e nuevo: `apps/web/tests/e2e/f28Screens.cjs` (34 capturas en `docs/capturasF28/`).
  Ejecutar con la build servida:
  `WEB_URL=http://localhost:4173 PLAYWRIGHT_MODULE=<playwright global> node apps/web/tests/e2e/f28Screens.cjs`
- Datos reales (P-113) sobre el módulo demo `script` servido por intercepción
  (`repo.test` + `sitio.test`, doble de la extensión `fakeExtension.cjs`). La biblioteca
  se puebla por la **ruta real de importación de respaldo** (ver hallazgo abajo).
  Un segundo contexto limpio captura los estados vacíos.
- Navegación solo client-side tras la carga inicial: `page.goto` recarga la SPA y el
  volcado diferido de sql.js a IndexedDB (`beforeunload`) puede no completarse.
- Cada captura va precedida de las comprobaciones automáticas sobre el estado actual.
- La comparación con cada `screen.png` es visual (agente con visión): el diff de
  píxeles no sirve porque los datos de ejemplo son otros (AGENTS.md §5.5).

## Comprobaciones automáticas de AGENTS.md §5 — todas en verde en las 34 capturas

| Comprobación | Resultado |
|---|---|
| Sin desbordamiento horizontal | ✅ 0 px en todos los anchos (incl. lector a 273 px, tras el arreglo de abajo) |
| Sin títulos/datos cortados con «…» | ✅ tras 3 correcciones CSS (ver «rojo→verde») |
| Áreas interactivas ≥ 48×48 | ✅ todos los `button/a/input/[role=button]` visibles |
| Colores calculados dentro de los 13 tokens | ✅ salvo el velo del diálogo `rgba(0,0,0,0.6)` (scrim, no es token) y controles ocultos (`opacity: 0`, `head`) |
| Tinta oscura (`bg`) sobre `accent`/`progress` | ✅ en todos los elementos con texto |
| Manrope e Inter desde archivos locales | ✅ `document.fonts` con estado `loaded`, `@font-face` de `/fonts` |
| Foco visible con teclado | ✅ `outline: 2px solid accent` al recorrer con Tab |
| Sin errores de consola/página | ✅ salvo el `ERR_FAILED` deliberado del caso de banner de error |
| Cero peticiones a dominios externos | ✅ solo `localhost`, `repo.test`/`sitio.test` interceptados y el repo oficial `raw.githubusercontent.com` (igual que e2e previos) |

## Rojo → verde durante F28 (los chequeos en rojo cazaron 4 cosas)

1. **Fuentes**: la URL del repo se recortaba con «…» (`.sources-row-meta` con
   `text-overflow: ellipsis`) → ahora `overflow-wrap: anywhere` (T7).
2. **Diagnóstico**: el mensaje del evento se recortaba con «…» (`.diag-message`) →
   ahora envuelve completo (T7).
3. **Toast**: el aviso se recortaba con «…» (`.toast-message`; ya anotado en F26 para
   F34) → ahora envuelve completo; la corrección de F34 se adelanta (T7).
4. **Lector a 273 px** (ancho del `screen.png`): la barra superior desbordaba 48 px →
   `.reader-topbar` con `flex-wrap: wrap`; a anchos estrechos los controles envuelven a
   una segunda fila en vez de desbordar.

## Pantallas comparadas contra su `screen.png`

| Pantalla web | Diseño | Capturas (ancho de referencia + escritorio) | Resultado |
|---|---|---|---|
| Inicio | `inicio_guarida` (426) | `home-426/1440.png` | ✅ estructura, tokens y tipografía; diferencias ya anotadas (F13) + sección Carpetas ausente en web (hallazgo) |
| Biblioteca | `biblioteca_tesoros` (556) | `library-556/1440.png` | ✅ cuadrícula, chips, barra de progreso ámbar; sin vista lista/menú ⋮ (F14, v1) |
| Descubrir | `descubrir_aventuras` (377) | `discover-377/1440.png` | ✅ secciones, paginador, chip de módulo activo; filas sin portada (diferencia anotada) |
| Fuentes | `fuentes_portales` (390) | `sources-390/1440.png` | ✅ repos con URL completa (tras fix 1), chips con contadores, instalar/gestionar; sin ACTIVO/«Seguridad del Nido»/importar fuentes (F16, v1) |
| Ajustes | `ajustes_pantalla` (268) | `settings-268/1440/1600.png` | ✅ secciones v1 como tarjetas; sin OLED/tamaños inventados (F20, RF-44) |
| Ficha | `detalle_pantalla` (390) | `series-390/1440.png` | ✅ título, metadatos, favorito, releases, capítulos con estados; dentro del shell en web (diferencia anotada) |
| Lector | `pantalla_lector` (273) | `reader-273/1440.png` | ✅ columna centrada a 720 px en escritorio; topbar envuelve a 2 filas a 273 px (fix 4, diferencia aceptada); sin barra inferior (solo indicador) |
| Estados vacíos | `estados_vacios_dragon_night` (1500×800) | `empty-home/library/discover-426/1500.png` | ✅ EmptyState con marcador, título, mensaje y acción primaria |
| Banner de error | `banner_inline_de_error_y_toast_dragon_night` (1600×1280) | `error-banner-426/1600.png` | ✅ banner inline en el lector con Reintentar/Volver (P-109); en Fuentes/Descubrir el error inicial es ErrorState a pantalla completa |
| Toast | (mismo diseño) | `toast-426/1600.png` | ✅ toast con borde de severidad, mensaje completo (tras fix 3) y cerrar |
| Diálogo bloqueante | `di_logo_de_error_bloqueante_dragon_night` (1600×1280) | `dialog-replace-426/1600.png` | ✅ diálogo centrado con velo, título, mensaje, Cancelar + acción destructiva (reemplazar respaldo, P-97) |
| Diagnóstico (lista) | `ajustes_diagnostico_dragon_night` (1600×1280) | `diagnostics-list-426/1600.png` | ✅ chips de formato, exportar/copiar/borrar, eventos con nivel + código + mensaje completo (tras fix 2) |
| Diagnóstico (vacío) | `diagnostico_vacio_dragon_night` (1600×1280) | `diagnostics-empty-426/1600.png`, `empty-diagnostics-1600.png` | ✅ EmptyState con acción «Volver a Ajustes» |
| Diagnóstico (confirmar borrado) | `diagnostico_confirmar_borrado_dragon_night` (1600×1280) | `diagnostics-confirm-426/1600.png` | ✅ diálogo de confirmación con Cancelar/Borrar registro |
| Fila de diagnóstico en Ajustes | `ajustes_fila_diagnostico_dragon_night` (1600×1280) | `settings-1600.png` | ✅ fila con etiqueta, pista y chevron dentro de la tarjeta Diagnóstico |

Artefacto conocido: en las capturas `fullPage` la barra inferior fija aparece a mitad de
la imagen; no es un bug de layout (el chequeo de overflow da 0).

## Lista de 20 segundos (DESIGN_RULES.md §6) — pasada por pantalla

- ¿Texto dependiente del tema? ✅ no; Dragon Night único (P-29), todo legible en oscuro.
- ¿Cifras cuadran entre pantallas? ✅ contadores de Fuentes provienen del índice real;
  «1 instalados» **no pluraliza** (hallazgo, F34).
- ¿Hexadecimal o tamaño a mano? ✅ no; el chequeo de colores lo verifica en vivo.
- ¿Título/dato importante con «…»? ✅ no, tras los 3 fixes (T7).
- ¿Algo de la sección 4 (fuera de v1)? ✅ no: sin descargas, sync, noticias, perfiles,
  campana ni contador de no leídos.
- ¿Tarjeta-mascota o aviso de relleno? ✅ no.
- ¿Portadas con texto u obras reales? ✅ no; marcador local sin texto (D1–D5).
- ¿Cabecera y barra iguales en todas? ✅ sí (shell único, F11).
- ¿Más de un botón primario? ✅ no; uno por pantalla/diálogo (V3).
- ¿Promesa que la v1 no cumple? ✅ no.

## Hallazgos para tareas siguientes (no bloquean F28)

1. **Funcional (bloquea QAw1):** pulsar «Favorito» en la ficha **no crea la fila
   `series`** (`toggleFavorite` solo escribe `favorite`; la consulta de biblioteca hace
   `JOIN series`) → Biblioteca/Inicio quedan vacíos aunque haya favoritos. Nadie llama
   `SeriesStore.upsert` en el flujo de la app (web ni móvil). F28 sembró la biblioteca vía
   importación de respaldo para poder capturar. Pendiente de tarea propia con prueba en
   rojo.
2. Copy: «1 instalados · 4 disponibles» sin pluralizar; la búsqueda de Biblioteca usa la
   clave `series.search` («Buscar capítulo o título…») en vez de la de biblioteca
   («Buscar en tu biblioteca…»). Para F34.
3. Descubrir web muestra filas sin portada (el diseño, cuadrícula con portadas); Inicio
   web no tiene la sección Carpetas que sí tiene móvil (F13). Paridad web pendiente (F14).

## Estado de AC-12

- ✅ Parte web: Playwright por pantalla + capturas + chequeos automáticos en verde +
  diferencias en `DIFFS.md` + lista de 20 s pasada.
- 🧍 Pendiente del humano: mismas pantallas en el **POCO F5 Pro** y **MiBox 4**
  comparadas con los `screen.png` (apéndice B del SPEC). AC-12 y el Checkpoint P-E
  **no se cierran** hasta eso.
