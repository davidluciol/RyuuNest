import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import type {
  Host,
  ModuleApi,
  ModuleManifest,
  Page,
  SeriesDetails,
  SeriesSummary,
} from "../../src/contract/types";
import { FakeScriptLoader } from "../../src/ports/fakes";
import type { ScriptFactory } from "../../src/ports/scriptLoader";
import { createModuleApi } from "../../src/runtimes/ModuleRuntime";

/**
 * Validación de la forma mínima del contrato en `guardApi` (T37, R4 del ADR-0003).
 *
 * El runtime `script` devuelve lo que entrega el módulo sin comprobarlo (`as R`): una
 * forma incorrecta rompía pantallas en vez de llegar como `PARSE` (SPEC §6.2: «en
 * runtime la app valida la forma mínima y un módulo que devuelve otra cosa recibe
 * PARSE»). Aquí se comprueba el camino real: cada caso monta un módulo script con
 * `FakeScriptLoader` y llama por la API guardada de `createModuleApi`, que es la que
 * usa la app con los módulos instalados.
 */

const SOURCE = "export default function create(host) { /* … */ }";

const noopHost = {} as Host;

function scriptManifest(): ModuleManifest {
  return {
    id: "ejemplo",
    name: "Ejemplo",
    version: "1.0.0",
    apiVersion: 1,
    runtime: "script",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    baseUrl: "https://sitio.test",
    capabilities: ["search"],
    permissions: { domains: ["sitio.test"] },
    entry: "module.js",
  };
}

/** Monta `api` como si fuera un módulo script instalado y devuelve la API guardada. */
async function mountGuarded(api: ModuleApi) {
  const factory: ScriptFactory = () => api;
  return createModuleApi({
    manifest: scriptManifest(),
    entry: SOURCE,
    host: noopHost,
    loader: new FakeScriptLoader({ "module.js": factory }),
  });
}

/** Devuelve lo que rechaza la promesa (o `undefined` si resolvió). */
async function rejection(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => undefined,
    (error: unknown) => error,
  );
}

/** Ficha mínima válida, para mutar un campo en cada caso. */
function validDetails(): SeriesDetails {
  return {
    id: "/serie/uno",
    title: "Serie uno",
    genres: ["Acción"],
    status: "ongoing",
    altTitles: [],
    extra: {},
    chapters: [
      {
        id: "Capítulo 1",
        title: "Capítulo 1",
        number: 1,
        releases: [{ id: "/view/1", group: "Grupo", publishedAt: "2026-05-27" }],
      },
    ],
  };
}

/** Módulo que cumple el contrato; cada caso sobrescribe solo el método que rompe. */
function compliantApi(overrides: Record<string, unknown> = {}): ModuleApi {
  const api: Record<string, unknown> = {
    popular: async () => ({ items: [], hasNext: false }),
    latest: async () => ({ items: [], hasNext: false }),
    search: async (): Promise<Page<SeriesSummary>> => ({
      items: [{ id: "/serie/uno", title: "Serie uno" }],
      hasNext: false,
    }),
    details: async (): Promise<SeriesDetails> => validDetails(),
    pages: async () => ({ images: [{ url: "https://sitio.test/1.svg" }] }),
    ...overrides,
  };
  return api as unknown as ModuleApi;
}

/** Copia el objeto sin una clave, para mutar la ficha válida en cada caso. */
function withoutKey(value: object, key: string): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...value };
  delete copy[key];
  return copy;
}

/** Lo que rechaza `search` con `overrides`, ya como `ModuleError` (o `undefined`). */
async function guardedRejection(
  overrides: Record<string, unknown>,
): Promise<ModuleError | undefined> {
  const handle = await mountGuarded(compliantApi(overrides));
  const error = await rejection(handle.api.search("x", 1));
  return error as ModuleError | undefined;
}

describe("guardApi · forma mínima del contrato (T37, R4)", () => {
  it("acepta una Page correcta y la devuelve intacta", async () => {
    const page: Page<SeriesSummary> = {
      items: [{ id: "/serie/uno", title: "Serie uno", badges: ["Seinen"] }],
      hasNext: true,
    };
    const handle = await mountGuarded(compliantApi({ search: async () => page }));

    await expect(handle.api.search("uno", 1)).resolves.toEqual(page);
    expect(handle.lastError()).toBeUndefined();
  });

  it("acepta una Page vacía: una lista sin resultados es una forma válida", async () => {
    const handle = await mountGuarded(compliantApi());

    await expect(handle.api.popular?.(2)).resolves.toEqual({ items: [], hasNext: false });
    expect(handle.lastError()).toBeUndefined();
  });

  it("rechaza con PARSE una Page a la que falta un campo obligatorio", async () => {
    const sinItems = await guardedRejection({ search: async () => ({ hasNext: false }) });
    const sinHasNext = await guardedRejection({ search: async () => ({ items: [] }) });

    expect(sinItems).toBeInstanceOf(ModuleError);
    expect(sinItems?.code).toBe("PARSE");
    expect(sinItems?.message).toContain("search()");
    expect(sinItems?.message).toContain("«items»");
    expect(sinHasNext).toBeInstanceOf(ModuleError);
    expect(sinHasNext?.code).toBe("PARSE");
    expect(sinHasNext?.message).toContain("«hasNext»");
  });

  it("rechaza con PARSE un resumen sin id o con el título vacío", async () => {
    const sinId = await guardedRejection({
      search: async () => ({ items: [{ title: "Serie uno" }], hasNext: false }),
    });
    const tituloVacio = await guardedRejection({
      search: async () => ({ items: [{ id: "/serie/uno", title: "" }], hasNext: false }),
    });

    expect(sinId?.code).toBe("PARSE");
    expect(sinId?.message).toContain("«items[0].id»");
    expect(tituloVacio?.code).toBe("PARSE");
    expect(tituloVacio?.message).toContain("«items[0].title»");
  });

  it("también valida popular() y latest() cuando el módulo las trae", async () => {
    const handle = await mountGuarded(
      compliantApi({ popular: async () => ({ items: "roto", hasNext: false }) }),
    );

    const error = (await rejection(handle.api.popular?.(1) ?? Promise.resolve())) as ModuleError;

    expect(error).toBeInstanceOf(ModuleError);
    expect(error.code).toBe("PARSE");
    expect(error.message).toContain("popular()");
  });

  it("acepta una ficha sin capítulos y con campos extra (related y desconocidos)", async () => {
    const details = {
      ...validDetails(),
      chapters: [],
      related: [{ id: "/serie/dos", title: "Serie dos" }],
      campoDesconocido: 42,
    };
    const handle = await mountGuarded(compliantApi({ details: async () => details }));

    await expect(handle.api.details("/serie/uno")).resolves.toEqual(details);
    expect(handle.lastError()).toBeUndefined();
  });

  it("acepta ids opacos con «?» y «=» (SPEC §6.2: cadenas opacas)", async () => {
    const details = {
      ...validDetails(),
      id: "/series.php?id=482",
      chapters: [
        {
          id: "Capítulo 1",
          title: "Capítulo 1",
          releases: [{ id: "/series.php?id=482&chapter=64.5" }],
        },
      ],
    };
    const handle = await mountGuarded(compliantApi({ details: async () => details }));

    await expect(handle.api.details("/series.php?id=482")).resolves.toEqual(details);
    expect(handle.lastError()).toBeUndefined();
  });

  it("rechaza con PARSE una ficha a la que falta un campo obligatorio", async () => {
    const sinGenres = withoutKey(validDetails(), "genres");
    const sinAltTitles = withoutKey(validDetails(), "altTitles");
    const extraLista = { ...validDetails(), extra: ["no"] };
    const statusNumero = { ...validDetails(), status: 3 };

    const fallos = [
      await guardedRejectionDetails(sinGenres),
      await guardedRejectionDetails(sinAltTitles),
      await guardedRejectionDetails(extraLista),
      await guardedRejectionDetails(statusNumero),
    ];

    for (const fallo of fallos) {
      expect(fallo).toBeInstanceOf(ModuleError);
      expect(fallo?.code).toBe("PARSE");
    }
    expect(fallos[0]?.message).toContain("«genres»");
    expect(fallos[1]?.message).toContain("«altTitles»");
    expect(fallos[2]?.message).toContain("«extra»");
    expect(fallos[3]?.message).toContain("«status»");
  });

  it("rechaza con PARSE un capítulo o release mal formados", async () => {
    const sinReleases = {
      ...validDetails(),
      chapters: [{ id: "Capítulo 1", title: "Capítulo 1", releases: [] }],
    };
    const releaseVacia = {
      ...validDetails(),
      chapters: [{ id: "Capítulo 1", title: "Capítulo 1", releases: [{ id: "" }] }],
    };
    const tituloVacio = {
      ...validDetails(),
      chapters: [{ id: "Capítulo 1", title: "", releases: [{ id: "/view/1" }] }],
    };

    const fallos = [
      await guardedRejectionDetails(sinReleases),
      await guardedRejectionDetails(releaseVacia),
      await guardedRejectionDetails(tituloVacio),
    ];

    for (const fallo of fallos) {
      expect(fallo?.code).toBe("PARSE");
    }
    expect(fallos[0]?.message).toContain("«chapters[0].releases»");
    expect(fallos[1]?.message).toContain("«chapters[0].releases[0].id»");
    expect(fallos[2]?.message).toContain("«chapters[0].title»");
  });

  it("rechaza con PARSE unas páginas sin imágenes o con una imagen sin url", async () => {
    const handleVacio = await mountGuarded(compliantApi({ pages: async () => ({ images: [] }) }));
    const handleSinUrl = await mountGuarded(
      compliantApi({ pages: async () => ({ images: [{ headers: {} }] }) }),
    );

    const vacio = (await rejection(handleVacio.api.pages("ch-1", "r-1"))) as ModuleError;
    const sinUrl = (await rejection(handleSinUrl.api.pages("ch-1", "r-1"))) as ModuleError;

    expect(vacio.code).toBe("PARSE");
    expect(vacio.message).toContain("«images»");
    expect(sinUrl.code).toBe("PARSE");
    expect(sinUrl.message).toContain("«images[0].url»");
  });

  it("rechaza con PARSE los valores que no son objetos", async () => {
    const handleNulo = await mountGuarded(compliantApi({ search: async () => null }));
    const handleTexto = await mountGuarded(compliantApi({ pages: async () => "roto" }));

    const nulo = (await rejection(handleNulo.api.search("x", 1))) as ModuleError;
    const texto = (await rejection(handleTexto.api.pages("ch-1", "r-1"))) as ModuleError;

    expect(nulo.code).toBe("PARSE");
    expect(texto.code).toBe("PARSE");
  });

  it("el fallo de forma queda anotado en lastError", async () => {
    const handle = await mountGuarded(
      compliantApi({ search: async () => ({ items: "roto", hasNext: false }) }),
    );

    const error = (await rejection(handle.api.search("x", 1))) as ModuleError;

    expect(handle.lastError()).toBe(error);
    expect(handle.lastError()?.code).toBe("PARSE");
  });
});

/** Lo que rechaza `details` con la ficha mutada, ya como `ModuleError` (o `undefined`). */
async function guardedRejectionDetails(details: unknown): Promise<ModuleError | undefined> {
  const handle = await mountGuarded(compliantApi({ details: async () => details }));
  const error = await rejection(handle.api.details("/serie/uno"));
  return error as ModuleError | undefined;
}
