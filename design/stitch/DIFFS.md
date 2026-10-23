# DIFFS.md — diferencias aceptadas entre el diseño de Stitch y la implementación

> Regla 5.6 de `AGENTS.md`: toda diferencia aceptada entre `screen.png`/`DESIGN.md` y lo
> implementado se registra aquí. El SPEC manda sobre el diseño (RF-44).

## Tokens (`packages/ui-tokens`, F01)

| Fecha | Token | Diseño / tabla | Implementado | Motivo |
|---|---|---|---|---|
| 2026-10-16 | `label-sm` | 11 / 14 px (SPEC §11.9) | 12 / 14 px | `DESIGN_RULES.md` V12: metadatos de 12 px como mínimo. El SPEC ya lo anticipa en §11.9 («se implementa a 12 px y no a 11 px»). El interlineado se mantiene en 14 px porque la regla solo sube el tamaño. |
| 2026-10-16 | radio de hoja/diálogo | «16 a 24» (SPEC §11.9, rango) | 16 px (`radii.sheet`) | Los `code.html` de Stitch usan `rounded-t-2xl` (16 px) en las esquinas superiores de hojas. |
| 2026-10-16 | colores genéricos | front-matter de `DESIGN.md` (`background`, `surface-dim`, `error: #ffb4ab`, `primary…`) | no se implementan | P2-1 / SPEC §11.9: se contradicen con los propios; solo vale la tabla de 13 tokens semánticos. |

## Pantallas

| Fecha | Pantalla | Diferencia | Motivo |
|---|---|---|---|
| 2026-10-16 | (F03, aún sin pantalla) | La galería de componentes y sus fuentes **no están cableadas**: la carga real de Manrope/Inter con `expo-font` (dependencia) llega con la galería (F05) y el shell (F11). F03 **empaqueta** los archivos y **prohíbe** por prueba el CDN y los emojis. | F05 depende de F03 (grafo P2.3), no al revés. **Resuelto en F05**: `expo-font` instalado y `src/gallery/fontSources.ts` mapea los 5 pesos desde el manifiesto. |
| 2026-10-20 | (F08, estados vacíos y de error) | **Sin diseño de Stitch**: no hay `screen.png` de referencia para estos estados (pregunta abierta 1 del SPEC §17.2). Se componen con `DESIGN.md`/`DESIGN_RULES.md` y los tokens; el dragón es una silueta original simplificada (no la ilustración de las capturas). | P-30: pantallas sin diseño se componen con los documentos de autoridad y quedan marcadas «sin diseño». El arte final llega con el artista (subtarea FA1). |
| 2026-10-22 | Shell compartido (F11) | Misma cabecera (logo local de F08, nombre y etiqueta funcional) y barra de Inicio/Biblioteca/Descubrir/Fuentes/Ajustes en los cinco destinos. Sin campana, perfil, saludo ni logotipo remoto roto; tokens Dragon Night, pesos de fuente locales explícitos y sin sombras. | SPEC §11.5, T1/T5/T7 y V1/V5/V11. P-65 permite adelantar solo los marcos: el contenido de los PNG **no se ha implementado** ni se da por comparado como pantalla completa. |
| 2026-10-22 | Alcance provisional de F11 | **Pendiente:** búsqueda global de cabecera (F15); no se dibuja un botón inerte. La previsualización web del cliente móvil mantiene la barra inferior incluso a 1440 px: no es el cliente `apps/web` ni su riel lateral (F24). | P-65: shell móvil y marcos, no pantallas completas ni cliente web. No se presenta como diferencia definitiva aprobada del producto. |
| 2026-10-23 | Inicio (F13) | Sin «Novedades de Portales» ni tarjeta de estado del nido; sin saludo «Tu pequeño dragón custodia 48 obras». 3 secciones (Continuar, Recientes, Carpetas) de las 4 máximas (V6). Títulos de series a 2 líneas sin «…» (T7); en el diseño aparecen truncados («Sombras de Arc…»). Iconos de carpetas monocromos `text-secondary` (V4); en el diseño la primera carpeta lleva icono en verde. Sin contador «Nuevo» en tarjetas recientes (RF-42, v2). | SPEC §11.5 (RF-44): lo fuera de la v1 se omite. V4/V6/T7/RF-42: un icono por significado, máximo 4 secciones, títulos sin «…», sin contador de no leídos en v1. Los datos de ejemplo son coherentes (D1): 24+14+10 = 48 obras en 3 carpetas. |
| 2026-10-23 | Biblioteca (F14a+F14b) | Sin vista de lista (solo cuadrícula); sin menú ⋮ por tarjeta (no se implementa en v1); chips de carpetas en horizontal bajo la sección «Carpetas» en vez de tarjetas grandes del diseño. Filtro de tipo/fuente como chips placeholder (la hoja de filtros llega con la conexión al núcleo); el orden cicla al pulsar el chip. Sin «Completado» (RF-42, v2). Títulos a 2 líneas sin «…» (T7). NSFW oculto por defecto (RF-35); el chip NSFW lo activa/desactiva. Barra de progreso de 3 px en portadas con avance (RF-41). Datos de ejemplo coherentes (D1): 12 series visibles de 48 totales, 3 carpetas (24+14+10=48), 2 fuentes, 1 serie NSFW. | SPEC §11.5 (RF-44): lo fuera de la v1 se omite. V1/V6/V7/T7: un botón primario, un solo acceso a carpetas, insignia neutra, títulos sin «…». RF-26 a RF-30, RF-35. La cuadrícula usa `FlatList` con `numColumns={3}` (virtualizada). Filtros y orden son lógica de presentación sobre fixtures; la conexión real con el núcleo (T22/T23) llega en una tarea posterior. |

## Verificaciones diferidas

| Fecha | Tarea | Comprobación | Situación |
|---|---|---|---|
| 2026-10-16 | F03 | «Arrancar la galería» y «Playwright: cero peticiones a dominios externos» | **Diferida a F05/F28**: la galería de componentes (primer consumidor) llega en F05 (grafo P2.3). En F03 la puerta automática cubre el requisito estructural: fuentes locales con OFL, nombre embebido verificado, Lucide tras `src/icons.ts` único y cero URLs remotas en el cableado (`apps/mobile/tests/fonts.test.ts`, `icons.test.ts`). |
| 2026-10-17 | F04 | «Galería en 3 anchos (móvil, tablet, escritorio)» | **Cerrada en F05**: la galería compilada para web respondió con el layout correcto en los tres anchos (móvil 375 → margen 16 / separación 12; tablet 768 → 24 / 16; escritorio 1440 → 32 / 24), verificado con Playwright. |
| 2026-10-22 | F11 | Captura y navegación en POCO F5 Pro (AC-12) | **Pendiente del dispositivo.** Exportar el bundle Android y verificar web con Playwright no verifica la app nativa. P-A/T35 tampoco se cierran al adelantar F11. |
