import {
  breakpoints,
  defaultTheme,
  fontFiles,
  progressBarHeight,
  radii,
  readerMaxWidth,
  spacing,
  touchTarget,
  typography,
  type TypeStyle,
} from "@ryuunest/ui-tokens";

import type { TokensSnapshot } from "./tokensSnapshot";

/**
 * F24 — construye la foto de tokens para el emisor de CSS desde
 * `@ryuunest/ui-tokens`. En la app Vite resuelve ese paquete a las fuentes del
 * workspace (alias de `vite.config.ts`); en `vite.config.ts` el plugin usa el
 * mismo módulo por ruta relativa.
 */
export function uiTokensSnapshot(): TokensSnapshot {
  return {
    colors: defaultTheme.colors,
    spacing,
    radii,
    typography: typography as Record<string, TypeStyle>,
    fontFiles,
    railDesktop: breakpoints.desktopRail,
    margins: breakpoints.margin,
    touchMin: touchTarget.min,
    readerMaxWidth,
    progressBarHeight,
  };
}
