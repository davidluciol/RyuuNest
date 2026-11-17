import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/** Las pruebas usan las fuentes del núcleo (patrón P-51): no dependen de que esté compilado. */
export default defineConfig({
  resolve: {
    alias: {
      "@ryuunest/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
    },
  },
});
