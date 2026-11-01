import type { Plugin } from "vite";

// Por ruta relativa (no por nombre de paquete): el `vite.config` que carga este
// módulo lo empaqueta esbuild con resolución Node y el `dist` de ui-tokens usa
// imports sin extensión.
import * as uiTokens from "../../../../packages/ui-tokens/src/index";
import { emitTokensCss } from "./emitTokensCss";
import type { TokensSnapshot } from "./tokensSnapshot";

/**
 * F24/F26 — el CSS de tokens se genera en vivo desde `@ryuunest/ui-tokens`
 * (`emitTokensCss`): ningún hexadecimal ni medida queda fuera del paquete de
 * tokens (AC-13). El módulo es virtual: no hay archivo generado que desactualizar.
 * Lo comparten `apps/web` y la página de opciones de `apps/extension`.
 */
export const TOKENS_CSS_ID = "virtual:ryuunest-tokens.css";

function snapshotFromPackage(mod: typeof uiTokens): TokensSnapshot {
  return {
    colors: mod.defaultTheme.colors,
    spacing: mod.spacing,
    radii: mod.radii,
    typography: mod.typography as TokensSnapshot["typography"],
    fontFiles: mod.fontFiles,
    railDesktop: mod.breakpoints.desktopRail,
    margins: mod.breakpoints.margin,
    touchMin: mod.touchTarget.min,
    readerMaxWidth: mod.readerMaxWidth,
    progressBarHeight: mod.progressBarHeight,
  };
}

export function tokensCssPlugin(): Plugin {
  return {
    name: "ryuunest-tokens-css",
    resolveId(source) {
      if (source === TOKENS_CSS_ID) return `\0${TOKENS_CSS_ID}`;
      return null;
    },
    load(id) {
      if (id === `\0${TOKENS_CSS_ID}`) return emitTokensCss(snapshotFromPackage(uiTokens));
      return null;
    },
  };
}
