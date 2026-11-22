import { defineConfig } from "vitest/config";

/**
 * T44: `vitest run` desde la raíz corre cada paquete como proyecto propio (su carpeta como
 * raíz y su `vitest.config.ts` si lo tiene), igual que `pnpm -r test`.
 */
export default defineConfig({
  test: {
    projects: ["apps/*", "packages/*", "tools/*"],
    passWithNoTests: true,
  },
});
