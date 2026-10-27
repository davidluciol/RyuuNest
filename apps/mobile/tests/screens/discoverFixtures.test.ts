import { describe, expect, it } from "vitest";

import {
  EMPTY_DISCOVER_PAGE,
  resolveSelectedModuleId,
  SAMPLE_DISCOVER_MODULES,
  visibleDiscoverEntries,
  visibleDiscoverModules,
  type DiscoverEntry,
  type DiscoverModule,
} from "../../src/screens/discover/discoverFixtures";

/**
 * F15 — lógica pura de la pantalla Descubrir (RF-9 a RF-11, RF-35):
 * visibilidad NSFW del selector y de las listas, selección recordada del
 * último módulo y forma de la página del catálogo.
 */

const MODULES: DiscoverModule[] = [
  { id: "m-a", name: "Módulo de ejemplo A", nsfw: false, hasPopular: true, hasLatest: true },
  { id: "m-b", name: "Módulo de ejemplo B", nsfw: false, hasPopular: false, hasLatest: true },
  { id: "m-x", name: "Módulo para mayores", nsfw: true, hasPopular: true, hasLatest: true },
];

function entry(overrides: Partial<DiscoverEntry> & { seriesId: string }): DiscoverEntry {
  return {
    moduleId: "m-a",
    title: `Serie ${overrides.seriesId}`,
    kind: null,
    nsfw: false,
    hint: null,
    ...overrides,
  };
}

describe("visibleDiscoverModules (RF-35)", () => {
  it("apagado el filtro, un módulo NSFW no aparece en el selector", () => {
    const ids = visibleDiscoverModules(MODULES, false).map((m) => m.id);
    expect(ids).toEqual(["m-a", "m-b"]);
  });

  it("encendido el filtro, el módulo NSFW sí aparece", () => {
    const ids = visibleDiscoverModules(MODULES, true).map((m) => m.id);
    expect(ids).toEqual(["m-a", "m-b", "m-x"]);
  });
});

describe("resolveSelectedModuleId (RF-9: se recuerda el último)", () => {
  it("si el módulo recordado está visible, se conserva", () => {
    expect(resolveSelectedModuleId(MODULES, "m-b")).toBe("m-b");
  });

  it("el módulo recordado NSFW no vale con el filtro apagado: cae al primer visible", () => {
    const visible = visibleDiscoverModules(MODULES, false);
    expect(resolveSelectedModuleId(visible, "m-x")).toBe("m-a");
  });

  it("sin recuerdo (o módulo desinstalado), se elige el primero visible", () => {
    const visible = visibleDiscoverModules(MODULES, false);
    expect(resolveSelectedModuleId(visible, null)).toBe("m-a");
    expect(resolveSelectedModuleId(visible, "m-fantasma")).toBe("m-a");
  });

  it("sin módulos visibles no hay selección", () => {
    expect(resolveSelectedModuleId([], null)).toBeNull();
  });
});

describe("visibleDiscoverEntries (RF-35 en las listas)", () => {
  it("apagado el filtro, las series NSFW no se muestran", () => {
    const entries = [entry({ seriesId: "ok" }), entry({ seriesId: "plus", nsfw: true })];
    expect(visibleDiscoverEntries(entries, false).map((e) => e.seriesId)).toEqual(["ok"]);
    expect(visibleDiscoverEntries(entries, true)).toHaveLength(2);
  });
});

describe("página del catálogo", () => {
  it("la página vacía es la página 1 sin entradas y sin siguiente", () => {
    expect(EMPTY_DISCOVER_PAGE).toEqual({ page: 1, entries: [], hasNext: false });
  });

  it("los datos de ejemplo nombran solo módulos conocidos", () => {
    const ids = new Set(SAMPLE_DISCOVER_MODULES.map((m) => m.id));
    expect(ids.has("m-ejemplo-a")).toBe(true);
    expect(ids.has("m-ejemplo-b")).toBe(true);
  });
});
