import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { createLogger, defineConfig } from "vite";

import { tokensCssPlugin } from "../web/src/tokens/tokensCssPlugin";

/**
 * F26 — empaquetado de la página de opciones (`options.html`). El fondo y el
 * content script se empaquetan aparte, como IIFE, en `scripts/build.mjs`.
 *
 * Reutiliza los componentes y el CSS base de la web (`@ryuunest/web`, Regla 3) y
 * el mismo plugin de tokens CSS (AC-13). `@ryuunest/mobile-src` solo lo pide un
 * `import { type … }` de `Toast`: lógica pura, sin `react-native`.
 */
const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const srcAlias = (name: string) => at(`../../packages/${name}/src/index.ts`);

// El CSS de tokens pide las fuentes por ruta absoluta (`/fonts/…`); `build.mjs` las
// copia a `dist/fonts` y se resuelven en ejecución. Ese aviso es esperado: se filtra
// solo él, el resto de avisos sigue saliendo.
const logger = createLogger();
const expectedWarning = (message: string) => message.includes("didn't resolve at build time");
for (const method of ["warn", "warnOnce"] as const) {
  const original = logger[method].bind(logger);
  logger[method] = (message, options) => {
    if (!expectedWarning(message)) original(message, options);
  };
}

export default defineConfig({
  customLogger: logger,
  base: "./",
  plugins: [react(), tokensCssPlugin()],
  resolve: {
    alias: {
      "@ryuunest/web": at("../web/src"),
      "@ryuunest/mobile-src": at("../mobile/src"),
      "@ryuunest/i18n": srcAlias("i18n"),
      "@ryuunest/ui-tokens": srcAlias("ui-tokens"),
      "@ryuunest/extension-protocol": srcAlias("extension-protocol"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    // Sin precarga inline: las páginas de extensión no admiten scripts en línea (CSP de MV3).
    modulePreload: false,
    rollupOptions: { input: { options: at("options.html") } },
  },
});
