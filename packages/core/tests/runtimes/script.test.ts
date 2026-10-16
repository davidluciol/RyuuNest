import { describe, expect, it } from "vitest";

import type {
  ChapterPages,
  ModuleApi,
  Page,
  SeriesDetails,
  SeriesSummary,
} from "../../src/contract/types";
import { ModuleError } from "../../src/contract/errors";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FakeScriptLoader, FixedClock, StubHttp } from "../../src/ports/fakes";
import type { ScriptFactory } from "../../src/ports/scriptLoader";
import { ScriptRuntime } from "../../src/runtimes/ScriptRuntime";

/**
 * Runtime de módulos script (SPEC §6.5, T18).
 *
 * El módulo exporta una fábrica `create(host)`. El núcleo le pasa **solo** el `Host`
 * (permisos, tiempo límite y concurrencia los aplica el host); la carga del código
 * entra inyectada por el puerto `ScriptLoader` (la implementación de plataforma es del
 * cliente). Limitación conocida (D-5): **no hay aislamiento real** en la v1; el
 * «sandbox» es solo la frontera de API que se le entrega al módulo.
 */

const SOURCE = "export default function create(host) { /* … */ }";

function makeHost(http: StubHttp = new StubHttp()): ModuleHost {
  return new ModuleHost({
    http,
    clock: new FixedClock(0),
    permissions: { domains: ["sitio-html.test"] },
    minDelayMs: 0,
    timeoutMs: 1_000,
  });
}

/** Módulo de ejemplo que cumple el contrato sin tocar la red. */
function sampleApi(): ModuleApi {
  return {
    search: async (query: string, page: number): Promise<Page<SeriesSummary>> => ({
      items: [{ id: `${query}-${page}`, title: "Serie" }],
      hasNext: false,
    }),
    details: async (seriesId: string): Promise<SeriesDetails> => ({
      id: seriesId,
      title: "Serie",
      genres: [],
      status: "unknown",
      altTitles: [],
      extra: {},
      chapters: [],
    }),
    pages: async (): Promise<ChapterPages> => ({
      images: [{ url: "https://sitio-html.test/a.png" }],
    }),
  };
}

function makeRuntime(
  loader: FakeScriptLoader,
  host: ModuleHost = makeHost(),
  source: string = SOURCE,
): ScriptRuntime {
  return new ScriptRuntime({ host, loader, source });
}

describe("ScriptRuntime · carga", () => {
  it("carga el módulo y devuelve una ModuleApi válida", async () => {
    const loader = new FakeScriptLoader({ [SOURCE]: sampleApi });
    const api = await makeRuntime(loader).createApi();

    const page = await api.search("dragon", 1);
    expect(page.items).toEqual([{ id: "dragon-1", title: "Serie" }]);
    expect(page.hasNext).toBe(false);
    await expect(api.pages("ch-1", "r-oficial")).resolves.toEqual({
      images: [{ url: "https://sitio-html.test/a.png" }],
    });
  });

  it("el loader recibe el código fuente del módulo", async () => {
    const loader = new FakeScriptLoader({ [SOURCE]: sampleApi });
    await makeRuntime(loader).createApi();

    expect(loader.loaded).toEqual([SOURCE]);
  });

  it("pasa el host al módulo y solo el host (frontera D-5)", async () => {
    const host = makeHost();
    const received: unknown[][] = [];
    const factory = (...args: unknown[]): ModuleApi => {
      received.push(args);
      return sampleApi();
    };
    const loader = new FakeScriptLoader({ [SOURCE]: factory });

    await makeRuntime(loader, host).createApi();

    expect(received).toHaveLength(1);
    expect(received[0]).toHaveLength(1);
    expect(received[0]?.[0]).toBe(host);
  });

  it("no define popular/latest si el módulo no los trae", async () => {
    const loader = new FakeScriptLoader({ [SOURCE]: sampleApi });
    const api = await makeRuntime(loader).createApi();

    expect(api.popular).toBeUndefined();
    expect(api.latest).toBeUndefined();
  });

  it("define popular/latest si el módulo los implementa", async () => {
    const factory: ScriptFactory = () => ({
      ...sampleApi(),
      popular: async () => ({ items: [], hasNext: false }),
      latest: async () => ({ items: [], hasNext: false }),
    });
    const loader = new FakeScriptLoader({ [SOURCE]: factory });
    const api = await makeRuntime(loader).createApi();

    expect(typeof api.popular).toBe("function");
    expect(typeof api.latest).toBe("function");
  });
});

describe("ScriptRuntime · frontera del host", () => {
  it("un host.fetch a un dominio no permitido falla con UNSUPPORTED", async () => {
    const factory: ScriptFactory = (host) => ({
      search: async () => ({ items: [], hasNext: false }),
      details: async (seriesId) => {
        await host.fetch("https://otro.test/serie/x");
        throw new Error(`no debería llegar aquí (${seriesId})`);
      },
      pages: async () => ({ images: [] }),
    });
    const loader = new FakeScriptLoader({ [SOURCE]: factory });
    const api = await makeRuntime(loader).createApi();

    const error = await api.details("x").then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("UNSUPPORTED");
  });
});

describe("ScriptRuntime · errores", () => {
  it("un throw normal del módulo se convierte en ModuleError INTERNAL", async () => {
    const factory: ScriptFactory = () => ({
      ...sampleApi(),
      search: async () => {
        throw new Error("boom");
      },
    });
    const loader = new FakeScriptLoader({ [SOURCE]: factory });
    const api = await makeRuntime(loader).createApi();

    const error = await api.search("x", 1).then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("INTERNAL");
    expect((error as ModuleError).message).toBe("boom");
  });

  it("un ModuleError del módulo conserva su código y su detalle", async () => {
    const factory: ScriptFactory = () => ({
      ...sampleApi(),
      details: async () => {
        throw new ModuleError("PARSE", "selector roto", { selector: "h1.x" });
      },
    });
    const loader = new FakeScriptLoader({ [SOURCE]: factory });
    const api = await makeRuntime(loader).createApi();

    const error = await api.details("x").then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
    expect((error as ModuleError).details?.selector).toBe("h1.x");
  });

  it("un módulo que no implementa search() no monta una API", async () => {
    const factory: ScriptFactory = () => ({}) as ModuleApi;
    const loader = new FakeScriptLoader({ [SOURCE]: factory });

    const error = await makeRuntime(loader)
      .createApi()
      .then(
        () => undefined,
        (thrown: unknown) => thrown,
      );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("INTERNAL");
    expect((error as ModuleError).message).toContain("search");
  });

  it("una fábrica que lanza al construirse no propaga un error crudo", async () => {
    const factory = (() => {
      throw new Error("no arranca");
    }) as ScriptFactory;
    const loader = new FakeScriptLoader({ [SOURCE]: factory });

    const error = await makeRuntime(loader)
      .createApi()
      .then(
        () => undefined,
        (thrown: unknown) => thrown,
      );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("INTERNAL");
    expect((error as ModuleError).message).toBe("no arranca");
  });

  it("un fallo del loader no propaga un error crudo", async () => {
    const loader = new FakeScriptLoader();

    const error = await makeRuntime(loader)
      .createApi()
      .then(
        () => undefined,
        (thrown: unknown) => thrown,
      );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("INTERNAL");
  });
});
