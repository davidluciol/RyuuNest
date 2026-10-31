import { createLogStore, type LogStore } from "@ryuunest/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { createErrorReporter } from "../../src/data/errorLogPort";

/**
 * F31 — reporte de errores a pantallas (P-72): cualquier error visible en una
 * pantalla deja una entrada saneada en el registro `log` (T36) sin datos
 * sensibles. El reporte es fire-and-forget: nunca un fallo del registro tumba
 * la pantalla que lo produjo. En web (sin SQLite) el reporter es un no-op.
 */

let driver: Awaited<ReturnType<typeof openMigratedDriver>>;
let now = 1_000;

beforeEach(async () => {
  driver = await openMigratedDriver();
  now = 1_000;
});

afterEach(() => {
  driver.close();
});

function logStore(): LogStore {
  return createLogStore({
    driver,
    clock: { now: () => now },
    appVersion: "0.1.0",
    platform: "android",
  });
}

describe("createErrorReporter", () => {
  it("sin LogStore (web) no falla y no registra nada", () => {
    const reporter = createErrorReporter(null);
    expect(() => reporter.report("error", "discover.load.failed", "falló")).not.toThrow();
  });

  it("registra el error en el log con nivel, código y mensaje saneados", async () => {
    const store = logStore();
    const reporter = createErrorReporter(store);

    reporter.report("error", "Discover.Load.Failed", "No se pudo leer el listado de https://sitio.test/api");

    // fire-and-forget: dejamos que el microtask se ejecute
    await new Promise((resolve) => setImmediate(resolve));

    const entries = await store.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.level).toBe("error");
    expect(entries[0]?.code).toBe("discover.load.failed");
    // el saneado del núcleo quita la URL completa del mensaje
    expect(entries[0]?.message).not.toContain("https://");
  });

  it("el contexto pasa saneado (sin cabeceras con credenciales)", async () => {
    const store = logStore();
    const reporter = createErrorReporter(store);

    reporter.report("warn", "sources.sync.failed", "falló la sincronización", {
      url: "https://repo.ejemplo.org/index.json",
      headers: { Authorization: "Bearer secreto" },
    });

    await new Promise((resolve) => setImmediate(resolve));

    const entries = await store.list();
    expect(entries).toHaveLength(1);
    const context = JSON.stringify(entries[0]?.context ?? {});
    expect(context).not.toContain("secreto");
    expect(context).not.toContain("Bearer");
  });

  it("si el registro falla, el error no se propaga a la pantalla", async () => {
    const broken: LogStore = {
      record: () => Promise.reject(new Error("SQLite caído")),
      list: () => Promise.resolve([]),
      clear: () => Promise.resolve(),
      export: () => Promise.resolve(""),
    };
    const reporter = createErrorReporter(broken);

    expect(() => reporter.report("error", "reader.open.failed", "falló")).not.toThrow();
    // y no queda promesa pendiente que reviente sin capturar
    await new Promise((resolve) => setImmediate(resolve));
  });

  it("respeta el nivel pedido (info/warn/error)", async () => {
    const store = logStore();
    const reporter = createErrorReporter(store);

    reporter.report("info", "backup.exported", "Respaldo exportado");
    reporter.report("warn", "sources.official.failed", "Falló el repo oficial");
    reporter.report("error", "reader.image.failed", "Falló la página 3");

    await new Promise((resolve) => setImmediate(resolve));

    const entries = await store.list();
    expect(entries.map((entry) => entry.level)).toEqual(["error", "warn", "info"]);
  });
});
