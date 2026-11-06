# F34.3 — Menores y verificación (parte web)

Fecha: 2026-11-06 · Rama: `feature/F34-3-minor-verification` · Verificado: `apps/web` (build con `vite preview`) y la app móvil exportada a web (Expo) más Metro para la galería.

> La parte **nativa** (S25 Ultra / POCO F5 Pro con agent-device) queda **🧍 pendiente**: foco con teclado/D-pad, degradado de chips con el dedo y texto al 200 % del sistema solo se pueden confirmar en el dispositivo.

## Qué se midió y cómo

| Comprobación | E2e | Resultado |
|---|---|---|
| Anillo de foco 2 px `accent`, separación 2 px, al tabular (6 rutas × 1440/426 px) | `apps/web/tests/e2e/focusAndScale.cjs` | Todos los controles cumplen (web ya tenía `:focus-visible` global). |
| Texto al 200 % (viewport a la mitad: 720/213 px): sin desborde horizontal ni texto recortado | `focusAndScale.cjs` | Falló en `/` a 213 px: la 5.ª pestaña se salía 41 px. **Corregido** (`shell.css`: `min-width: 0` + `overflow-wrap`). |
| `prefers-reduced-motion`: ninguna animación ni transición con duración | `focusAndScale.cjs` | Falló: el interruptor seguía con transición porque `*` (especificidad 0) pierde ante `.clase`. **Corregido** (`!important` en la regla global). |
| Degradado de chips: solo en el borde con contenido oculto, no intercepta toques; anillo de foco del `Chip` | `apps/mobile/tests/e2e/chipScroller.cjs` | OK en galería @426 (inicio/mitad/final) y Biblioteca @273 (3 filas). |
| Regresión | `shell`, `settings`, `sources`, `f28Screens` (web); `library`, `shell`, `sources`, `settings`, `diagnostics`, `series`, `home`, `discover`, `typography`, `gallery-shell`, `confirmSheet`, `toast`, `errorNotices`, `backup`, `onboarding` (móvil) | Todos en verde. |

Equivalencia del 200 %: el zoom del navegador al 200 % reduce a la mitad los píxeles CSS disponibles; por eso se reproduce con el viewport a la mitad. No cubre el «tamaño de fuente del sistema» de Android (🧍).

## Hallazgos nuevos

1. **Accesibilidad (arreglado):** el `Switch` propio de F34.2 exponía `role="switch"` sin `aria-checked` en web (`react-native-web` no traduce `accessibilityState.checked` ahí). Ahora lleva `aria-checked` y `aria-disabled`. `settings.cjs` estaba desfasado desde F34.2 (esperaba un `input` nativo) y se adaptó.
2. **Contenedores tragatoques:** los `Pressable` vacíos de `ConfirmSheet`, `ErrorDialog`, `ModulePicker`, `SheetModal` y el lienzo del lector llevan `focusable={false}` para no pintar un anillo alrededor del diálogo o de la pantalla.
3. **Sin arreglar (fuera de F34.3, a decidir):** a 273 px los títulos de las tarjetas de Biblioteca acaban en «…» (T7) y las etiquetas de la barra inferior de móvil se tocan (`docs/capturasF34/chips-biblioteca-273.png`).

## Lista de 20 segundos (`DESIGN_RULES.md` §6) — pantallas tocadas: Biblioteca, Fuentes, barra de pestañas web, Ajustes (interruptor), galería

- [x] ¿Algún texto depende del tema para entenderse? No: el degradado y el anillo no añaden texto.
- [x] ¿Las cifras cuadran con las demás pantallas? No se tocaron cifras.
- [x] ¿Hay algún hexadecimal o tamaño escrito a mano? No: el degradado sale de `withAlpha(bg)` y el ancho de `spacing.xl`; el anillo de `spacing.xxs / 2`. Lint de diseño en verde.
- [ ] ¿Algún título o dato importante termina en «…»? **Sí, preexistente** (hallazgo 3, tarjetas de Biblioteca a 273 px). Lo añadido por F34.3 no.
- [x] ¿Aparece algo de la sección 4? No.
- [x] ¿Hay una tarjeta-mascota o un aviso de relleno? No.
- [x] ¿Las portadas llevan texto o son obras reales? No se tocaron.
- [x] ¿La barra inferior y la cabecera son las de las demás pantallas? Sí; solo cambió el reparto del ancho en la web.
- [x] ¿Hay más de un botón primario? No.
- [x] ¿Una función se anuncia con una promesa que la v1 no cumple? No.
