import { describe, expect, it } from "vitest";

import { ModuleError } from "@ryuunest/core";

import type { ErrorReporter } from "../../src/data/errorLogPort";
import { reportSourcesError } from "../../src/screens/sources/sourcesErrors";

/**
 * F31 — Fuentes registra en `log` (P-72) cada fallo visible: la carga inicial
 * de la pantalla y cada acción del controlador (añadir repo, instalar,
 * actualizar, desinstalar, sincronizar, quitar repo, activar/desactivar).
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

describe("reportSourcesError", () => {
  it("registra la acción con el código del contrato en minúsculas", () => {
    const reporter = fakeReporter();

    reportSourcesError(reporter, "sync", new ModuleError("NETWORK", "Tardó demasiado", { url: "https://repo.test/index.json" }));

    expect(reporter.calls).toHaveLength(1);
    const [level, code, message, context] = reporter.calls[0] as [string, string, string, Record<string, unknown>];
    expect(level).toBe("error");
    expect(code).toBe("sources.sync.network");
    expect(message).toBe("Tardó demasiado");
    expect(context).toMatchObject({ errorCode: "NETWORK" });
  });

  it("un error genérico sale como sources.<accion>.internal", () => {
    const reporter = fakeReporter();

    reportSourcesError(reporter, "install", new Error("boom"), { moduleId: "m1" });

    expect(reporter.calls[0]?.[1]).toBe("sources.install.internal");
    expect((reporter.calls[0]?.[3] as Record<string, unknown>).moduleId).toBe("m1");
  });

  it("con reporter null no falla", () => {
    expect(() => reportSourcesError(null, "load", new Error("x"))).not.toThrow();
  });

  it("la carga inicial usa la acción load", () => {
    const reporter = fakeReporter();
    reportSourcesError(reporter, "load", new ModuleError("INTERNAL", "sin base"));
    expect(reporter.calls[0]?.[1]).toBe("sources.load.internal");
  });
});
