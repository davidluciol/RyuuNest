import { describe, expect, it } from "vitest";

import {
  createHtmlSite,
  createSiteHttp,
  EXAMPLE_DECLARATIVE,
  HTML_SITE_BASE_URL,
  runContract,
} from "@ryuunest/test-site";

import { ModuleError } from "../../src/contract/errors";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FixedClock } from "../../src/ports/fakes";
import { DeclarativeRuntime, type DeclarativeConfig } from "../../src/runtimes/DeclarativeRuntime";
import type { ModuleApi } from "../../src/contract/types";

/**
 * E2E del módulo declarativo de ejemplo contra el sitio falso (T17).
 *
 * Es la prueba de generalidad del runtime declarativo (SPEC §6.6): el arnés de
 * contrato (T10) recorre los cinco métodos sobre las **fixtures HTML** de
 * `@ryuunest/test-site`, sin tocar ningún sitio real.
 */

/** Monta la `ModuleApi` declarativa sobre el sitio falso HTML. */
function makeApi(config: DeclarativeConfig): ModuleApi {
  const host = new ModuleHost({
    http: createSiteHttp(createHtmlSite()),
    clock: new FixedClock(10_000),
    permissions: { domains: ["sitio-html.test"] },
    minDelayMs: 0,
    timeoutMs: 2_000,
  });
  return new DeclarativeRuntime({ config, host, baseUrl: HTML_SITE_BASE_URL }).createApi();
}

function withTitleSelector(config: DeclarativeConfig, selector: string): DeclarativeConfig {
  const details = config.details;
  if (details === undefined) {
    throw new Error("La configuración de prueba no define details");
  }
  return {
    ...config,
    details: { ...details, fields: { ...details.fields, title: { selector } } },
  };
}

describe("declarative · contrato contra el sitio falso (T17)", () => {
  it("el módulo declarativo de ejemplo pasa los cinco métodos del arnés", async () => {
    const report = await runContract(makeApi(EXAMPLE_DECLARATIVE), {
      capabilities: ["popular", "latest", "search"],
    });

    expect(report.methods).toEqual(["popular", "latest", "search", "details", "pages"]);
    expect(report.seriesId).toBe("dragon-de-ceniza");
    expect(report.releaseIds.length).toBeGreaterThan(1);
    expect(report.imageCounts.every((count) => count > 0)).toBe(true);
  });

  it("un selector de campo roto produce ModuleError PARSE con details.selector", async () => {
    const broken = withTitleSelector(EXAMPLE_DECLARATIVE, "h1.no-existe");
    const api = makeApi(broken);

    const error = await api.details("dragon-de-ceniza").then(
      () => undefined,
      (thrown: unknown) => thrown,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
    expect((error as ModuleError).details?.selector).toBe("h1.no-existe");
  });

  it("un selector de capítulos roto corta la ficha con PARSE", async () => {
    const base = EXAMPLE_DECLARATIVE;
    const details = base.details;
    const chapters = details.chapters;
    const brokenChapters: DeclarativeConfig["details"] = {
      ...details,
      chapters: { ...chapters, list: "ul.no-existe > li" },
    };
    const broken: DeclarativeConfig = { ...base, details: brokenChapters };

    const error = await makeApi(broken)
      .details("dragon-de-ceniza")
      .then(
        () => undefined,
        (thrown: unknown) => thrown,
      );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
    expect((error as ModuleError).details?.selector).toBe("ul.no-existe > li");
  });

  it("las imágenes llevan URL absoluta del sitio", async () => {
    const pages = await makeApi(EXAMPLE_DECLARATIVE).pages("ch-1", "r-oficial");

    expect(pages.images.length).toBeGreaterThan(0);
    for (const image of pages.images) {
      expect(image.url.startsWith(`${HTML_SITE_BASE_URL}/img/`)).toBe(true);
    }
  });
});
