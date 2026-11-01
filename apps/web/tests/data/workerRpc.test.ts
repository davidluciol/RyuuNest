import { describe, expect, it } from "vitest";

import {
  createHandleRegistry,
  createRpcEndpoint,
  dispatchHandleCall,
  serializeError,
  wrapRemote,
} from "../../src/data/workerRpc";

/**
 * F25 — códec RPC entre el hilo principal y el Web Worker del módulo (SPEC
 * §10): los objetos con métodos (el `Host`, las respuestas) no se pueden
 * clonar, así que cruzan la frontera como «handles» y cada lado envuelve el
 * handle en un proxy cuyas llamadas vuelven por RPC. Se prueba en Node con un
 * par de endpoints en bucle (sin Worker real).
 */

function loopback() {
  const registry = createHandleRegistry();
  const main = createRpcEndpoint((message) => queueMicrotask(() => worker.handleMessage(message)));
  const worker = createRpcEndpoint((message) => queueMicrotask(() => main.handleMessage(message)));
  // El lado principal atiende las llamadas al host registradas por handle.
  main.setRequestHandler(async (type, payload) => {
    if (type !== "host-call") throw new Error(`Tipo inesperado: ${type}`);
    return dispatchHandleCall(
      registry,
      payload.handle as string,
      payload.prop as string,
      (payload.args as unknown[]) ?? [],
    );
  });
  return { registry, main, worker };
}

interface FakeHost {
  fetch(url: string): Promise<{ status: number; url: string; text(): Promise<string> }>;
  settings: { get(key: string): string | undefined; set(key: string, value: string): void };
}

function fakeHost(): FakeHost {
  const settings: Record<string, string> = {};
  return {
    fetch: async (url) => ({ status: 200, url, text: async () => `cuerpo de ${url}` }),
    settings: {
      get: (key) => settings[key],
      set: (key, value) => {
        settings[key] = value;
      },
    },
  };
}

describe("workerRpc (handles + proxies por RPC)", () => {
  it("una llamada al host cruza la frontera y vuelve con el resultado envuelto", async () => {
    const { registry, main, worker } = loopback();
    let factory: ((host: unknown) => unknown) | undefined;
    let api: Record<string, (...args: unknown[]) => unknown> | undefined;
    worker.setRequestHandler(async (type, payload) => {
      if (type === "load") {
        factory = payload.factory as (host: unknown) => unknown;
        return;
      }
      if (type === "create") {
        // Como en moduleWorker.ts: settings es local del worker (en memoria, ADR-0003).
        const settingsLocal: Record<string, string> = {};
        const remote = wrapRemote({ __handle: payload.hostHandle }, (handle, prop, args) =>
          worker.call("host-call", { handle, prop, args }),
        ) as Record<string, unknown>;
        const host = new Proxy(remote, {
          get(target, prop) {
            if (prop === "settings") {
              return {
                get: (key: string) => settingsLocal[key],
                set: (key: string, value: string) => {
                  settingsLocal[key] = value;
                },
              };
            }
            return target[prop as string];
          },
        });
        api = (await (factory as (h: unknown) => unknown)(host)) as Record<string, (...a: unknown[]) => unknown>;
        return;
      }
      if (type === "call") {
        return await api?.[payload.method as string]?.(...((payload.args as unknown[]) ?? []));
      }
      throw new Error(`Tipo desconocido: ${type}`);
    });

    const host = fakeHost();
    // load/create/call viajan del principal al worker; host-call, al revés.
    await main.call("load", {
      factory: (h: unknown) => ({
        search: async (query: string) => {
          const response = (await (h as FakeHost).fetch(`https://x.test/${query}`)) as {
            text(): Promise<string>;
          };
          const body = await response.text();
          // settings es síncrono y local del worker (en memoria, ADR-0003).
          (h as FakeHost).settings.set("tema", "dragon-night");
          const tema = (h as FakeHost).settings.get("tema");
          return { items: [{ id: query }], hasNext: false, body, tema };
        },
      }),
    });
    await main.call("create", { hostHandle: registry.register(host) });

    const apiProxy = wrapRemote({ __handle: "api" }, (_handle, prop, args) =>
      main.call("call", { method: prop, args }),
    ) as { search(query: string): Promise<unknown> };
    const result = (await apiProxy.search("dragon")) as {
      body: string;
      tema: string;
      items: { id: string }[];
    };
    expect(result.items).toEqual([{ id: "dragon" }]);
    expect(result.body).toBe("cuerpo de https://x.test/dragon");
    expect(result.tema).toBe("dragon-night");
  });

  it("un error del módulo cruza con su code y el principal puede reconstruir ModuleError", async () => {
    const { main, worker } = loopback();
    worker.setRequestHandler(async (type) => {
      if (type === "call") throw Object.assign(new Error("bloqueado por el sitio"), { code: "BLOCKED" });
      throw new Error("x");
    });
    const error = await main.call("call", { method: "search", args: [] }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("bloqueado por el sitio");
    expect((error as { code?: string }).code).toBe("BLOCKED");
    expect(serializeError(error)).toMatchObject({ message: "bloqueado por el sitio", code: "BLOCKED" });
  });

  it("encode: los objetos y funciones salen como handle; los primitivos y arrays pasan", () => {
    const registry = createHandleRegistry();
    const fn = () => 1;
    expect(registry.encode("texto")).toBe("texto");
    expect(registry.encode(42)).toBe(42);
    expect(registry.encode(null)).toBe(null);
    expect(registry.encode([1, "a"])).toEqual([1, "a"]);
    const handle = registry.encode(fn);
    expect(handle).toEqual({ __handle: expect.stringMatching(/^h\d+$/) });
    expect(registry.get((handle as { __handle: string }).__handle)).toBe(fn);
    const nested = registry.encode({ a: [fn] });
    expect(nested).toEqual({ __handle: expect.any(String) });
  });
});
