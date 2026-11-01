import {
  PROTOCOL_CHANNEL,
  PROTOCOL_VERSION,
  bytesToBase64,
  type HttpRequestMessage,
  type RequestMessage,
} from "@ryuunest/extension-protocol";
import { describe, expect, it, vi } from "vitest";

import { handleMessage, type FetchFn, type HandlerDeps } from "../../src/background/handler";
import type { HeaderRules } from "../../src/background/headers";

const APP = "http://localhost:5173";
const envelope = { channel: PROTOCOL_CHANNEL, version: PROTOCOL_VERSION } as const;

function http(overrides: Partial<HttpRequestMessage> = {}): HttpRequestMessage {
  return {
    ...envelope,
    id: "r1",
    type: "http.request",
    url: "https://sitio.org/lista?p=1",
    method: "GET",
    headers: {},
    ...overrides,
  };
}

function response(body: BodyInit | null, init: ResponseInit & { url?: string } = {}): Response {
  const { url, ...rest } = init;
  const result = new Response(body, rest);
  if (url !== undefined) Object.defineProperty(result, "url", { value: url });
  return result;
}

function makeDeps(overrides: Partial<HandlerDeps> = {}) {
  const fetchMock = vi.fn<FetchFn>(async () =>
    response("<p>hola</p>", { status: 200, headers: { "content-type": "text/html" } }),
  );
  const release = vi.fn(async () => {});
  const apply = vi.fn<HeaderRules["apply"]>(async () => release);
  const remember = vi.fn(async () => {});
  const openOptions = vi.fn(async () => {});
  const deps: HandlerDeps = {
    appOrigins: [APP],
    extensionVersion: "9.9.9",
    fetch: fetchMock,
    hasHostPermission: async () => true,
    rememberPendingHost: remember,
    headerRules: { apply, reset: async () => {} },
    openOptions,
    timeoutMs: 1_000,
    ...overrides,
  };
  return { deps, fetchMock, apply, release, remember, openOptions };
}

const fromApp = { origin: APP };

describe("origen del remitente", () => {
  const requests: RequestMessage[] = [
    http(),
    { ...envelope, id: "p", type: "ping" },
    { ...envelope, id: "o", type: "options.open" },
  ];

  it.each(requests.map((request) => [request.type, request] as const))(
    "%s desde otro origen no hace nada",
    async (_type, request) => {
      const { deps, fetchMock, openOptions, remember } = makeDeps();
      for (const origin of ["https://malo.example", "http://localhost:9999", undefined]) {
        const reply = await handleMessage(request, { origin }, deps);
        expect(reply).toMatchObject({ type: "error", code: "ORIGIN_NOT_ALLOWED", id: request.id });
      }
      expect(fetchMock).not.toHaveBeenCalled();
      expect(openOptions).not.toHaveBeenCalled();
      expect(remember).not.toHaveBeenCalled();
    },
  );
});

describe("ping y options.open", () => {
  it("ping responde con la versión de la extensión", async () => {
    const { deps } = makeDeps();
    expect(await handleMessage({ ...envelope, id: "p", type: "ping" }, fromApp, deps)).toEqual({
      ...envelope,
      id: "p",
      type: "pong",
      extensionVersion: "9.9.9",
    });
  });

  it("options.open abre las opciones con el dominio y confirma", async () => {
    const { deps, openOptions } = makeDeps();
    const reply = await handleMessage(
      { ...envelope, id: "o", type: "options.open", domain: "cdn.sitio.org" },
      fromApp,
      deps,
    );
    expect(openOptions).toHaveBeenCalledWith("cdn.sitio.org");
    expect(reply).toEqual({ ...envelope, id: "o", type: "ack" });
  });
});

describe("dominio autorizado (SPEC §7.2: sin autorización no hay petición)", () => {
  it("sin permiso para el host: error, se recuerda como pendiente y NO hay petición", async () => {
    const { deps, fetchMock, apply, remember } = makeDeps({ hasHostPermission: async () => false });
    const reply = await handleMessage(
      http({ headers: { referer: "https://sitio.org/" } }),
      fromApp,
      deps,
    );
    expect(reply).toMatchObject({
      type: "error",
      code: "DOMAIN_NOT_AUTHORIZED",
      domain: "sitio.org",
      id: "r1",
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(apply).not.toHaveBeenCalled();
    expect(remember).toHaveBeenCalledWith("sitio.org");
  });

  it("comprueba el host exacto de la URL", async () => {
    const asked: string[] = [];
    const { deps } = makeDeps({
      hasHostPermission: async (host) => {
        asked.push(host);
        return true;
      },
    });
    await handleMessage(http({ url: "https://CDN.Sitio.org:8443/a.jpg" }), fromApp, deps);
    expect(asked).toEqual(["cdn.sitio.org"]);
  });
});

describe("petición autorizada", () => {
  it("hace el fetch sin credenciales y devuelve estado, cabeceras, URL y texto", async () => {
    const { deps, fetchMock } = makeDeps({
      fetch: vi.fn<FetchFn>(async () =>
        response("<p>hola</p>", {
          status: 200,
          url: "https://sitio.org/final",
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Set-Cookie": "a=1",
            "X-Uno": "1",
          },
        }),
      ),
    });
    const reply = await handleMessage(http({ headers: { Accept: "text/html" } }), fromApp, deps);
    const init = vi.mocked(deps.fetch).mock.calls[0]?.[1];
    expect(vi.mocked(deps.fetch).mock.calls[0]?.[0]).toBe("https://sitio.org/lista?p=1");
    expect(init).toMatchObject({
      method: "GET",
      headers: { accept: "text/html" },
      credentials: "omit",
      redirect: "follow",
    });
    expect(reply).toEqual({
      ...envelope,
      id: "r1",
      type: "http.response",
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8", "x-uno": "1" },
      url: "https://sitio.org/final",
      encoding: "text",
      body: "<p>hola</p>",
    });
    expect(fetchMock).not.toHaveBeenCalled(); // el de `makeDeps` quedó sustituido
  });

  it("si la plataforma no informa la URL final, devuelve la pedida", async () => {
    const { deps } = makeDeps();
    const reply = await handleMessage(http(), fromApp, deps);
    expect(reply).toMatchObject({ type: "http.response", url: "https://sitio.org/lista?p=1" });
  });

  it("un estado de error del sitio (404, 500) es una respuesta, no un fallo", async () => {
    const { deps } = makeDeps({
      fetch: async () =>
        response("no está", { status: 404, headers: { "content-type": "text/plain" } }),
    });
    expect(await handleMessage(http(), fromApp, deps)).toMatchObject({
      type: "http.response",
      status: 404,
      body: "no está",
    });
  });

  it("los binarios viajan en base64", async () => {
    const bytes = Uint8Array.of(0xff, 0xd8, 0xff, 0x00, 0x80);
    const { deps } = makeDeps({
      fetch: async () =>
        response(bytes, { status: 200, headers: { "content-type": "image/jpeg" } }),
    });
    expect(await handleMessage(http(), fromApp, deps)).toMatchObject({
      type: "http.response",
      encoding: "base64",
      body: bytesToBase64(bytes),
    });
  });

  it("un POST lleva su cuerpo", async () => {
    const { deps } = makeDeps();
    await handleMessage(http({ method: "POST", body: '{"q":"dragón"}' }), fromApp, deps);
    expect(vi.mocked(deps.fetch).mock.calls[0]?.[1]).toMatchObject({
      method: "POST",
      body: '{"q":"dragón"}',
    });
  });

  it("nunca envía cookies ni cabeceras prohibidas", async () => {
    const { deps } = makeDeps();
    await handleMessage(
      http({
        headers: { Cookie: "s=1", Host: "otro.org", Accept: "*/*", "sec-fetch-mode": "cors" },
      }),
      fromApp,
      deps,
    );
    expect(vi.mocked(deps.fetch).mock.calls[0]?.[1]?.headers).toEqual({ accept: "*/*" });
  });
});

describe("Referer, Origin y User-Agent", () => {
  it("se instalan como regla antes del fetch y se retiran al terminar", async () => {
    const order: string[] = [];
    const { deps, apply, release } = makeDeps();
    apply.mockImplementation(async () => {
      order.push("regla");
      return async () => {
        order.push("retirada");
      };
    });
    vi.mocked(deps.fetch).mockImplementation(async () => {
      order.push("fetch");
      return response("ok", { headers: { "content-type": "text/plain" } });
    });
    await handleMessage(
      http({ headers: { Referer: "https://sitio.org/", Accept: "*/*" } }),
      fromApp,
      deps,
    );
    expect(apply).toHaveBeenCalledWith("https://sitio.org/lista?p=1", {
      referer: "https://sitio.org/",
    });
    expect(vi.mocked(deps.fetch).mock.calls[0]?.[1]?.headers).toEqual({ accept: "*/*" });
    expect(order).toEqual(["regla", "fetch", "retirada"]);
    expect(release).not.toHaveBeenCalled(); // se usó la implementación de arriba
  });

  it("la regla se retira aunque el fetch falle", async () => {
    const { deps, release } = makeDeps({
      fetch: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    const reply = await handleMessage(
      http({ headers: { referer: "https://sitio.org/" } }),
      fromApp,
      deps,
    );
    expect(reply).toMatchObject({ type: "error", code: "NETWORK" });
    expect(release).toHaveBeenCalledOnce();
  });

  it("si no se puede instalar la regla, error interno y sin petición", async () => {
    const { deps, fetchMock } = makeDeps({
      headerRules: {
        apply: async () => {
          throw new Error("limite de reglas");
        },
        reset: async () => {},
      },
    });
    const reply = await handleMessage(
      http({ headers: { referer: "https://sitio.org/" } }),
      fromApp,
      deps,
    );
    expect(reply).toMatchObject({ type: "error", code: "INTERNAL" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("fallos de red", () => {
  it("un fallo de red es NETWORK y menciona el host, no la URL completa", async () => {
    const { deps } = makeDeps({
      fetch: async () => {
        throw new TypeError("Failed to fetch");
      },
    });
    const reply = await handleMessage(
      http({ url: "https://sitio.org/x?token=secreto" }),
      fromApp,
      deps,
    );
    expect(reply).toMatchObject({ type: "error", code: "NETWORK" });
    expect(JSON.stringify(reply)).not.toContain("secreto");
    expect(JSON.stringify(reply)).toContain("sitio.org");
  });

  it("pasado el tiempo límite aborta y responde TIMEOUT", async () => {
    const { deps } = makeDeps({
      timeoutMs: 20,
      fetch: (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    });
    expect(await handleMessage(http(), fromApp, deps)).toMatchObject({
      type: "error",
      code: "TIMEOUT",
    });
  });

  it("un fallo inesperado es INTERNAL", async () => {
    const { deps } = makeDeps({
      fetch: async () => {
        throw new RangeError("raro");
      },
    });
    expect(await handleMessage(http(), fromApp, deps)).toMatchObject({
      type: "error",
      code: "INTERNAL",
    });
  });
});
