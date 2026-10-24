import { describe, expect, it } from "vitest";

import { ModuleHost } from "../../src/host/ModuleHost";
import type { Clock } from "../../src/ports/clock";
import { StubHttp } from "../../src/ports/fakes";
import type { Http, HttpResponse } from "../../src/ports/http";

const clock: Clock = { now: () => Date.now() };

function makeHost(http: Http): ModuleHost {
  return new ModuleHost({
    http,
    clock,
    permissions: { domains: ["ejemplo.com"] },
    minDelayMs: 0,
  });
}

describe("host · URL final de la respuesta", () => {
  it("devuelve la URL pedida cuando el puerto no informa de redirecciones", async () => {
    const http = new StubHttp({ "https://ejemplo.com/a": { body: "ok" } });

    const response = await makeHost(http).fetch("https://ejemplo.com/a");

    expect(response.url).toBe("https://ejemplo.com/a");
  });

  it("devuelve la URL final que informa el puerto tras una redirección", async () => {
    const http = new StubHttp({
      "https://ejemplo.com/a": { body: "ok", finalUrl: "https://ejemplo.com/b/paginated" },
    });

    const response = await makeHost(http).fetch("https://ejemplo.com/a");

    expect(response.url).toBe("https://ejemplo.com/b/paginated");
    expect(await response.text()).toBe("ok");
  });

  it("conserva estado y cabeceras de la respuesta original", async () => {
    const http = new StubHttp({
      "https://ejemplo.com/a": {
        status: 403,
        headers: { server: "cloudflare" },
        body: "no",
        finalUrl: "https://ejemplo.com/b",
      },
    });

    const response = await makeHost(http).fetch("https://ejemplo.com/a");

    expect(response.status).toBe(403);
    expect(response.headers).toEqual({ server: "cloudflare" });
    expect(response.url).toBe("https://ejemplo.com/b");
  });

  it("el puerto Http acepta una respuesta con url opcional", async () => {
    const http: Http = {
      request: async (): Promise<HttpResponse> => ({
        status: 200,
        headers: {},
        url: "https://ejemplo.com/final",
        text: async () => "",
        bytes: async () => new Uint8Array(),
      }),
    };

    const response = await http.request("https://ejemplo.com/inicio");

    expect(response.url).toBe("https://ejemplo.com/final");
  });
});
