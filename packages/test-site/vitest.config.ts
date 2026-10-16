import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Las pruebas de `test-site` importan `@ryuunest/core` (un valor: `utf8Encode`, P-48).
 * Sin alias, Vite lo resuelve por el `main`/`exports` del paquete, que apunta a `dist`;
 * en un checkout limpio (el CI corre `test` **antes** de `build`) ese `dist` aún no
 * existe y las pruebas fallan con «Failed to resolve entry for package». Se resuelve
 * por alias a las fuentes del workspace, igual que hacen `core` y `module-sdk`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@ryuunest/core": fileURLToPath(new URL("../core/src/index.ts", import.meta.url)),
    },
  },
});
