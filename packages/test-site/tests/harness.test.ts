import { describe, expect, it } from "vitest";

import type { ModuleApi, Page, SeriesDetails, SeriesSummary } from "@ryuunest/core";

import {
  ContractError,
  FIXTURE_DEFAULTS,
  FIXTURE_SERIES,
  normalizeText,
  runContract,
  type FixtureSeries,
} from "../src/index";

const PAGE_SIZE = 3;

function slicePage<T>(items: readonly T[], page: number): Page<T> {
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    hasNext: start + PAGE_SIZE < items.length,
  };
}

function toSummary(series: FixtureSeries): SeriesSummary {
  return {
    id: series.id,
    title: series.title,
    cover: series.cover,
    kind: series.kind,
    nsfw: series.nsfw,
    badges: [...series.badges],
    hint: series.hint,
  };
}

function toDetails(series: FixtureSeries): SeriesDetails {
  return {
    ...toSummary(series),
    description: series.description,
    genres: [...series.genres],
    status: series.status,
    altTitles: [...series.altTitles],
    extra: { Origen: series.kind },
    chapters: series.chapters.map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      number: chapter.number,
      releases: chapter.releases.map((release) => ({
        id: release.id,
        group: release.group,
        publishedAt: release.publishedAt,
      })),
    })),
  };
}

function fixtureSeries(id: string): FixtureSeries {
  const series = FIXTURE_SERIES.find((candidate) => candidate.id === id);
  if (series === undefined) {
    throw new Error(`fixture desconocida: ${id}`);
  }
  return series;
}

function createFixtureApi(): ModuleApi {
  return {
    popular: async (page) => slicePage(FIXTURE_SERIES, page),
    latest: async (page) => slicePage([...FIXTURE_SERIES].reverse(), page),
    search: async (query, page) =>
      slicePage(
        FIXTURE_SERIES.filter((series) =>
          normalizeText(series.title).includes(normalizeText(query)),
        ),
        page,
      ),
    details: async (seriesId) => toDetails(fixtureSeries(seriesId)),
    pages: async (chapterId, releaseId) => ({
      title: chapterId,
      images: [
        { url: `https://sitio-html.test/img/${chapterId}-${releaseId}-1.svg` },
        { url: `https://sitio-html.test/img/${chapterId}-${releaseId}-2.svg` },
      ],
    }),
  };
}

describe("arnés de contrato · módulo completo", () => {
  it("recorre los cinco métodos y devuelve un informe", async () => {
    const report = await runContract(createFixtureApi(), { capabilities: ["popular", "latest"] });

    expect(report.methods).toEqual(["popular", "latest", "search", "details", "pages"]);
    expect(report.seriesId).toBe(FIXTURE_DEFAULTS.seriesId);
    expect(report.releaseIds).toHaveLength(2);
    expect(report.imageCounts).toEqual([2, 2]);
  });

  it("exige `popular` y `latest` solo cuando se declaran como capacidades", async () => {
    const { popular: _popular, latest: _latest, ...withoutCapabilities } = createFixtureApi();

    await expect(runContract(withoutCapabilities)).resolves.toBeDefined();
    await expect(runContract(withoutCapabilities, { capabilities: ["popular"] })).rejects.toThrow(
      /popular/,
    );
  });

  it("comprueba las cabeceras de imagen cuando se piden", async () => {
    const api: ModuleApi = {
      ...createFixtureApi(),
      pages: async (chapterId, releaseId) => ({
        images: [
          {
            url: `https://api-json.test/img/${chapterId}-${releaseId}-1.svg`,
            headers: { Referer: "https://api-json.test/", "User-Agent": "RyuuNest/0.0" },
          },
        ],
      }),
    };

    await expect(
      runContract(api, { expectImageHeaders: { "User-Agent": "RyuuNest/0.0" } }),
    ).resolves.toBeDefined();

    const withoutHeaders: ModuleApi = {
      ...createFixtureApi(),
      pages: async (chapterId, releaseId) => ({
        images: [{ url: `https://api-json.test/img/${chapterId}-${releaseId}-1.svg` }],
      }),
    };

    await expect(
      runContract(withoutHeaders, { expectImageHeaders: { "User-Agent": "RyuuNest/0.0" } }),
    ).rejects.toThrow(/User-Agent/);
  });
});

describe("arnés de contrato · hasNext estimado", () => {
  /** Sitio sin paginador: `hasNext` es true mientras la página traiga series. */
  function createEstimatingApi(secondPageEmpty: boolean): ModuleApi {
    const [first, second] = FIXTURE_SERIES;
    if (first === undefined || second === undefined) {
      throw new Error("faltan fixtures");
    }
    return {
      ...createFixtureApi(),
      search: async (_query, page) =>
        page === 1
          ? { items: [toSummary(first)], hasNext: true }
          : secondPageEmpty
            ? { items: [], hasNext: false }
            : { items: [toSummary(second)], hasNext: true },
    };
  }

  it("por defecto exige que la página 2 sea la última", async () => {
    await expect(runContract(createEstimatingApi(false))).rejects.toThrow(/última página/);
    await expect(runContract(createEstimatingApi(true))).rejects.toThrow(/ninguna serie/);
  });

  it("con `estimatedHasNext` admite una página 2 que siga o que venga vacía", async () => {
    await expect(
      runContract(createEstimatingApi(false), { estimatedHasNext: true }),
    ).resolves.toBeDefined();
    await expect(
      runContract(createEstimatingApi(true), { estimatedHasNext: true }),
    ).resolves.toBeDefined();
  });

  it("con `estimatedHasNext` sigue exigiendo series en la página 1", async () => {
    const api: ModuleApi = {
      ...createFixtureApi(),
      search: async () => ({ items: [], hasNext: false }),
    };

    await expect(runContract(api, { estimatedHasNext: true })).rejects.toThrow(/ninguna serie/);
  });
});

describe("arnés de contrato · fallos claros", () => {
  it("exige los métodos obligatorios", async () => {
    const { search: _search, ...incomplete } = createFixtureApi();

    await expect(runContract(incomplete)).rejects.toThrowError(ContractError);
    await expect(runContract(incomplete)).rejects.toThrow(/search\(\)/);
  });

  it("rechaza un valor que no es un módulo", async () => {
    await expect(runContract(undefined)).rejects.toThrow(/módulo/i);
  });

  it("detecta un `details` sin capítulo con dos releases", async () => {
    const api: ModuleApi = {
      ...createFixtureApi(),
      details: async (seriesId) => ({
        ...toDetails(fixtureSeries(seriesId)),
        chapters: [{ id: "ch-1", title: "Capítulo 1", number: 1, releases: [{ id: "r-unico" }] }],
      }),
    };

    await expect(runContract(api)).rejects.toThrow(/dos releases|2 releases/);
  });

  it("detecta un `pages` sin imágenes", async () => {
    const api: ModuleApi = {
      ...createFixtureApi(),
      pages: async () => ({ images: [] }),
    };

    await expect(runContract(api)).rejects.toThrow(/imágenes/);
  });
});
