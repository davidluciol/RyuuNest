import { createLogStore } from "@ryuunest/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { diagnosticsFileName, type DiagnosticsFiles } from "../../src/data/diagnosticsReport";
import {
  createDiagnosticsService,
  type DiagnosticsService,
} from "../../src/screens/settings/diagnostics/diagnosticsData";

/**
 * F30 — capa de datos de Ajustes → Diagnóstico (P-72) sobre el núcleo real
 * (tabla `log` en SQLite): lista, informe en texto/JSON, exportar con el
 * puerto de archivos, copiar al portapapeles y borrar. Nada sale de la app.
 */

interface FakeFiles extends DiagnosticsFiles {
  shared: { text: string; format: string }[];
}

function fakeFiles(): FakeFiles {
  const files: FakeFiles = {
    shared: [],
    async shareReport(text, format) {
      files.shared.push({ text, format });
      return "shared";
    },
  };
  return files;
}

let driver: Awaited<ReturnType<typeof openMigratedDriver>>;
let now = 1_000;
let copied: string[];

beforeEach(async () => {
  driver = await openMigratedDriver();
  now = 1_000;
  copied = [];
});

afterEach(() => {
  driver.close();
});

function build(files: DiagnosticsFiles = fakeFiles()): {
  service: DiagnosticsService;
  record: ReturnType<typeof createLogStore>["record"];
} {
  const logStore = createLogStore({ driver, clock: { now: () => now }, appVersion: "0.1.0", platform: "android" });
  return {
    service: createDiagnosticsService({
      logStore,
      files,
      copyText: async (text) => {
        copied.push(text);
      },
    }),
    record: logStore.record.bind(logStore),
  };
}

describe("createDiagnosticsService", () => {
  it("lista los eventos con el más reciente primero", async () => {
    const { service, record } = build();
    await record("info", "app.start", "arranque");
    now = 2_000;
    await record("error", "module.timeout", "Tardó demasiado");

    const events = await service.list();

    expect(events.map((event) => event.code)).toEqual(["module.timeout", "app.start"]);
  });

  it("el informe en texto y en JSON sale del mismo registro saneado", async () => {
    const { service, record } = build();
    await record("error", "install.failed", "Falló https://fuente.ejemplo.org/api/x");

    const text = await service.report("text");
    const json = JSON.parse(await service.report("json")) as { format: string; entries: unknown[] };

    expect(text).toContain("[error] install.failed");
    expect(text).not.toContain("https://");
    expect(json.format).toBe("ryuunest-log");
    expect(json.entries).toHaveLength(1);
  });

  it("exportar entrega el informe elegido al puerto de archivos", async () => {
    const files = fakeFiles();
    const { service, record } = build(files);
    await record("warn", "reader.image.retry", "reintento");

    await service.exportReport("json");

    expect(files.shared).toHaveLength(1);
    expect(files.shared[0]?.format).toBe("json");
    expect(JSON.parse(files.shared[0]?.text ?? "{}")).toMatchObject({ format: "ryuunest-log" });
  });

  it("copiar manda el informe elegido al portapapeles", async () => {
    const { service, record } = build();
    await record("info", "app.start", "arranque");

    await service.copyReport("text");

    expect(copied).toHaveLength(1);
    expect(copied[0]).toContain("app.start: arranque");
  });

  it("no exporta ni copia un registro vacío", async () => {
    const files = fakeFiles();
    const { service } = build(files);

    await expect(service.exportReport("text")).rejects.toThrow();
    await expect(service.copyReport("text")).rejects.toThrow();
    expect(files.shared).toEqual([]);
    expect(copied).toEqual([]);
  });

  it("borrar deja el registro vacío", async () => {
    const { service, record } = build();
    await record("info", "app.start", "arranque");

    await service.clear();

    expect(await service.list()).toEqual([]);
  });
});

describe("diagnosticsFileName", () => {
  it("usa la fecha y la extensión del formato", () => {
    const date = new Date("2026-10-29T12:00:00Z");

    expect(diagnosticsFileName("text", date)).toBe("ryuunest-diagnostico-2026-10-29.txt");
    expect(diagnosticsFileName("json", date)).toBe("ryuunest-diagnostico-2026-10-29.json");
  });
});
