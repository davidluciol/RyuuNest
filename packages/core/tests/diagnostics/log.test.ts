import { beforeEach, describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import { createLogStore, formatLogEntries, LOG_MAX_ENTRIES, type LogEntry } from "../../src/diagnostics/LogStore";
import { FixedClock } from "../../src/ports/fakes";
import { migrate, SCHEMA_VERSION } from "../../src/storage/migrations";
import { MIGRATION_2 } from "../../src/storage/schema";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * T36 — núcleo de diagnóstico (P-72): tabla `log`, redacción estricta y export.
 *
 * El registro nunca lleva secretos: el mensaje y el contexto pasan por un
 * saneado que retira URLs completas, cabeceras y credenciales, HTML y rutas
 * locales antes de tocar la base. El tope es 500 entradas (borra las más
 * viejas) y el export sale en JSON y en texto legible, sin red.
 */

let driver: SqlDriver;
let clock: FixedClock;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
});

function build(appVersion = "1.2.3", platform = "android") {
  return createLogStore({ driver, clock, appVersion, platform });
}

describe("migración · tabla log (SPEC §8.1, P-72)", () => {
  it("crea la tabla log y sube la versión del esquema", async () => {
    const version = await driver.get<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(2);
    expect(MIGRATION_2.length).toBeGreaterThan(0);

    const tabla = await driver.get<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'log'",
    );
    expect(tabla?.name).toBe("log");
  });

  it("migrate es idempotente: llamarla de nuevo no falla ni duplica", async () => {
    await migrate(driver);
    const version = await driver.get<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(2);
  });
});

describe("record · guarda la entrada con reloj y entorno", () => {
  it("guarda nivel, código, mensaje, contexto y entorno; list la devuelve", async () => {
    const store = build();

    const entry = await store.record("error", "install.failed", "Falló la descarga", {
      moduleId: "ejemplo",
    });

    expect(entry).toMatchObject({
      at: 1_000,
      level: "error",
      code: "install.failed",
      message: "Falló la descarga",
      appVersion: "1.2.3",
      platform: "android",
    });

    const all = await store.list();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject({ code: "install.failed", message: "Falló la descarga" });
    expect(all[0]?.context).toEqual({ moduleId: "ejemplo" });
  });

  it("admite los tres niveles y normaliza cualquier otro a error", async () => {
    const store = build();

    await store.record("info", "app.start", "arranque");
    await store.record("warn", "cache.slow", "caché lenta");
    await store.record("error", "reader.image", "imagen rota");
    await store.record("debug" as never, "otro", "nivel desconocido");

    const levels = (await store.list()).map((entry) => entry.level);
    expect(levels).toEqual(["error", "error", "warn", "info"]); // reciente primero
  });

  it("normaliza el código a minúsculas y lo trunca; vacío no se registra", async () => {
    const store = build();

    const entry = await store.record("info", "  Install.FAILED  ", "mensaje");
    expect(entry.code).toBe("install.failed");

    await expect(store.record("info", "", "mensaje")).rejects.toThrow(ModuleError);
    await expect(store.record("info", "ok", "")).rejects.toThrow(ModuleError);
    await expect(store.record("info", "ok", "   ")).rejects.toThrow(ModuleError);
    expect(await store.list()).toHaveLength(1);
  });

  it("30 registros simultáneos dejan 30 filas coherentes", async () => {
    const store = build();

    await Promise.all(
      Array.from({ length: 30 }, (_, index) =>
        store.record("info", "bulk", `mensaje ${index}`),
      ),
    );

    expect(await store.list()).toHaveLength(30);
  });
});

describe("record · redacción estricta (sin credenciales, cookies, cabeceras, HTML, URLs ni rutas)", () => {
  it("retira URLs completas del mensaje y del contexto", async () => {
    const store = build();

    const entry = await store.record("error", "net", "falló https://ejemplo.com/x?token=abc", {
      url: "https://ejemplo.com/obra/1",
    });

    expect(entry.message).not.toContain("https://");
    expect(entry.message).toContain("[url]");
    expect(JSON.stringify(entry.context)).not.toContain("https://");
  });

  it("retira cabeceras y credenciales (authorization, cookie, claves de API)", async () => {
    const store = build();

    const entry = await store.record(
      "error",
      "net",
      "falló con Authorization: Bearer secreto y Cookie: sesion=abc; x-api-key: 123",
    );

    expect(entry.message).not.toContain("secreto");
    expect(entry.message).not.toContain("sesion=abc");
    expect(entry.message).not.toContain("123");
  });

  it("retira el HTML del mensaje", async () => {
    const store = build();

    const entry = await store.record(
      "error",
      "parse",
      "falló al leer <div class=\"x\"><span>obra</span></div> del sitio",
    );

    expect(entry.message).not.toContain("<");
    expect(entry.message).not.toContain("class=");
  });

  it("retira rutas locales de Android y Windows", async () => {
    const store = build();

    const entry = await store.record(
      "error",
      "fs",
      "no se pudo escribir /data/user/0/app/files/a.json ni C:\\Users\\yo\\b.json",
    );

    expect(entry.message).not.toContain("/data/user/0");
    expect(entry.message).not.toContain("C:\\Users");
  });

  it("trunca mensajes y contexto exagerados", async () => {
    const store = build();

    const entry = await store.record("error", "big", "x".repeat(5_000), {
      datos: "y".repeat(5_000),
    });

    expect(entry.message.length).toBeLessThanOrEqual(500);
    expect(JSON.stringify(entry.context ?? {}).length).toBeLessThanOrEqual(2_500);
  });
});

describe("list · reciente primero, con límite", () => {
  it("devuelve las más recientes primero y respeta limit", async () => {
    const store = build();
    for (let index = 0; index < 5; index += 1) {
      clock.set(1_000 + index);
      await store.record("info", "orden", `mensaje ${index}`);
    }

    const all = await store.list();
    expect(all.map((entry) => entry.message)).toEqual([
      "mensaje 4",
      "mensaje 3",
      "mensaje 2",
      "mensaje 1",
      "mensaje 0",
    ]);

    const limited = await store.list({ limit: 2 });
    expect(limited.map((entry) => entry.message)).toEqual(["mensaje 4", "mensaje 3"]);
  });
});

describe("tope · 500 entradas (borra las más viejas)", () => {
  it(`al pasar de ${LOG_MAX_ENTRIES} quedan solo las más recientes`, async () => {
    const store = build();

    for (let index = 0; index < LOG_MAX_ENTRIES + 5; index += 1) {
      clock.set(1_000 + index);
      await store.record("info", "tope", `mensaje ${index}`);
    }

    const all = await store.list({ limit: LOG_MAX_ENTRIES + 10 });
    expect(all).toHaveLength(LOG_MAX_ENTRIES);
    expect(all[0]?.message).toBe(`mensaje ${LOG_MAX_ENTRIES + 4}`);
    expect(all.at(-1)?.message).toBe("mensaje 5");
    expect(all.some((entry) => entry.message === "mensaje 0")).toBe(false);
  });
});

describe("clear · borra el registro", () => {
  it("clear deja la tabla vacía", async () => {
    const store = build();
    await store.record("info", "a", "uno");
    await store.record("info", "b", "dos");

    await store.clear();

    expect(await store.list()).toEqual([]);
  });
});

describe("export · JSON y texto legible, sin red", () => {
  async function seed(): Promise<LogEntry[]> {
    const store = build();
    await store.record("info", "app.start", "arranque", { platform: "android" });
    clock.set(2_000);
    await store.record("error", "install.failed", "Falló la descarga https://x.example.com");
    return store.list();
  }

  it("export json devuelve un documento parseable con las entradas saneadas", async () => {
    await seed();
    const store = build();

    const text = await store.export("json");
    const value = JSON.parse(text) as {
      format: string;
      version: number;
      entries: Array<{ level: string; code: string; message: string }>;
    };

    expect(value.format).toBe("ryuunest-log");
    expect(value.version).toBe(1);
    expect(value.entries).toHaveLength(2);
    expect(value.entries[0]).toMatchObject({ level: "error", code: "install.failed" });
    expect(value.entries[0]?.message).not.toContain("https://");
  });

  it("export text es legible: una línea por entrada con fecha, nivel, código y mensaje", async () => {
    await seed();
    const store = build();

    const text = await store.export("text");
    const lines = text.trim().split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("[error]");
    expect(lines[0]).toContain("install.failed");
    expect(lines[0]).toContain("Falló la descarga");
    expect(lines[0]).toMatch(/\d{4}-\d{2}-\d{2}T/); // fecha ISO
  });
});

describe("formatLogEntries — el mismo formato fuera de SQLite (F30)", () => {
  const entries: LogEntry[] = [
    { id: 2, at: 2_000, level: "error", code: "module.timeout", message: "Tardó demasiado", context: { module: "m-ejemplo-a" }, appVersion: "1.2.3", platform: "android" },
    { id: 1, at: 1_000, level: "info", code: "app.start", message: "arranque", appVersion: "1.2.3", platform: "android" },
  ];

  it("json: documento ryuunest-log v1 con las entradas tal cual", () => {
    const value = JSON.parse(formatLogEntries(entries, "json")) as { format: string; version: number; entries: LogEntry[] };

    expect(value.format).toBe("ryuunest-log");
    expect(value.version).toBe(1);
    expect(value.entries).toEqual(entries);
  });

  it("texto: una línea por entrada, con fecha ISO, nivel, código, mensaje y contexto", () => {
    const lines = formatLogEntries(entries, "text").split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('1970-01-01T00:00:02.000Z [error] module.timeout: Tardó demasiado {"module":"m-ejemplo-a"}');
    expect(lines[1]).toBe("1970-01-01T00:00:01.000Z [info] app.start: arranque");
  });

  it("export de la tienda produce exactamente lo mismo que formatLogEntries", async () => {
    const store = build();
    await store.record("warn", "reader.image.retry", "reintento");

    const listed = await store.list();

    expect(await store.export("text")).toBe(formatLogEntries(listed, "text"));
    expect(await store.export("json")).toBe(formatLogEntries(listed, "json"));
  });
});