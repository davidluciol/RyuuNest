import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Las pruebas del núcleo usan el sitio falso (`@ryuunest/test-site`) como pieza **de
 * test**: el arnés de contrato y las fixtures viven ahí (P-38). `test-site` depende
 * del núcleo, así que declararlo en `package.json` crearía un ciclo de build
 * (`core → test-site → core`, ver `ERR_PNPM_TASK_CYCLE`); se resuelve por alias a las
 * fuentes del workspace, igual que hace `module-sdk`.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@ryuunest/core": fileURLToPath(new URL("./src/index.ts", import.meta.url)),
      "@ryuunest/test-site": fileURLToPath(new URL("../test-site/src/index.ts", import.meta.url)),
    },
  },
});
