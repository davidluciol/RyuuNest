import { defineConfig } from "vitest/config";

/**
 * F09 — el `RuleTester` de ESLint usa `describe`/`it` globales cuando existen
 * (si no, corre en modo autónomo y vitest informa de «no tests», que puede
 * esconder un falso verde). Con `globals` los casos cuentan como pruebas reales.
 */
export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    // Levantar una instancia de ESLint con la configuración real tarda varios
    // segundos (lint de integración), más que el límite por defecto.
    testTimeout: 30000,
  },
});
