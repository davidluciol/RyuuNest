import { describe, expect, it, vi } from "vitest";

import { reportCoverError } from "../../src/components/coverError";

/**
 * T42 — una portada que no carga deja entrada en `log` para poder distinguir (sin el teléfono
 * conectado) 403 de Cloudflare, cabeceras que no llegan o formato que no decodifica.
 */
describe("reportCoverError", () => {
  it("registra la URL sin query, los nombres de cabecera (nunca valores) y el error", () => {
    const report = vi.fn();
    reportCoverError(
      { report },
      {
        uri: "https://s1.m440.in/covers/eco.jpg?token=secreto",
        headers: { Referer: "https://m440.in/", Cookie: "s=1" },
      },
      "java.io.IOException: HTTP 403",
    );
    expect(report).toHaveBeenCalledWith("error", "cover.load", "java.io.IOException: HTTP 403", {
      url: "https://s1.m440.in/covers/eco.jpg",
      headerNames: ["Referer", "Cookie"],
    });
  });

  it("sin cabeceras lo indica con lista vacía; sin reporter no falla", () => {
    const report = vi.fn();
    reportCoverError({ report }, { uri: "https://x.test/a.webp" }, "boom");
    expect(report.mock.calls[0]?.[3]).toEqual({ url: "https://x.test/a.webp", headerNames: [] });
    expect(() => reportCoverError(null, { uri: "https://x.test/a.webp" }, "boom")).not.toThrow();
  });
});
