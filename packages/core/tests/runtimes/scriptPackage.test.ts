import { describe, expect, it } from "vitest";

import type { ModuleApi, ModuleManifest } from "../../src/contract/types";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FakeScriptLoader, FixedClock, StubHttp } from "../../src/ports/fakes";
import { createModuleApi } from "../../src/runtimes/ModuleRuntime";

/**
 * R1 (ADR-0003, D1-A) — el puerto `ScriptLoader` recibe el **paquete completo**
 * (ruta → texto) y la ruta de entrada, no solo el texto de la entrada: así el
 * cargador de plataforma puede resolver los `import` relativos dentro del
 * paquete (los módulos publicados son ES multi-archivo).
 */

const ENTRY = "module.js";
const PACKAGE: Record<string, string> = {
  "module.js": 'import { helper } from "./bin/util.js"; export default function create(host) { return api; }',
  "bin/util.js": "export const helper = 1;",
};

function scriptManifest(): ModuleManifest {
  return {
    id: "ejemplo",
    name: "Ejemplo",
    version: "1.0.0",
    runtime: "script",
    entry: ENTRY,
    baseUrl: "https://sitio.test/",
    permissions: { domains: ["sitio.test"] },
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
  } as ModuleManifest;
}

const api: ModuleApi = {
  search: async () => ({ items: [], hasNext: false }),
  details: async (id) => ({
    id,
    title: "Serie",
    genres: [],
    status: "unknown",
    altTitles: [],
    extra: {},
    chapters: [],
  }),
  pages: async () => ({ images: [] }),
};

describe("ScriptLoader por paquete (R1)", () => {
  it("load recibe todos los archivos del paquete y la ruta de entrada", async () => {
    const loader = new FakeScriptLoader({ [ENTRY]: () => api });
    const host = new ModuleHost({
      http: new StubHttp(),
      clock: new FixedClock(0),
      permissions: { domains: ["sitio.test"] },
    });

    const handle = await createModuleApi({
      manifest: scriptManifest(),
      entry: ENTRY,
      files: PACKAGE,
      host,
      loader,
    });

    expect(loader.loaded).toEqual([ENTRY]);
    expect(loader.loadedFiles).toEqual([PACKAGE]);
    await expect(handle.api.search("x", 1)).resolves.toEqual({ items: [], hasNext: false });
  });

  it("sin `files`, el paquete degenera a solo la entrada (compatibilidad)", async () => {
    const loader = new FakeScriptLoader({ [ENTRY]: () => api });
    const host = new ModuleHost({
      http: new StubHttp(),
      clock: new FixedClock(0),
      permissions: { domains: ["sitio.test"] },
    });

    await createModuleApi({ manifest: scriptManifest(), entry: ENTRY, host, loader });
    expect(loader.loadedFiles).toEqual([{ [ENTRY]: ENTRY }]);
  });
});
