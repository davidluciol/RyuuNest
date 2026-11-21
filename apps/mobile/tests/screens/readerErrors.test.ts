import { describe, expect, it } from "vitest";

import { ModuleError } from "@ryuunest/core";

import type { ErrorReporter } from "../../src/data/errorLogPort";
import { reportReaderError } from "../../src/screens/reader/readerErrors";

/**
 * F31 — el lector registra en `log` (P-72) cada fallo visible: al abrir el
 * capítulo (pantalla de banner estático) y cada imagen que falla (RF-23).
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

describe("reportReaderError", () => {
  it("fallo al abrir el capítulo: reader.open.<codigo> con moduleId/seriesId/chapterId", () => {
    const reporter = fakeReporter();

    reportReaderError(reporter, "open", new ModuleError("NETWORK", "Tardó demasiado"), {
      moduleId: "m1",
      seriesId: "s1",
      chapterId: "c1",
    });

    const [level, code, message, context] = reporter.calls[0] as [string, string, string, Record<string, unknown>];
    expect(level).toBe("error");
    expect(code).toBe("reader.open.network");
    expect(message).toBe("Tardó demasiado");
    expect(context).toMatchObject({ moduleId: "m1", seriesId: "s1", chapterId: "c1", errorCode: "NETWORK" });
  });

  it("imagen fallida: reader.image.<codigo> con la página (base 1)", () => {
    const reporter = fakeReporter();

    reportReaderError(reporter, "image", new Error("404"), { page: 3 });

    expect(reporter.calls[0]?.[1]).toBe("reader.image.internal");
    expect((reporter.calls[0]?.[3] as Record<string, unknown>).page).toBe(3);
  });

  it("con reporter null no falla", () => {
    expect(() => reportReaderError(null, "open", new Error("x"), {})).not.toThrow();
  });
});
