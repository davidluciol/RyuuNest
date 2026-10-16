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

(por ahora nada registrado)
