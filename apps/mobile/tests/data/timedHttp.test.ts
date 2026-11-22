import { describe, expect, it } from "vitest";

import type { Http, HttpResponse } from "@ryuunest/core";

import { withTiming, type HttpTiming } from "../../src/data/timedHttp";

function okHttp(status = 200): Http {
  return {
    request: async (): Promise<HttpResponse> => ({
      status,
      headers: {},
      text: async () => "",
      bytes: async () => new Uint8Array(),
    }),
  };
}

describe("withTiming (G1: medir la red de los módulos)", () => {
  it("informa host, estado y duración, sin ruta ni consulta", async () => {
    const seen: HttpTiming[] = [];
    let t = 1000;
    const http = withTiming(
      okHttp(404),
      (timing) => seen.push(timing),
      () => (t += 120),
    );

    const response = await http.request("https://Sitio.test/serie/1?token=secreto");

    expect(response.status).toBe(404);
    expect(seen).toEqual([
      { host: "sitio.test", status: 404, startedAt: 1120, ms: 120, finalUrl: "none" },
    ]);
  });

  it("marca si la plataforma trajo otra URL final (P-74), sin guardarla", async () => {
    const seen: HttpTiming[] = [];
    const redirecting: Http = {
      request: async () => ({ ...(await okHttp().request("x")), url: "https://sitio.test/final" }),
    };
    await withTiming(
      redirecting,
      (timing) => seen.push(timing),
      () => 0,
    ).request("https://sitio.test/a");
    expect(seen[0]?.finalUrl).toBe("other");
  });

  it("informa el fallo de red con estado 0 y relanza el error", async () => {
    const seen: HttpTiming[] = [];
    const failing: Http = {
      request: async () => {
        throw new Error("sin red");
      },
    };
    const http = withTiming(
      failing,
      (timing) => seen.push(timing),
      () => 0,
    );

    await expect(http.request("https://sitio.test/x")).rejects.toThrow("sin red");
    expect(seen).toEqual([
      { host: "sitio.test", status: 0, startedAt: 0, ms: 0, finalUrl: "none" },
    ]);
  });
});
