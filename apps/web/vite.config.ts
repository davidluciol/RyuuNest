import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// Se importan por ruta relativa (no por nombre de paquete): el config lo empaqueta
// esbuild con resolución Node y el `dist` de ui-tokens usa imports sin extensión.
import * as uiTokens from "../../packages/ui-tokens/src/index";
import { emitTokensCss } from "./src/tokens/emitTokensCss";
import type { TokensSnapshot } from "./src/tokens/tokensSnapshot";

/** Alias a las fuentes del workspace (patrón P-51): no hace falta compilar paquetes antes. */
function srcAlias(name: string): string {
  return fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));
}

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

/**
 * F24 — el CSS de tokens se genera en vivo desde `@ryuunest/ui-tokens`
 * (`emitTokensCss`): ningún hexadecimal ni medida queda fuera del paquete de
 * tokens (AC-13). El módulo es virtual: no hay archivo generado que desactualizar.
 */
const TOKENS_CSS_ID = "virtual:ryuunest-tokens.css";

function tokensCssPlugin(): Plugin {
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

export default defineConfig({
  // Absoluto: con "./" las rutas profundas (/reader/…) resolverían los assets
  // relativo a la URL y 404. Se sirve por HTTP (preview/PWA), no por file://.
  base: "/",
  plugins: [react(), tokensCssPlugin()],
  resolve: {
    alias: {
      // Lógica pura de pantallas compartida con apps/mobile (sin react-native;
      // la puerta tests/mobileSharedImports.test.ts lo vigila).
      "@ryuunest/mobile-src": fileURLToPath(new URL("../mobile/src", import.meta.url)),
      "@ryuunest/core": srcAlias("core"),
      "@ryuunest/i18n": srcAlias("i18n"),
      "@ryuunest/module-sdk": srcAlias("module-sdk"),
      "@ryuunest/test-site": srcAlias("test-site"),
      "@ryuunest/ui-tokens": srcAlias("ui-tokens"),
    },
  },
  build: { outDir: "dist", sourcemap: true },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
