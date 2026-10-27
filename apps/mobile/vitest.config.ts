import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Las pruebas del móvil consumen `@ryuunest/ui-tokens` como pieza de test: el
 * alias va a las **fuentes** del workspace (patrón de P-51) para no depender de
 * que el paquete esté compilado antes de `pnpm -r test` en un checkout limpio.
 * En runtime, Metro sigue resolviendo el paquete por su `dist`.
 */
export default defineConfig({
  plugins: [
    {
      name: "ryuunest-mock-ttf",
      // Vitest no empaqueta assets como Metro: los `.ttf` importados desde el
      // código se sustituyen por un mock con el id numérico que Metro asigna.
      enforce: "pre",
      resolveId(id, importer) {
        if (id.endsWith(".ttf") && importer) {
          return fileURLToPath(new URL("./tests/assetMock.ts", import.meta.url));
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: {
      "@ryuunest/ui-tokens": fileURLToPath(
        new URL("../../packages/ui-tokens/src/index.ts", import.meta.url),
      ),
      "@ryuunest/test-site": fileURLToPath(
        new URL("../../packages/test-site/src/index.ts", import.meta.url),
      ),
      "@ryuunest/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@ryuunest/module-sdk": fileURLToPath(
        new URL("../../packages/module-sdk/src/index.ts", import.meta.url),
      ),
    },
  },
});
