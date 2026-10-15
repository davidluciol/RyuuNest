import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Las pruebas del SDK usan el núcleo y `test-site` en tiempo de ejecución (el CLI
 * construye un `ModuleHost` y ejecuta el arnés de contrato). Los alias apuntan a las
 * fuentes del workspace, así `pnpm test` no depende de que las demás piezas estén
 * compiladas; `build` sí resuelve los paquetes por `dist` (pnpm compila en orden).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@ryuunest/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
      "@ryuunest/test-site": fileURLToPath(new URL("../test-site/src/index.ts", import.meta.url)),
    },
  },
});
