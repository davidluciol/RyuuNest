import { describe, expect, it } from "vitest";

import type { ModuleApi, ModuleManifest } from "../../src/contract/types";
import { ModuleError } from "../../src/contract/errors";
import { ModuleHost } from "../../src/host/ModuleHost";
import type { Clock } from "../../src/ports/clock";
import { FakeScriptLoader, StubHttp } from "../../src/ports/fakes";
import type { Http, HttpResponse } from "../../src/ports/http";
import type { ScriptFactory } from "../../src/ports/scriptLoader";
import { createModuleApi } from "../../src/runtimes/ModuleRuntime";

/**
 * T34 — pruebas de resiliencia (SPEC §6.5, §6.4 y RNF-8): un módulo que cuelga o
 * lanza no tumba el núcleo, el fallo queda en `last_error` y se puede reintentar
 * sin reiniciar; el rate-limit por dominio se respeta también bajo carga.
 *
 * Estrategia de timers: retardos reales cortos (20–60 ms) con holgura en las
 * aserciones, igual que `tests/host/host.test.ts` (decisión del humano, 2026-11-01).
 */

const realClock: Clock = { now: () => Date.now() };

/** `Http` que cuelga en la primera llamada y responde al instante después. */
class HangingOnceHttp implements Http {
  calls = 0;

  async request(_url: string): Promise<HttpResponse> {
    this.calls += 1;
    if (this.calls === 1) {
      await new Promise<void>(() => {});
    }
    return {
      status: 200,
      headers: {},
      text: async () => "ok",
      bytes: async () => new Uint8Array(),
    };
  }
}

/** `Http` que responde al instante y anota el instante real de cada inicio. */
class InstantHttp implements Http {
  readonly starts: number[] = [];

  async request(_url: string): Promise<HttpResponse> {
    this.starts.push(Date.now());
    return {
      status: 200,
      headers: {},
      text: async () => "ok",
      bytes: async () => new Uint8Array(),
    };
  }
}

function makeHost(
  http: Http,
  overrides: Partial<ConstructorParameters<typeof ModuleHost>[0]> = {},
): ModuleHost {
  return new ModuleHost({
    http,
    clock: realClock,
    permissions: { domains: ["ejemplo.com"] },
    timeoutMs: 2_000,
    maxConcurrent: 4,
    minDelayMs: 0,
    ...overrides,
  });
}

async function capture(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
}

const SCRIPT_MANIFEST: ModuleManifest = {
  id: "modulo-roto",
  name: "Módulo roto",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "script",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  baseUrl: "https://ejemplo.com/",
  capabilities: ["popular", "latest", "search"],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.js",
};

function mountingHost(): ModuleHost {
  return makeHost(new StubHttp());
}

describe("resiliencia · un módulo que cuelga no bloquea el núcleo (T34)", () => {
  it("produce TIMEOUT y después el host acepta otra petición (el slot quedó libre)", async () => {
    const http = new HangingOnceHttp();
    // maxConcurrent 1: si el TIMEOUT no liberara el slot, la segunda petición
    // quedaría esperando para siempre y el test agotaría su tiempo.
    const host = makeHost(http, { timeoutMs: 30, maxConcurrent: 1 });

    const first = await capture(host.fetch("https://ejemplo.com/lento"));
    expect(first).toBeInstanceOf(ModuleError);
    expect((first as ModuleError).code).toBe("TIMEOUT");

    const second = await host.fetch("https://ejemplo.com/rapido");
    expect(second.status).toBe(200);
    expect(await second.text()).toBe("ok");
    expect(http.calls).toBe(2);
  });
});

describe("resiliencia · excepciones del módulo contenidas con last_error (T34)", () => {
  it("un error tipado del módulo sale como ModuleError y queda en lastError()", async () => {
    const factory: ScriptFactory = (): ModuleApi => ({
      search: async () => {
        throw Object.assign(new Error("protegido"), {
          name: "ModuleError",
          code: "BLOCKED",
          details: { status: 403 },
        });
      },
      details: async (id) => ({
        id,
        title: "Serie",
        genres: [],
        altTitles: [],
        status: "unknown",
        extra: {},
        chapters: [],
      }),
      pages: async () => ({ images: [{ url: "https://ejemplo.com/i.png" }] }),
    });

    const handle = await createModuleApi({
      manifest: SCRIPT_MANIFEST,
      entry: "index.js",
      files: { "index.js": "// roto" },
      host: mountingHost(),
      loader: new FakeScriptLoader({ "index.js": factory }),
    });

    const blocked = await capture(handle.api.search("x", 1));
    expect(blocked).toBeInstanceOf(ModuleError);
    expect((blocked as ModuleError).code).toBe("BLOCKED");
    expect(handle.lastError()?.code).toBe("BLOCKED");

    const plain = await capture(handle.api.details("x"));
    expect(plain).toBeUndefined(); // details no lanza en esta fábrica
    expect(handle.lastError()?.code).toBe("BLOCKED"); // el último error se conserva
  });

  it("un error sin forma de contrato cae en INTERNAL y también se anota", async () => {
    const factory: ScriptFactory = (): ModuleApi => ({
      search: async () => {
        throw new Error("fallo suelto");
      },
      details: async (id) => ({
        id,
        title: "Serie",
        genres: [],
        altTitles: [],
        status: "unknown",
        extra: {},
        chapters: [],
      }),
      pages: async () => ({ images: [{ url: "https://ejemplo.com/i.png" }] }),
    });

    const handle = await createModuleApi({
      manifest: SCRIPT_MANIFEST,
      entry: "index.js",
      files: { "index.js": "// roto" },
      host: mountingHost(),
      loader: new FakeScriptLoader({ "index.js": factory }),
    });

    const error = await capture(handle.api.search("x", 1));
    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("INTERNAL");
    expect(handle.lastError()?.code).toBe("INTERNAL");
  });
});

describe("resiliencia · reintento manual sin reiniciar (T34)", () => {
  it("tras un fallo contenido, llamar de nuevo funciona", async () => {
    let calls = 0;
    const flaky: ScriptFactory = (): ModuleApi => ({
      search: async (query: string) => {
        calls += 1;
        if (calls === 1) {
          throw new Error("fallo transitorio");
        }
        return { items: [{ id: query, title: "Serie" }], hasNext: false };
      },
      details: async (id) => ({
        id,
        title: "Serie",
        genres: [],
        altTitles: [],
        status: "unknown",
        extra: {},
        chapters: [],
      }),
      pages: async () => ({ images: [{ url: "https://ejemplo.com/i.png" }] }),
    });

    const handle = await createModuleApi({
      manifest: SCRIPT_MANIFEST,
      entry: "index.js",
      files: { "index.js": "// inestable" },
      host: mountingHost(),
      loader: new FakeScriptLoader({ "index.js": flaky }),
    });

    const first = await capture(handle.api.search("dragon", 1));
    expect(first).toBeInstanceOf(ModuleError);
    expect(handle.lastError()).toBeDefined();

    const second = await handle.api.search("dragon", 1);
    expect(calls).toBe(2);
    expect(second.items).toEqual([{ id: "dragon", title: "Serie" }]);
    expect(second.hasNext).toBe(false);
  });
});

describe("resiliencia · rate-limit por dominio bajo carga (T34)", () => {
  it("las peticiones concurrentes al mismo dominio se inician espaciadas al menos minDelayMs", async () => {
    const http = new InstantHttp();
    const minDelayMs = 50;
    const host = makeHost(http, { minDelayMs, maxConcurrent: 4 });

    await Promise.all([1, 2, 3, 4, 5, 6].map((n) => host.fetch(`https://ejemplo.com/${n}`)));

    const starts = [...http.starts].sort((a, b) => a - b);
    expect(starts).toHaveLength(6);
    for (let i = 1; i < starts.length; i += 1) {
      // 50 ms de pausa menos holgura de 10 ms para la precisión de los timers.
      expect(starts[i]! - starts[i - 1]!).toBeGreaterThanOrEqual(minDelayMs - 10);
    }
  });

  it("los dominios distintos no se bloquean entre sí", async () => {
    const http = new InstantHttp();
    const host = makeHost(http, {
      minDelayMs: 200,
      maxConcurrent: 4,
      permissions: { domains: ["ejemplo.com", "otro.test"] },
    });

    const inicio = Date.now();
    await Promise.all([host.fetch("https://ejemplo.com/a"), host.fetch("https://otro.test/b")]);
    const transcurrido = Date.now() - inicio;

    expect(http.starts).toHaveLength(2);
    // Si el segundo dominio esperara al rate-limit del primero, tardaría ≥ 200 ms.
    expect(transcurrido).toBeLessThan(150);
  });
});
