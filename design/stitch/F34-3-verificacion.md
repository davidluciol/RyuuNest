# F34.3 — Menores y verificación (web y nativo)

Fecha: 2026-11-06 · Rama: `feature/F34-3-minor-verification` · Verificado: `apps/web` (build con `vite preview`) y la app móvil exportada a web (Expo) más Metro para la galería.

> La parte **nativa** se verificó el 2026-11-06 en el **Galaxy S25 Ultra** (SM-S938B, 384 dp, Expo Go + agent-device); ver la sección «Verificación nativa». Lo que no se pudo cubrir queda anotado ahí.

## Qué se midió y cómo

| Comprobación | E2e | Resultado |
|---|---|---|
| Anillo de foco 2 px `accent`, separación 2 px, al tabular (6 rutas × 1440/426 px) | `apps/web/tests/e2e/focusAndScale.cjs` | Todos los controles cumplen (web ya tenía `:focus-visible` global). |
| Texto al 200 % (viewport a la mitad: 720/213 px): sin desborde horizontal ni texto recortado | `focusAndScale.cjs` | Falló en `/` a 213 px: la 5.ª pestaña se salía 41 px. **Corregido** (`shell.css`: `min-width: 0` + `overflow-wrap`). |
| `prefers-reduced-motion`: ninguna animación ni transición con duración | `focusAndScale.cjs` | Falló: el interruptor seguía con transición porque `*` (especificidad 0) pierde ante `.clase`. **Corregido** (`!important` en la regla global). |
| Degradado de chips: solo en el borde con contenido oculto, no intercepta toques; anillo de foco del `Chip` | `apps/mobile/tests/e2e/chipScroller.cjs` | OK en galería @426 (inicio/mitad/final) y Biblioteca @273 (3 filas). |
| Regresión | `shell`, `settings`, `sources`, `f28Screens` (web); `library`, `shell`, `sources`, `settings`, `diagnostics`, `series`, `home`, `discover`, `typography`, `gallery-shell`, `confirmSheet`, `toast`, `errorNotices`, `backup`, `onboarding` (móvil) | Todos en verde. |

Equivalencia del 200 %: el zoom del navegador al 200 % reduce a la mitad los píxeles CSS disponibles; por eso se reproduce con el viewport a la mitad. No cubre el «tamaño de fuente del sistema» de Android (🧍).

## Defectos de 273 px (corregidos en esta tarea)

| Defecto | Causa | Arreglo | Prueba |
|---|---|---|---|
| Títulos de tarjetas de Biblioteca con «…» (T7) | `numColumns={3}` fijo: la tarjeta medía ~72 px | `libraryColumnsFor`: 3 columnas solo si la tarjeta conserva 96 px (`LIBRARY_CARD_MIN_WIDTH`, provisional); si no, 2 | `libraryColumns.test.ts` + `narrow273.cjs` |
| Etiquetas de la barra inferior de móvil solapadas | Pestañas de ancho igual con `minWidth` 48 y 4 px de relleno por lado: 268 px no caben en 265 | Ancho por contenido (`flexBasis: auto`) y sin relleno horizontal | `narrow273.cjs` |

A 273 px la barra queda justa (1–2 px entre etiquetas): es el límite físico de cinco etiquetas de 12 px; ningún teléfono real es tan estrecho.

## Verificación nativa (S25 Ultra, Expo Go 57.0.9, agent-device)

| Comprobación | Resultado |
|---|---|
| La app abre y navega (Inicio, Biblioteca, Fuentes, Ajustes, Diagnóstico) | OK, sin errores. |
| Degradado de chips (Fuentes): `chip-fade-end` al inicio; tras desplazar con el dedo solo `chip-fade-start`; pulsar un chip bajo el degradado lo selecciona | OK (`nativo-chips-fuentes.png`, `nativo-chips-fuentes-final.png`). |
| Foco con teclado (`adb input keyevent TAB`) | OK: «Continuar cap. 41» dibuja el anillo esmeralda de 2 px con separación (`nativo-foco-tab.png`). |
| Zona segura de Diagnóstico (barra de estado y muesca) | OK: el encabezado queda bajo la barra de estado (`nativo-diagnostico-200.png`). |
| Texto del sistema al 200 % (`font_scale 2.0`) en Ajustes, Diagnóstico y Fuentes | Falló en 4 puntos; corregidos y re-verificados (abajo). `font_scale` restaurado a 1.0. |

Defectos que cazó el 200 % del sistema:

1. Título del encabezado compartido cortado (`headerStyle` fija `height: 64`) → `height: "auto"` en `Header`.
2. Etiquetas de la barra partidas a mitad de palabra → `maxFontSizeMultiplier` = `NAV_LABEL_MAX_FONT_SCALE` (1,3, provisional).
3. URL del repositorio con «…» (`numberOfLines={2}`) → sin tope.
4. Mensaje del estado vacío recortado con «…» (`numberOfLines={3}`) → sin tope.

Guarda: `fontScale.test.ts`. Capturas tras el arreglo: `nativo-fuentes-200.png`, `nativo-diagnostico-200.png`.

### No cubierto (declarado)

- **Biblioteca nativa está vacía** (base real sin datos): el degradado de sus tres filas solo se vio en web; el componente es el mismo que en Fuentes.
- **Inicio al 200 %** sigue con recortes (título «Continuar la…», botón «Continuar cap. 41» cortado, insignias): no está entre las pantallas del todo (Ajustes, Diagnóstico, Fuentes). Queda como tarea nueva.
- Ficha, lector y primer uso con zona segura/200 %: no se recorrieron en el teléfono.
- `prefers-reduced-motion` nativo: no se probó (solo web).
- Fuentes muestra «0 instalados · 0 disponibles» con «Módulos: 3»: es la deuda urgente ya anotada (P-131), no de F34.3.

## Hallazgos nuevos

1. **Accesibilidad (arreglado):** el `Switch` propio de F34.2 exponía `role="switch"` sin `aria-checked` en web (`react-native-web` no traduce `accessibilityState.checked` ahí). Ahora lleva `aria-checked` y `aria-disabled`. `settings.cjs` estaba desfasado desde F34.2 (esperaba un `input` nativo) y se adaptó.
2. **Contenedores tragatoques:** los `Pressable` vacíos de `ConfirmSheet`, `ErrorDialog`, `ModulePicker`, `SheetModal` y el lienzo del lector llevan `focusable={false}` para no pintar un anillo alrededor del diálogo o de la pantalla.
3. **Corregido en esta tarea:** a 273 px los títulos de las tarjetas de Biblioteca acababan en «…» y las etiquetas de la barra inferior se tocaban (ver «Defectos de 273 px»).

## Lista de 20 segundos (`DESIGN_RULES.md` §6) — pantallas tocadas: Biblioteca, Fuentes, barra de pestañas web, Ajustes (interruptor), galería

- [x] ¿Algún texto depende del tema para entenderse? No: el degradado y el anillo no añaden texto.
- [x] ¿Las cifras cuadran con las demás pantallas? No se tocaron cifras.
- [x] ¿Hay algún hexadecimal o tamaño escrito a mano? No: el degradado sale de `withAlpha(bg)` y el ancho de `spacing.xl`; el anillo de `spacing.xxs / 2`. Lint de diseño en verde.
- [x] ¿Algún título o dato importante termina en «…»? Ya no: corregido en tarjetas de Biblioteca (273 px), URL del repositorio y mensaje del estado vacío (200 %).
- [x] ¿Aparece algo de la sección 4? No.
- [x] ¿Hay una tarjeta-mascota o un aviso de relleno? No.
- [x] ¿Las portadas llevan texto o son obras reales? No se tocaron.
- [x] ¿La barra inferior y la cabecera son las de las demás pantallas? Sí; cambió el reparto del ancho (web y móvil) y el tope de escala de las etiquetas, no su contenido.
- [x] ¿Hay más de un botón primario? No.
- [x] ¿Una función se anuncia con una promesa que la v1 no cumple? No.
