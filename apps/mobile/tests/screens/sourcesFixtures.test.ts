import { describe, expect, it } from "vitest";

import {
  EMPTY_SOURCES_DATA,
  SAMPLE_SOURCES_DATA,
  filterSourceModules,
  kindFilterCounts,
  sourcesSummary,
  type SourceKindFilter,
} from "../../src/screens/sources/sourcesFixtures";
import type { SourceModule } from "../../src/screens/sources/sourcesData";

/**
 * F16 — lógica pura de la pantalla Fuentes: contadores de los chips por tipo,
 * resumen «N instalados · M disponibles» y el filtro NSFW (RF-35), sin montar
 * la app. Los datos de ejemplo siguen el conjunto único de fixtures (D1–D5).
 */

function row(overrides: Partial<SourceModule> & Pick<SourceModule, "id">): SourceModule {
  return {
    name: overrides.id,
    status: "available",
    version: "1.0.0",
    runtime: "declarative",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    domains: ["ejemplo.test"],
    repoId: "https://repo.test/index.json",
    enabled: false,
    orphan: false,
    ...overrides,
  };
}

describe("kindFilterCounts", () => {
  it("cuenta «Todos» y cada tipo; un módulo de varios tipos cuenta en cada uno", () => {
    const modules = [
      row({ id: "a", kinds: ["manga"] }),
      row({ id: "b", kinds: ["manga", "manhwa"] }),
      row({ id: "c", kinds: ["comic"] }),
    ];

    expect(kindFilterCounts(modules)).toEqual({
      all: 3,
      manga: 2,
      manhua: 0,
      manhwa: 1,
      comic: 1,
    });
  });

  it("sin módulos todos los contadores son cero", () => {
    expect(kindFilterCounts([])).toEqual({ all: 0, manga: 0, manhua: 0, manhwa: 0, comic: 0 });
  });
});

describe("filterSourceModules", () => {
  const modules = [
    row({ id: "manga-sfw", kinds: ["manga"] }),
    row({ id: "manhwa-sfw", kinds: ["manhwa"] }),
    row({ id: "manga-nsfw", kinds: ["manga"], nsfw: true }),
  ];

  it("«Todos» devuelve todos los visibles", () => {
    expect(filterSourceModules(modules, "all", true).map((m) => m.id)).toEqual([
      "manga-sfw",
      "manhwa-sfw",
      "manga-nsfw",
    ]);
  });

  it("filtra por tipo", () => {
    const filter: SourceKindFilter = "manhwa";

    expect(filterSourceModules(modules, filter, true).map((m) => m.id)).toEqual(["manhwa-sfw"]);
  });

  it("con el filtro NSFW apagado oculta los módulos NSFW (RF-35)", () => {
    expect(filterSourceModules(modules, "all", false).map((m) => m.id)).toEqual([
      "manga-sfw",
      "manhwa-sfw",
    ]);
  });

  it("los instalados van antes que los disponibles, sin alterar el orden dentro de cada grupo", () => {
    const mixed = [
      row({ id: "disp-1" }),
      row({ id: "inst-1", status: "installed" }),
      row({ id: "disp-2" }),
      row({ id: "inst-2", status: "installed" }),
    ];

    expect(filterSourceModules(mixed, "all", true).map((m) => m.id)).toEqual([
      "inst-1",
      "inst-2",
      "disp-1",
      "disp-2",
    ]);
  });
});

describe("sourcesSummary", () => {
  it("cuenta instalados y disponibles", () => {
    const modules = [row({ id: "a", status: "installed" }), row({ id: "b" }), row({ id: "c" })];

    expect(sourcesSummary(modules)).toEqual({ installed: 1, available: 2 });
  });
});

describe("datos de ejemplo y vacío", () => {
  it("el vacío no trae repos ni módulos (RF-1)", () => {
    expect(EMPTY_SOURCES_DATA).toEqual({ repos: [], modules: [] });
  });

  it("el ejemplo reproduce el diseño: 6 módulos (3 manga, 2 manhwa, 1 cómic), 2 instalados", () => {
    const counts = kindFilterCounts(SAMPLE_SOURCES_DATA.modules);

    expect(counts).toMatchObject({ all: 6, manga: 3, manhwa: 2, comic: 1 });
    expect(sourcesSummary(SAMPLE_SOURCES_DATA.modules)).toEqual({ installed: 2, available: 4 });
  });

  it("el ejemplo cubre los casos de la pantalla: script, actualización y error", () => {
    const modules = SAMPLE_SOURCES_DATA.modules;

    expect(modules.some((m) => m.runtime === "script")).toBe(true);
    expect(modules.some((m) => m.updateTo !== undefined)).toBe(true);
    expect(modules.some((m) => m.lastError !== undefined)).toBe(true);
  });
});
