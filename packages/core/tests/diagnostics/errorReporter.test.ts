import { describe, expect, it } from "vitest";

import { createLogStore } from "../../src/diagnostics/LogStore";
import { createErrorReporter } from "../../src/diagnostics/errorReporter";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F31/F24 — reporte de errores a pantallas (P-72), compartido por móvil y web:
 * cualquier error visible deja una entrada saneada en `log` (T36) y el reporte
 * es fire-and-forget: un fallo del registro nunca tumba la pantalla. Con
 * `null` (sin base) es un no-op.
 */
describe("createErrorReporter", () => {
  it("registra el evento en el LogStore (fire-and-forget)", async () => {
    const driver = await openMigratedDriver();
    const logStore = createLogStore({ driver, clock: { now: () => 1_000 } });
    const reporter = createErrorReporter(logStore);

    reporter.report("error", "discover.load.NETWORK", "falló la carga", { url: "https://x.test/" });
    await new Promise((resolve) => setImmediate(resolve));

    const entries = await logStore.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.level).toBe("error");
    // El LogStore normaliza el código a minúsculas al registrar.
    expect(entries[0]?.code).toBe("discover.load.network");
  });

  it("con null es un no-op y no lanza", () => {
    const reporter = createErrorReporter(null);
    expect(() => reporter.report("error", "x", "y")).not.toThrow();
  });

  it("si el registro falla, el error se traga (nunca rompe la pantalla)", async () => {
    const failing = {
      record: () => Promise.reject(new Error("sin disco")),
      list: () => Promise.resolve([]),
      clear: () => Promise.resolve(),
      export: () => Promise.resolve(""),
    };
    const reporter = createErrorReporter(failing as never);
    expect(() => reporter.report("error", "x", "y")).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
  });
});
