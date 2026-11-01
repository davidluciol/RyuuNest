import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Las pruebas consumen los paquetes del workspace por sus fuentes (patrón P-51). */
export default defineConfig({
  resolve: {
    alias: {
      "@ryuunest/extension-protocol": fileURLToPath(
        new URL("../../packages/extension-protocol/src/index.ts", import.meta.url),
      ),
    },
  },
});
