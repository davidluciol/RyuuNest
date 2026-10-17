import { describe, expect, it } from "vitest";

import type { ModuleApi, ModuleManifest } from "../../src/contract/types";
import { ModuleError } from "../../src/contract/errors";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FakeScriptLoader, FixedClock, StubHttp } from "../../src/ports/fakes";
import type { ScriptFactory } from "../../src/ports/scriptLoader";
import { DeclarativeRuntime } from "../../src/runtimes/DeclarativeRuntime";
import { ScriptRuntime } from "../../src/runtimes/ScriptRuntime";
import {
  createModuleApi,
  createModuleRuntime,
  type ModuleRuntime,
} from "../../src/runtimes/ModuleRuntime";

/**
 * Punto único de montaje de un módulo instalado (SPEC §5.4, T20).
 *
 * Elige el runtime por `manifest.runtime`, mapea los fallos a `ModuleErrorCode` y
 * contiene las excepciones del módulo: la app recibe siempre un `ModuleError` y puede
 * guardar el último en `module.last_error` (SPEC §8.1, RF-5).
 */

/** Sitio con una página de búsqueda y nada más (`/serie/x` responde 404). */
const BUSCAR_URL = "https://sitio.test/buscar?q=dragon&page=1";
const BUSCAR_HTML = [
  "<!doctype html><html><body>",
  '<ul class="lista">',
  '  <li class="item"><a href="/serie/serie-uno"><h3>Serie uno</h3></a></li>',
  "</ul>",
  "</body></html>",
].join("\n");

const DECLARATIVE_ENTRY = JSON.stringify({
  search: {
    url: "{baseUrl}/buscar?q={query}&page={page}",
    list: "li.item",
    fields: {
      id: { selector: "a", attr: "href", transform: ["path"] },
      title: { selector: "h3", transform: ["trim"] },
    },
    hasNext: { selector: "a.next", exists: true },
  },
  details: {
    url: "{baseUrl}/serie/{id}",
    fields: { title: { selector: "h1.titulo", transform: ["trim"] } },
    chapters: {
      list: "ul.caps > li.cap",
      fields: { id: { attr: "data-id" }, title: { selector: "span.titulo", transform: ["trim"] } },
      releases: { list: "ul.releases > li.release", fields: { id: { attr: "data-id" } } },
    },
  },
});

const SOURCE = "export default function create(host) { /* … */ }";

function makeHost(http: StubHttp = new StubHttp()): ModuleHost {
  return new ModuleHost({
    http,
    clock: new FixedClock(0),
    permissions: { domains: ["sitio.test"] },
    minDelayMs: 0,
    timeoutMs: 1_000,
  });
}

function makeHttp(): StubHttp {
  return new StubHttp({ [BUSCAR_URL]: { body: BUSCAR_HTML } });
}

function makeManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: "ejemplo",
    name: "Ejemplo",
    version: "1.0.0",
    apiVersion: 1,
    runtime: "declarative",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    baseUrl: "https://sitio.test",
    capabilities: ["search"],
    permissions: { domains: ["sitio.test"] },
    entry: "index.json",
    ...overrides,
  };
}

/** Módulo script que cumple el contrato sin tocar la red. */
function sampleApi(): ModuleApi {
  return {
    search: async () => ({ items: [{ id: "s-1", title: "Serie" }], hasNext: false }),
    details: async (seriesId) => ({
      id: seriesId,
      title: "Serie",
      genres: [],
      status: "unknown",
      altTitles: [],
      extra: {},
      chapters: [],
    }),
    pages: async () => ({ images: [{ url: "https://sitio.test/1.svg" }] }),
  };
}

describe("createModuleRuntime · selección por manifest.runtime", () => {
  it("monta el runtime declarativo para un manifest declarativo", () => {
    const runtime = createModuleRuntime({
      manifest: makeManifest(),
      entry: DECLARATIVE_ENTRY,
      host: makeHost(makeHttp()),
    });

    expect(runtime).toBeInstanceOf(DeclarativeRuntime);
  });

  it("monta el runtime script para un manifest script", () => {
    const runtime = createModuleRuntime({
      manifest: makeManifest({ runtime: "script", entry: "index.js" }),
      entry: SOURCE,
      host: makeHost(makeHttp()),
      loader: new FakeScriptLoader({ [SOURCE]: sampleApi }),
    });

    expect(runtime).toBeInstanceOf(ScriptRuntime);
  });

  it("los dos runtimes cumplen la interfaz común ModuleRuntime", () => {
    const runtimes: ModuleRuntime[] = [
      createModuleRuntime({ manifest: makeManifest(), entry: DECLARATIVE_ENTRY, host: makeHost() }),
      createModuleRuntime({
        manifest: makeManifest({ runtime: "script" }),
        entry: SOURCE,
        host: makeHost(),
        loader: new FakeScriptLoader({ [SOURCE]: sampleApi }),
      }),
    ];

    for (const runtime of runtimes) {
      expect(typeof runtime.createApi).toBe("function");
    }
  });

  it("un manifest script sin cargador falla con UNSUPPORTED", () => {
    const error = capture(() =>
      createModuleRuntime({
        manifest: makeManifest({ runtime: "script", entry: "index.js" }),
        entry: SOURCE,
        host: makeHost(),
      }),
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("UNSUPPORTED");
  });

  it("un index.json ilegible falla con PARSE", () => {
    const error = capture(() =>
      createModuleRuntime({
        manifest: makeManifest(),
        entry: "{ esto no es json",
        host: makeHost(),
      }),
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
  });

  it("un runtime desconocido falla con UNSUPPORTED", () => {
    const manifest = { ...makeManifest(), runtime: "wasm" } as unknown as ModuleManifest;
    const error = capture(() => createModuleRuntime({ manifest, entry: "", host: makeHost() }));

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("UNSUPPORTED");
  });
});

describe("createModuleApi · montaje y contención de fallos", () => {
  it("devuelve la API del módulo declarativo y sin fallo previo", async () => {
    const handle = await createModuleApi({
      manifest: makeManifest(),
      entry: DECLARATIVE_ENTRY,
      host: makeHost(makeHttp()),
    });

    const page = await handle.api.search("dragon", 1);

    expect(page.items).toEqual([{ id: "serie-uno", title: "Serie uno" }]);
    expect(handle.lastError()).toBeUndefined();
  });

  it("devuelve la API del módulo script cargada con el cargador", async () => {
    const loader = new FakeScriptLoader({ [SOURCE]: sampleApi });
    const handle = await createModuleApi({
      manifest: makeManifest({ runtime: "script", entry: "index.js" }),
      entry: SOURCE,
      host: makeHost(makeHttp()),
      loader,
    });

    await expect(handle.api.pages("ch-1", "r-1")).resolves.toEqual({
      images: [{ url: "https://sitio.test/1.svg" }],
    });
    expect(loader.loaded).toEqual([SOURCE]);
    expect(handle.lastError()).toBeUndefined();
  });

  it("un módulo que lanza en details() queda contenido y expone last_error", async () => {
    const factory: ScriptFactory = () => ({
      ...sampleApi(),
      details: async () => {
        throw new Error("boom");
      },
    });
    const handle = await createModuleApi({
      manifest: makeManifest({ runtime: "script", entry: "index.js" }),
      entry: SOURCE,
      host: makeHost(makeHttp()),
      loader: new FakeScriptLoader({ [SOURCE]: factory }),
    });

    const error = await handle.api.details("serie-uno").then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("INTERNAL");
    expect(handle.lastError()).toBe(error);
  });

  it("un estado 404 del sitio llega como NOT_FOUND por el mapeo central", async () => {
    const handle = await createModuleApi({
      manifest: makeManifest(),
      entry: DECLARATIVE_ENTRY,
      host: makeHost(makeHttp()),
    });

    const error = await handle.api.details("serie-uno").then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("NOT_FOUND");
    expect(handle.lastError()).toBe(error);
  });

  it("un módulo que no cumple el contrato no monta y falla con ModuleError", async () => {
    // Deliberadamente incompleto: no implementa `details()` ni `pages()`.
    const broken = (() => ({
      search: async () => ({ items: [], hasNext: false }),
    })) as unknown as ScriptFactory;

    const error = await createModuleApi({
      manifest: makeManifest({ runtime: "script", entry: "index.js" }),
      entry: SOURCE,
      host: makeHost(makeHttp()),
      loader: new FakeScriptLoader({ [SOURCE]: broken }),
    }).then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("INTERNAL");
  });
});

/** Ejecuta una función y devuelve lo que lanza (o `undefined`). */
function capture(run: () => unknown): unknown {
  try {
    run();
    return undefined;
  } catch (error) {
    return error;
  }
}
