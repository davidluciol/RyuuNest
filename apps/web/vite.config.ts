import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { tokensCssPlugin } from "./src/tokens/tokensCssPlugin";

/** Alias a las fuentes del workspace (patrón P-51): no hace falta compilar paquetes antes. */
function srcAlias(name: string): string {
  return fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));
}

export default defineConfig({
  // Absoluto: con "./" las rutas profundas (/reader/…) resolverían los assets
  // relativo a la URL y 404. Se sirve por HTTP (preview/PWA), no por file://.
  base: "/",
  // El CSS de tokens se genera en vivo desde ui-tokens (módulo virtual compartido
  // con la página de opciones de la extensión, F26).
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
