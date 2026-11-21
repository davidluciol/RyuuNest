import { describe, expect, it } from "vitest";

import { ModuleError } from "@ryuunest/core";

import type { ErrorReporter } from "../../src/data/errorLogPort";
import { reportDiscoverError } from "../../src/screens/discover/discoverErrors";

/**
 * F31 — Descubrir registra cada error visible en `log` (P-72): la función
 * pura traduce el fallo del módulo a `DiscoverError` (RF-11) y, además,
 * deja entrada en el registro con el código del contrato.
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

describe("reportDiscoverError", () => {
  it("devuelve el DiscoverError y registra el fallo con el código del contrato", () => {
    const reporter = fakeReporter();
    const error = new ModuleError("NETWORK", "Tardó demasiado", { url: "https://sitio.test/api" });

    const result = reportDiscoverError(reporter, error, "Módulo A");

    expect(result).toMatchObject({ moduleName: "Módulo A", code: "NETWORK", cause: "Tardó demasiado" });
    expect(reporter.calls).toHaveLength(1);
    const [level, code, message, context] = reporter.calls[0] as [string, string, string, Record<string, unknown>];
    expect(level).toBe("error");
    expect(code).toBe("discover.network");
    expect(message).toBe("Tardó demasiado");
    expect(context).toMatchObject({ module: "Módulo A", errorCode: "NETWORK" });
  });

  it("un error genérico se registra como discover.internal", () => {
    const reporter = fakeReporter();

    const result = reportDiscoverError(reporter, new Error("boom"), "");

    expect(result.code).toBe("INTERNAL");
    expect(reporter.calls[0]?.[1]).toBe("discover.internal");
  });

  it("con reporter null no falla (web sin registro) y solo devuelve el error", () => {
    const result = reportDiscoverError(null, new ModuleError("PARSE", "HTML roto"), "Módulo B");
    expect(result.code).toBe("PARSE");
  });
});
