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

## Verificaciones diferidas

| Fecha | Tarea | Comprobación | Situación |
|---|---|---|---|
| 2026-10-16 | F03 | «Arrancar la galería» y «Playwright: cero peticiones a dominios externos» | **Diferida a F05/F28**: la galería de componentes (primer consumidor) llega en F05 (grafo P2.3). En F03 la puerta automática cubre el requisito estructural: fuentes locales con OFL, nombre embebido verificado, Lucide tras `src/icons.ts` único y cero URLs remotas en el cableado (`apps/mobile/tests/fonts.test.ts`, `icons.test.ts`). |
| 2026-10-17 | F04 | «Galería en 3 anchos (móvil, tablet, escritorio)» | **Cerrada en F05**: la galería compilada para web respondió con el layout correcto en los tres anchos (móvil 375 → margen 16 / separación 12; tablet 768 → 24 / 16; escritorio 1440 → 32 / 24), verificado con Playwright. |
