# Marcadores temporales (`assets/placeholder/`)

> **TEMPORAL.** Todo lo que hay en esta carpeta es un **marcador provisional**
> (SPEC §12): se sustituirá por arte final o se confirmará su licencia antes de
> la v1.0 pública. Ninguna pantalla depende del arte final. Los marcadores no se
> enlazan por URL: van empaquetados aquí y se registran en `ASSETS.md`.

## `dragon.svg` — dragón marcador (estados vacíos, error y carga)

| Campo | Valor |
|---|---|
| Estado | **TEMPORAL — marcador** |
| Herramienta | Dibujado a mano como SVG (silueta vectorial original, sin IA ni obras de terceros) |
| Fecha | 2026-10-20 |
| Indicaciones | «Silueta sencilla de dragón serpenteante de perfil, con asta, hocico, ala y aleta de cola; monocroma con `currentColor`, sin texto, en una retícula de 96×96» (SPEC §11.12: marcador simple) |
| Licencia | Original del proyecto RyuuNest (GPL-3.0), sin personajes ni estilos de obras protegidas |
| Reemplazo | Subtarea independiente en `tasks/todo.md` («Arte final del dragón»): un artista hará el arte definitivo |

La versión renderizable en la app es `src/components/DragonMarker.tsx`
(`react-native-svg`), que reproduce esta misma silueta con colores del tema
(`ui-tokens`). Este fichero es el registro del marcador (SPEC §12).

## Reglas de esta carpeta (SPEC §12)

1. Solo viven aquí los marcadores; nada enlaza recursos remotos (RNF-5).
2. Cada fichero lleva registro en este README: herramienta, fecha, indicaciones y marca **TEMPORAL**.
3. Sin portadas con obras reales ni texto (D2 y D3 de `DESIGN_RULES.md`).
4. Antes de la v1.0 pública: reemplazar o confirmar licencia.
