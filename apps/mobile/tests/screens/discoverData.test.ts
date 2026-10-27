import { describe, expect, it } from "vitest";

import { ModuleError } from "@ryuunest/core";

import {
  getDiscoverModules,
  loadDiscoverData,
  toDiscoverError,
} from "../../src/screens/discover/discoverData";

/**
 * F15 — la capa de datos de Descubrir monta los módulos de ejemplo con el
 * runtime real del núcleo (T20) sobre el sitio falso de `test-site` (T10):
 * filas `popular`/`latest` según lo que ofrezca el módulo (RF-9), búsqueda con
 * paginación (RF-10) y errores del contrato (SPEC §6.4) listos para RF-11.
 */

describe("getDiscoverModules", () => {
  it("expone A (popular + latest) y B (solo latest, NSFW)", () => {
    expect(getDiscoverModules()).toEqual([
      {
        id: "m-ejemplo-a",
        name: "Módulo de ejemplo A",
        nsfw: false,
        hasPopular: true,
        hasLatest: true,
      },
      {
        id: "m-ejemplo-b",
        name: "Módulo de ejemplo B",
        nsfw: true,
        hasPopular: false,
        hasLatest: true,
      },
    ]);
  });
});

describe("loadDiscoverData — módulo A sobre el sitio falso", () => {
  it("las filas salen del módulo (páginas de 3; latest recorre al revés)", async () => {
    const data = await loadDiscoverData({ moduleId: "m-ejemplo-a", query: "", page: 1 });

    expect(data.popular.map((entry) => entry.seriesId)).toEqual([
      "dragon-de-ceniza",
      "guardiana-del-nido",
      "cronicas-de-moonlit",
    ]);
    expect(data.latest.map((entry) => entry.seriesId)).toEqual([
      "draco-de-jade",
      "noche-de-ambar",
      "cronicas-de-moonlit",
    ]);
    expect(data.popular[0]?.title).toBe("El dragón de ceniza");
    expect(data.popular[0]?.kind).toBe("manhwa");
    expect(data.popular[0]?.moduleId).toBe("m-ejemplo-a");
  });

  it("el catálogo pagina con hasNext (5 series = 3 + 2)", async () => {
    const page1 = await loadDiscoverData({ moduleId: "m-ejemplo-a", query: "", page: 1 });
    expect(page1.catalog).toMatchObject({ page: 1, hasNext: true });
    expect(page1.catalog.entries).toHaveLength(3);

    const page2 = await loadDiscoverData({ moduleId: "m-ejemplo-a", query: "", page: 2 });
    expect(page2.catalog).toMatchObject({ page: 2, hasNext: false });
    expect(page2.catalog.entries).toHaveLength(2);
  });

  it("buscar filtra dentro del módulo (RF-10)", async () => {
    const found = await loadDiscoverData({ moduleId: "m-ejemplo-a", query: "dragon", page: 1 });
    expect(found.catalog.entries.map((entry) => entry.seriesId)).toEqual(["dragon-de-ceniza"]);
    expect(found.catalog.hasNext).toBe(false);

    const none = await loadDiscoverData({ moduleId: "m-ejemplo-a", query: "quimera", page: 1 });
    expect(none.catalog.entries).toEqual([]);
    expect(none.catalog.hasNext).toBe(false);
  });

  it("el declarativo no marca series sueltas: NSFW vive en el módulo", async () => {
    const page2 = await loadDiscoverData({ moduleId: "m-ejemplo-a", query: "", page: 2 });
    expect(page2.catalog.entries.map((entry) => entry.seriesId)).toEqual([
      "noche-de-ambar",
      "draco-de-jade",
    ]);
    expect(page2.catalog.entries.every((entry) => entry.nsfw === false)).toBe(true);
  });
});

describe("loadDiscoverData — gating de capacidades y errores", () => {
  it("B no ofrece popular: la fila viene vacía aunque exista en el sitio", async () => {
    const data = await loadDiscoverData({ moduleId: "m-ejemplo-b", query: "", page: 1 });
    expect(data.popular).toEqual([]);
    expect(data.latest.length).toBeGreaterThan(0);
    expect(data.catalog.entries.every((entry) => entry.moduleId === "m-ejemplo-b")).toBe(true);
  });

  it("un módulo desconocido falla con NOT_FOUND sin tocar la red", async () => {
    await expect(loadDiscoverData({ moduleId: "m-fantasma", query: "", page: 1 })).rejects.toMatchObject(
      { code: "NOT_FOUND" },
    );
  });
});

describe("toDiscoverError (RF-11: causa, código y detalle)", () => {
  it("un ModuleError aporta código, URL y selector del contrato", () => {
    const error = new ModuleError("PARSE", "Falta el listado", {
      url: "https://sitio-html.test/search?q=x",
      selector: "div.element",
    });
    expect(toDiscoverError(error, "Módulo de ejemplo A")).toEqual({
      moduleName: "Módulo de ejemplo A",
      cause: "Falta el listado",
      code: "PARSE",
      url: "https://sitio-html.test/search?q=x",
      selector: "div.element",
    });
  });

  it("un fallo inesperado se muestra como INTERNAL con su mensaje", () => {
    const view = toDiscoverError(new Error("Rara"), "Módulo de ejemplo A");
    expect(view).toEqual({ moduleName: "Módulo de ejemplo A", cause: "Rara", code: "INTERNAL" });
  });
});
