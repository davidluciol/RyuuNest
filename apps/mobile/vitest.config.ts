import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Las pruebas del móvil consumen `@ryuunest/ui-tokens` como pieza de test: el
 * alias va a las **fuentes** del workspace (patrón de P-51) para no depender de
 * que el paquete esté compilado antes de `pnpm -r test` en un checkout limpio.
 * En runtime, Metro sigue resolviendo el paquete por su `dist`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@ryuunest/ui-tokens": fileURLToPath(
        new URL("../../packages/ui-tokens/src/index.ts", import.meta.url),
      ),
    },
  },
});
