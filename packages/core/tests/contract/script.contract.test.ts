import { describe, expect, it } from "vitest";

import {
  createHtmlSite,
  createJsonApiSite,
  createSiteHttp,
  EXAMPLE_DECLARATIVE,
  EXAMPLE_SCRIPT_ENTRY,
  EXAMPLE_SCRIPT_HTML,
  EXAMPLE_SCRIPT_JSON,
  HTML_SITE_BASE_URL,
  JSON_API_IMAGE_HEADERS,
  runContract,
  type TestSite,
} from "@ryuunest/test-site";

import type { ModuleApi } from "../../src/contract/types";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FakeScriptLoader, FixedClock } from "../../src/ports/fakes";
import type { ScriptFactory } from "../../src/ports/scriptLoader";
import { DeclarativeRuntime } from "../../src/runtimes/DeclarativeRuntime";
import { ScriptRuntime } from "../../src/runtimes/ScriptRuntime";

/**
 * E2E del módulo script de ejemplo contra los sitios falsos (T19).
 *
 * Es la prueba de generalidad del runtime script (SPEC §6.5): el mismo módulo de
 * ejemplo pasa el arnés de contrato (T10) sobre las **dos arquitecturas** de
 * `@ryuunest/test-site` —HTML con selectores (`host.html()`) y JSON con cursor— sin
 * tocar ningún sitio real. La carga del código entra por el puerto `ScriptLoader`
 * (T18); aquí se usa su doble, porque el núcleo no toca APIs de plataforma.
 */

const CAPABILITIES = ["popular", "latest", "search"] as const;

/** Host con el sitio falso detrás del puerto `Http` y su dominio permitido. */
function makeHost(site: TestSite): ModuleHost {
  return new ModuleHost({
    http: createSiteHttp(site),
    clock: new FixedClock(10_000),
    permissions: { domains: [new URL(site.origin).hostname] },
    minDelayMs: 0,
    timeoutMs: 2_000,
  });
}

/** Monta la `ModuleApi` del módulo script de ejemplo sobre un sitio falso. */
function makeScriptApi(site: TestSite, factory: ScriptFactory): Promise<ModuleApi> {
  return new ScriptRuntime({
    host: makeHost(site),
    loader: new FakeScriptLoader({ [EXAMPLE_SCRIPT_ENTRY]: factory }),
    source: EXAMPLE_SCRIPT_ENTRY,
  }).createApi();
}

/** Monta la `ModuleApi` declarativa de referencia (T17) sobre el sitio HTML. */
function makeDeclarativeApi(): ModuleApi {
  return new DeclarativeRuntime({
    config: EXAMPLE_DECLARATIVE,
    host: makeHost(createHtmlSite()),
    baseUrl: HTML_SITE_BASE_URL,
  }).createApi();
}

describe("script · contrato contra el sitio falso (T19)", () => {
  it("el módulo script (HTML) pasa el arnés con el mismo informe que el declarativo", async () => {
    const script = await makeScriptApi(createHtmlSite(), EXAMPLE_SCRIPT_HTML);
    const declarative = makeDeclarativeApi();

    const scriptReport = await runContract(script, { capabilities: [...CAPABILITIES] });
    const declarativeReport = await runContract(declarative, {
      capabilities: [...CAPABILITIES],
    });

    expect(scriptReport.methods).toEqual(["popular", "latest", "search", "details", "pages"]);
    expect(scriptReport).toEqual(declarativeReport);
  });

  it("el módulo script analiza las fixtures HTML con host.html()", async () => {
    const api = await makeScriptApi(createHtmlSite(), EXAMPLE_SCRIPT_HTML);

    const details = await api.details("dragon-de-ceniza");

    expect(details.title).toBe("El dragón de ceniza");
    expect(details.genres).toEqual(["Fantasía", "Aventura"]);
    expect(details.status).toBe("ongoing");
    expect(details.extra).toEqual({ Origen: "manhwa" });
    expect(details.chapters.map((chapter) => chapter.id)).toEqual(["ch-1", "ch-2", "ch-3"]);
    expect(details.chapters[0]?.releases.map((release) => release.id)).toEqual([
      "r-oficial",
      "r-alt",
    ]);
    expect(details.cover?.url).toBe(`${HTML_SITE_BASE_URL}/img/dragon-de-ceniza.svg`);
  });

  it("el módulo HTML no añade cabeceras a las imágenes si no las define", async () => {
    const api = await makeScriptApi(createHtmlSite(), EXAMPLE_SCRIPT_HTML);

    const pages = await api.pages("ch-1", "r-oficial");

    expect(pages.images.length).toBeGreaterThan(0);
    for (const image of pages.images) {
      expect(image.headers).toBeUndefined();
      expect(image.url.startsWith(`${HTML_SITE_BASE_URL}/img/`)).toBe(true);
    }
  });

  it("el módulo script (JSON con cursor) pasa el arnés con cabeceras en las imágenes", async () => {
    const api = await makeScriptApi(createJsonApiSite(), EXAMPLE_SCRIPT_JSON);

    const report = await runContract(api, {
      capabilities: [...CAPABILITIES],
      expectImageHeaders: JSON_API_IMAGE_HEADERS,
    });

    expect(report.methods).toEqual(["popular", "latest", "search", "details", "pages"]);
    expect(report.imageCounts.every((count) => count > 0)).toBe(true);

    const pages = await api.pages("ch-1", "r-oficial");
    for (const image of pages.images) {
      expect(image.headers).toEqual(JSON_API_IMAGE_HEADERS);
    }
  });
});
