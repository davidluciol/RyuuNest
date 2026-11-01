import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Las pruebas de la web consumen los paquetes del workspace por sus **fuentes**
 * (patrón P-51), igual que `apps/mobile`: no dependen de que estén compilados.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@ryuunest/mobile-src": fileURLToPath(new URL("../mobile/src", import.meta.url)),
      "@ryuunest/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
      "@ryuunest/i18n": fileURLToPath(new URL("../../packages/i18n/src/index.ts", import.meta.url)),
      "@ryuunest/module-sdk": fileURLToPath(
        new URL("../../packages/module-sdk/src/index.ts", import.meta.url),
      ),
      "@ryuunest/test-site": fileURLToPath(
        new URL("../../packages/test-site/src/index.ts", import.meta.url),
      ),
      "@ryuunest/ui-tokens": fileURLToPath(
        new URL("../../packages/ui-tokens/src/index.ts", import.meta.url),
      ),
    },
  },
});
