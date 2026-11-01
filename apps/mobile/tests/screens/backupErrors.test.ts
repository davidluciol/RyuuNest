import { describe, expect, it } from "vitest";

import { ModuleError } from "@ryuunest/core";

import type { ErrorReporter } from "../../src/data/errorLogPort";
import { reportBackupError } from "../../src/screens/settings/backup/backupErrors";

/**
 * F31 — Respaldo registra en `log` (P-72) cada rechazo y error visible:
 * exportar, importar (elegir archivo), aplicar (merge/replace) y confirmar
 * un repo sugerido. Los rechazos de importación llevan su código
 * (`TOO_LARGE`/`NOT_JSON`/`INVALID`).
 */

function fakeReporter(): ErrorReporter & { calls: unknown[][] } {
  const calls: unknown[][] = [];
  return {
    calls,
    report(...args: unknown[]) {
      calls.push(args);
    },
  };
}

describe("reportBackupError", () => {
  it("export fallido: backup.export.<codigo>", () => {
    const reporter = fakeReporter();
    reportBackupError(reporter, "export", new ModuleError("INTERNAL", "sin archivo"));
    expect(reporter.calls[0]?.[1]).toBe("backup.export.internal");
    expect(reporter.calls[0]?.[0]).toBe("error");
  });

  it("import fallido: backup.import.<codigo>", () => {
    const reporter = fakeReporter();
    reportBackupError(reporter, "import", new Error("no se pudo leer"));
    expect(reporter.calls[0]?.[1]).toBe("backup.import.internal");
  });

  it("rechazo de importación: backup.apply.<rejection> con el motivo", () => {
    const reporter = fakeReporter();
    reportBackupError(reporter, "apply", new ModuleError("INTERNAL", "El archivo es muy grande"), {
      rejection: "TOO_LARGE",
    });
    const [, code, , context] = reporter.calls[0] as [string, string, string, Record<string, unknown>];
    expect(code).toBe("backup.apply.too_large");
    expect(context.rejection).toBe("TOO_LARGE");
  });

  it("confirmar repo sugerido fallido: backup.repo.<codigo>", () => {
    const reporter = fakeReporter();
    reportBackupError(reporter, "repo", new ModuleError("NETWORK", "repositorio caído"), { repoUrl: "https://x.test" });
    expect(reporter.calls[0]?.[1]).toBe("backup.repo.network");
  });

  it("con reporter null no falla", () => {
    expect(() => reportBackupError(null, "export", new Error("x"))).not.toThrow();
  });
});
