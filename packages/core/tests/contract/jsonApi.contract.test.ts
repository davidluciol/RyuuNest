import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  EXAMPLE_SCRIPT_ENTRY,
  EXAMPLE_SCRIPT_JSON,
  JSON_API_BASE_URL,
  JSON_API_IMAGE_HEADERS,
  runContract,
} from "@ryuunest/test-site";

import type { ModuleApi } from "../../src/contract/types";
import { ModuleHost } from "../../src/host/ModuleHost";
import { FakeScriptLoader, FixedClock, StubHttp, type StubHttpRoute } from "../../src/ports/fakes";
import { ScriptRuntime } from "../../src/runtimes/ScriptRuntime";

/**
 * Contrato contra el sitio falso JSON con **fixtures estáticos** (T32a).
 *
 * A diferencia de `script.contract.test.ts`, que usa el sitio JSON dinámico de
 * `test-site` (generado a partir de `FIXTURE_SERIES`), esta prueba sirve
 * respuestas JSON fijas desde `packages/test-site/fixtures/json-api/`, igual
 * que el port de TMO sirve HTML fijo desde `fixtures/tmo/`. Así se valida la
 * generalidad del contrato contra una segunda arquitectura (JSON + cursor)
 * con cuerpos de respuesta inmutables, sin depender de la lógica de generación
 * del sitio falso.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, "../../../test-site/fixtures/json-api");

function fixture(name: string): string {
  return readFileSync(resolve(FIXTURES, name), "utf8");
}

/** Rutas del sitio JSON estático, con los fixtures como cuerpos. */
function jsonApiRoutes(): Record<string, StubHttpRoute> {
  const jsonHeaders = { "content-type": "application/json; charset=utf-8" };
  return {
    // popular: página 1 (sin cursor) y página 2 (cursor=c2)
    [`${JSON_API_BASE_URL}/api/popular`]: {
      headers: jsonHeaders,
      body: fixture("popular-c1.json"),
    },
    [`${JSON_API_BASE_URL}/api/popular?cursor=c2`]: {
      headers: jsonHeaders,
      body: fixture("popular-c2.json"),
    },
    // latest: página 1 y página 2
    [`${JSON_API_BASE_URL}/api/latest`]: {
      headers: jsonHeaders,
      body: fixture("latest-c1.json"),
    },
    [`${JSON_API_BASE_URL}/api/latest?cursor=c2`]: {
      headers: jsonHeaders,
      body: fixture("latest-c2.json"),
    },
    // search "dragon": solo página 1 (1 resultado, hasNext=false)
    [`${JSON_API_BASE_URL}/api/search?q=dragon`]: {
      headers: jsonHeaders,
      body: fixture("search-dragon-c1.json"),
    },
    // details de la serie por defecto
    [`${JSON_API_BASE_URL}/api/series/dragon-de-ceniza`]: {
      headers: jsonHeaders,
      body: fixture("series-dragon-de-ceniza.json"),
    },
    // pages del capítulo por defecto, ambos releases
    [`${JSON_API_BASE_URL}/api/pages/ch-1/r-oficial`]: {
      headers: jsonHeaders,
      body: fixture("pages-ch-1-r-oficial.json"),
    },
    [`${JSON_API_BASE_URL}/api/pages/ch-1/r-alt`]: {
      headers: jsonHeaders,
      body: fixture("pages-ch-1-r-alt.json"),
    },
  };
}

/** Monta la `ModuleApi` del módulo script de ejemplo sobre el sitio JSON estático. */
async function makeJsonApi(): Promise<{ api: ModuleApi; http: StubHttp }> {
  const http = new StubHttp(jsonApiRoutes());
  const host = new ModuleHost({
    http,
    clock: new FixedClock(10_000),
    permissions: { domains: ["api-json.test"] },
    minDelayMs: 0,
    timeoutMs: 2_000,
  });
  const api = await new ScriptRuntime({
    host,
    loader: new FakeScriptLoader({ [EXAMPLE_SCRIPT_ENTRY]: EXAMPLE_SCRIPT_JSON }),
    source: EXAMPLE_SCRIPT_ENTRY,
  }).createApi();
  return { api, http };
}

const CAPABILITIES = ["popular", "latest", "search"] as const;

describe("json-api · contrato contra fixtures estáticos (T32a)", () => {
  it("el módulo script pasa el arnés de contrato sobre JSON con cursor", async () => {
    const { api, http } = await makeJsonApi();

    const report = await runContract(api, {
      capabilities: [...CAPABILITIES],
      expectImageHeaders: JSON_API_IMAGE_HEADERS,
    });

    expect(report.methods).toEqual(["popular", "latest", "search", "details", "pages"]);
    expect(report.seriesId).toBe("dragon-de-ceniza");
    expect(report.releaseIds).toEqual(["r-oficial", "r-alt"]);
    expect(report.imageCounts.every((count) => count > 0)).toBe(true);

    // El módulo pidió las páginas por cursor, no por número
    const urls = http.requests.map((request) => request.url);
    expect(urls).toContain(`${JSON_API_BASE_URL}/api/popular`);
    expect(urls).toContain(`${JSON_API_BASE_URL}/api/popular?cursor=c2`);
    expect(urls).toContain(`${JSON_API_BASE_URL}/api/latest?cursor=c2`);
    expect(urls).toContain(`${JSON_API_BASE_URL}/api/search?q=dragon`);
  });

  it("las imágenes llevan las cabeceras exigidas por el sitio", async () => {
    const { api } = await makeJsonApi();

    const pages = await api.pages("ch-1", "r-oficial");

    expect(pages.images.length).toBeGreaterThan(0);
    for (const image of pages.images) {
      expect(image.headers).toEqual(JSON_API_IMAGE_HEADERS);
      expect(image.url.startsWith(`${JSON_API_BASE_URL}/img/`)).toBe(true);
    }
  });

  it("details devuelve la ficha completa desde el fixture estático", async () => {
    const { api } = await makeJsonApi();

    const details = await api.details("dragon-de-ceniza");

    expect(details.id).toBe("dragon-de-ceniza");
    expect(details.title).toBe("El dragón de ceniza");
    expect(details.genres).toEqual(["Fantasía", "Aventura"]);
    expect(details.status).toBe("ongoing");
    expect(details.extra).toEqual({ Origen: "manhwa" });
    expect(details.chapters.map((chapter) => chapter.id)).toEqual(["ch-1", "ch-2", "ch-3"]);
    expect(details.chapters[0]?.releases.map((release) => release.id)).toEqual([
      "r-oficial",
      "r-alt",
    ]);
  });
});
