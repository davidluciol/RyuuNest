# Marcadores temporales (`assets/placeholder/`)

> **TEMPORAL.** Todo lo que hay en esta carpeta es un **marcador provisional**
> (SPEC §12): se sustituirá por arte final o se confirmará su licencia antes de
> la v1.0 pública. Ninguna pantalla depende del arte final. Los marcadores no se
> enlazan por URL: van empaquetados aquí y se registran en `docs/ASSETS.md`.

## `dragon.svg` — portada de ejemplo (fixtures de ficha y lector)

| Campo | Valor |
|---|---|
| Estado | **Arte final** (ya no es marcador): copia de `design/RyuuNest-Logo-Pack-Con-Pupila/ryuunest-dragon-night.svg` |
| Fecha | 2026-11-27 (sustituye al marcador dibujado a mano del 2026-10-20) |
| Licencia | Logo de RyuuNest, arte de **Artista** (David Lucio), CC BY-NC-ND 4.0 (`LICENSE-ART.md`) |
| Uso | Solo como portada de ejemplo en `seriesFixtures.ts` y `readingSource.ts` |

El dragón de la interfaz (cabecera, bienvenida y estados) lo dibuja
`src/components/DragonMarker.tsx` con el trazo de `src/components/dragonPath.ts` y
los colores del tema (`ui-tokens`).

## `page-1.svg`, `page-2.svg`, `page-3.svg` — páginas de ejemplo del lector (F18)

| Campo | Valor |
|---|---|
| Estado | **TEMPORAL — marcador** |
| Herramienta | Dibujados a mano como SVG (formas geométricas originales, sin IA ni obras de terceros) |
| Fecha | 2026-10-28 |
| Indicaciones | «Página vertical 900×1400 con viñetas abstractas (rectángulos, triángulos y círculos) en los colores del tema; sin letras ni rótulos (D3), sin personajes» |
| Licencia | Original del proyecto RyuuNest (GPL-3.0) |
| Uso | Solo la web y Playwright: sustituyen a las imágenes del sitio falso (`sitio-html.test`) para que el lector se pruebe sin pedir nada a un dominio externo (RNF-5). El dispositivo siempre lee las imágenes de su módulo |

## Reglas de esta carpeta (SPEC §12)

1. Solo viven aquí los marcadores; nada enlaza recursos remotos (RNF-5).
2. Cada fichero lleva registro en este README: herramienta, fecha, indicaciones y marca **TEMPORAL**.
3. Sin portadas con obras reales ni texto (D2 y D3 de `docs/DESIGN_RULES.md`).
4. Antes de la v1.0 pública: reemplazar o confirmar licencia.
