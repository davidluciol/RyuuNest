import { describe, expect, it } from "vitest";

import {
  DEFAULT_LIBRARY_FILTERS,
  GEMS_FOLDER_ID,
  SAMPLE_LIBRARY_DATA,
  filterLibrarySeries,
  libraryGridRows,
  type LibraryFilters,
} from "../../src/screens/library/libraryFixtures";

/**
 * F14a/F14b — lógica de filtrado de la Biblioteca (RF-26 a RF-30, RF-35).
 * Prueba la función `filterLibrarySeries` que usa la pantalla; el núcleo
 * hará la consulta real con SQL (T23).
 */
describe("libraryGridRows (F34: cuadrícula de Biblioteca sin lista virtualizada)", () => {
  it("parte las series en filas de 3 sin perder ni desordenar ninguna", () => {
    expect(libraryGridRows(["a", "b", "c", "d", "e"], 3)).toEqual([
      ["a", "b", "c"],
      ["d", "e"],
    ]);
  });

  it("sin series no devuelve filas", () => {
    expect(libraryGridRows([], 3)).toEqual([]);
  });
});

describe("filterLibrarySeries (F14a/F14b)", () => {
  const all = SAMPLE_LIBRARY_DATA.series;

  it("sin filtros devuelve todas las series SFW (NSFW oculto por defecto, RF-35)", () => {
    const result = filterLibrarySeries(all, DEFAULT_LIBRARY_FILTERS);
    // 12 series en fixtures, 1 es NSFW → 11 visibles.
    expect(result).toHaveLength(11);
    expect(result.every((s) => !s.nsfw)).toBe(true);
  });

  it("con NSFW visible incluye la serie NSFW", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, nsfwVisible: true };
    const result = filterLibrarySeries(all, filters);
    expect(result).toHaveLength(12);
    expect(result.some((s) => s.nsfw)).toBe(true);
  });

  it("búsqueda por título (sin acentos ni mayúsculas)", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, search: "dragon" };
    const result = filterLibrarySeries(all, filters);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("El dragón de ceniza");
  });

  it("búsqueda sin resultados devuelve vacío", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, search: "zzzzz" };
    const result = filterLibrarySeries(all, filters);
    expect(result).toHaveLength(0);
  });

  it("chip «Leyendo» filtra series con progreso", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, chip: "reading" };
    const result = filterLibrarySeries(all, filters);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.progress !== null)).toBe(true);
  });

  it("chip «Carpetas» filtra series con carpeta", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, chip: "folders" };
    const result = filterLibrarySeries(all, filters);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.folderId !== null)).toBe(true);
  });

  it("filtro por tipo (manga)", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, kinds: ["manga"] };
    const result = filterLibrarySeries(all, filters);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.kind === "manga")).toBe(true);
  });

  it("filtro por fuente (módulo)", () => {
    const filters: LibraryFilters = {
      ...DEFAULT_LIBRARY_FILTERS,
      moduleIds: ["m-ejemplo-a"],
    };
    const result = filterLibrarySeries(all, filters);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.moduleId === "m-ejemplo-a")).toBe(true);
  });

  it("filtro por carpeta específica", () => {
    const filters: LibraryFilters = {
      ...DEFAULT_LIBRARY_FILTERS,
      folderId: "epicos",
    };
    const result = filterLibrarySeries(all, filters);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.folderId === "epicos")).toBe(true);
  });

  it("filtro por carpeta null (sin carpeta)", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, folderId: null };
    const result = filterLibrarySeries(all, filters);
    expect(result.every((s) => s.folderId === null)).toBe(true);
  });

  it("orden por nombre (A-Z)", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, order: "name" };
    const result = filterLibrarySeries(all, filters);
    const names = result.map((s) => s.title);
    const sorted = [...names].sort((a, b) => a.localeCompare(b, "es"));
    expect(names).toEqual(sorted);
  });

  it("orden por fecha de adición (más reciente primero)", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, order: "addedAt" };
    const result = filterLibrarySeries(all, filters);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].addedAt).toBeGreaterThanOrEqual(result[i].addedAt);
    }
  });

  it("orden por último leído: la marca más reciente primero, sin marca usa la fecha de alta", () => {
    const base = all[0]!;
    const series = [
      { ...base, seriesId: "viejo", title: "Viejo", addedAt: 10, lastReadAt: 10 },
      { ...base, seriesId: "leido", title: "Leído", addedAt: 5, lastReadAt: 90 },
      { ...base, seriesId: "sin-marca", title: "Sin marca", addedAt: 50, lastReadAt: undefined },
    ];
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, order: "lastRead" };

    const ids = filterLibrarySeries(series, filters).map((s) => s.seriesId);

    expect(ids).toEqual(["leido", "sin-marca", "viejo"]);
  });

  it("cifras coherentes con Inicio (D1): Gemas (todo) y 3 carpetas, 48 obras totales", () => {
    const gems = SAMPLE_LIBRARY_DATA.folders.find((f) => f.kind === "gems");
    const reales = SAMPLE_LIBRARY_DATA.folders.filter((f) => f.kind !== "gems");
    expect(gems).toMatchObject({ id: GEMS_FOLDER_ID, name: "Gemas", count: 48 });
    expect(reales).toHaveLength(3);
    expect(reales.reduce((sum, f) => sum + f.count, 0)).toBe(48);
  });

  it("la carpeta Favoritos de ejemplo es la del sistema (F52)", () => {
    expect(SAMPLE_LIBRARY_DATA.folders.map((f) => f.kind)).toEqual([
      "gems",
      "favorites",
      undefined,
      undefined,
    ]);
  });

  it("elegir Gemas no filtra: es la vista de todas las series (F52)", () => {
    const filters: LibraryFilters = { ...DEFAULT_LIBRARY_FILTERS, folderId: GEMS_FOLDER_ID };
    expect(filterLibrarySeries(all, filters)).toEqual(filterLibrarySeries(all, DEFAULT_LIBRARY_FILTERS));
  });
});
