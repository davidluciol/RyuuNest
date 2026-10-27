import { describe, expect, it } from "vitest";

import { createFetchHttp, type FetchLike, type FetchResponseLike } from "../../src/data/fetchHttp";

/**
 * F15b — adaptador del puerto `Http` del núcleo (SPEC §5.3) sobre el `fetch` de
 * la plataforma (React Native y web). Se prueba con un `fetch` falso: mapeo de
 * estado, cabeceras en minúsculas, texto, bytes y URL final (P-74).
 */

function response(overrides: Partial<FetchResponseLike> & { url?: string } = {}): FetchResponseLike {
  return {
    status: 200,
    headers: {
      forEach: (cb) => {
        cb("text/html; charset=utf-8", "Content-Type");
        cb("yes", "X-Prueba");
      },
    },
    text: async () => "cuerpo",
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    ...overrides,
  };
}

function stubFetch(reply: () => FetchResponseLike): { http: ReturnType<typeof createFetchHttp>; calls: Array<{ url: string; init?: unknown }> } {
  const calls: Array<{ url: string; init?: unknown }> = [];
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return reply();
  };
  return { http: createFetchHttp(fetchImpl), calls };
}

describe("createFetchHttp (puerto Http sobre fetch)", () => {
  it("mapea estado, cabeceras (en minúsculas), texto y URL final", async () => {
    const { http } = stubFetch(() => response({ url: "https://final.test/x" }));
    const result = await http.request("https://pidido.test/x");

    expect(result.status).toBe(200);
    expect(result.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(result.headers["x-prueba"]).toBe("yes");
    expect(await result.text()).toBe("cuerpo");
    expect(result.url).toBe("https://final.test/x");
  });

  it("sin URL final en la respuesta, el campo queda ausente (la rellena el host, P-74)", async () => {
    const { http } = stubFetch(() => response());
    const result = await http.request("https://pidido.test/x");
    expect("url" in result).toBe(false);
  });

  it("`bytes()` devuelve el cuerpo binario sin pasar por UTF-8", async () => {
    const { http } = stubFetch(() => response());
    const result = await http.request("https://pidido.test/p.zip");
    expect(Array.from(await result.bytes())).toEqual([1, 2, 3]);
  });

  it("reenvía método, cabeceras y cuerpo de la petición", async () => {
    const { http, calls } = stubFetch(() => response());
    await http.request("https://pidido.test/api", {
      method: "POST",
      headers: { "X-Token": "abc" },
      body: "{\"q\":1}",
    });

    expect(calls[0]?.url).toBe("https://pidido.test/api");
    expect(calls[0]?.init).toMatchObject({
      method: "POST",
      headers: { "X-Token": "abc" },
      body: "{\"q\":1}",
    });
  });
});
