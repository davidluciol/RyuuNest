import { describe, expect, it } from "vitest";

import {
  GEMS_FOLDER_ID,
  SAMPLE_LIBRARY_DATA,
  DEFAULT_LIBRARY_FILTERS,
  addSampleFolder,
  clearedFilters,
  hasActiveFilters,
  moveSampleSeries,
  removeSampleSeries,
  folderCount,
  seriesInFolder,
  validateFolderName,
  type LibraryFolder,
  type LibrarySeries,
} from "../../src/screens/library/libraryFixtures";

/**
 * F53 — lógica de presentación de las carpetas: nombre válido, pertenencia (a mano o por
 * etiqueta, carpeta inteligente) y alta en los datos de ejemplo (web, sin base).
 */
const base: LibrarySeries = {
  seriesId: "a",
  moduleId: "m",
  title: "A",
  kind: "manga",
  nsfw: false,
  status: "ongoing",
  folderId: null,
  addedAt: 1,
  progress: null,
};

describe("validateFolderName", () => {
  it("vacío o solo espacios → EMPTY", () => {
    expect(validateFolderName("", [])).toBe("EMPTY");
    expect(validateFolderName("   ", [])).toBe("EMPTY");
  });

  it("repetido sin distinguir mayúsculas, acentos ni espacios → DUPLICATE", () => {
    expect(validateFolderName(" ACCIÓN ", ["Acción"])).toBe("DUPLICATE");
  });

  it("válido → null", () => {
    expect(validateFolderName("Noche", ["Acción"])).toBeNull();
  });
});

describe("seriesInFolder / folderCount (carpeta inteligente)", () => {
  const manual: LibraryFolder = { id: "1", name: "Manual", count: 0 };
  const inteligente: LibraryFolder = { id: "2", name: "Seinen", count: 0, tags: ["Seinen"] };

  it("a mano: coincide por folderId", () => {
    expect(seriesInFolder({ ...base, folderId: "1" }, manual)).toBe(true);
    expect(seriesInFolder(base, manual)).toBe(false);
  });

  it("por etiqueta: coincide aunque esté en otra carpeta, sin distinguir mayúsculas ni acentos", () => {
    expect(seriesInFolder({ ...base, folderId: "1", tags: ["seinen"] }, inteligente)).toBe(true);
    expect(seriesInFolder({ ...base, tags: ["Isekai"] }, inteligente)).toBe(false);
  });

  it("Gemas contiene todo", () => {
    const gemas: LibraryFolder = { id: GEMS_FOLDER_ID, name: "Gemas", count: 0, kind: "gems" };
    expect(seriesInFolder(base, gemas)).toBe(true);
  });

  it("folderCount ignora las NSFW salvo que se pidan", () => {
    const series = [base, { ...base, seriesId: "b", nsfw: true, folderId: "1" }, { ...base, seriesId: "c", folderId: "1" }];
    expect(folderCount(series, manual, false)).toBe(1);
    expect(folderCount(series, manual, true)).toBe(2);
  });
});

describe("addSampleFolder", () => {
  it("añade la carpeta con su recuento por etiquetas y no toca las series", () => {
    const antes = SAMPLE_LIBRARY_DATA.folders.length;

    const resultado = addSampleFolder(SAMPLE_LIBRARY_DATA, "Mis acción", ["Acción"]);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    expect(resultado.data.folders).toHaveLength(antes + 1);
    const nueva = resultado.data.folders.at(-1);
    expect(nueva).toMatchObject({ name: "Mis acción", tags: ["Acción"] });
    expect(nueva?.count).toBe(
      SAMPLE_LIBRARY_DATA.series.filter((s) => s.tags?.some((t) => t === "Acción")).length,
    );
    expect(resultado.data.series).toBe(SAMPLE_LIBRARY_DATA.series);
  });

  it("rechaza un nombre repetido o vacío", () => {
    expect(addSampleFolder(SAMPLE_LIBRARY_DATA, "gemas", [])).toEqual({ ok: false, reason: "DUPLICATE" });
    expect(addSampleFolder(SAMPLE_LIBRARY_DATA, " ", [])).toEqual({ ok: false, reason: "EMPTY" });
  });

  it("las etiquetas de ejemplo salen de las series (sin repetir, por orden)", () => {
    const tags = SAMPLE_LIBRARY_DATA.tags;
    expect(tags.length).toBeGreaterThan(0);
    expect([...tags].sort((a, b) => a.localeCompare(b, "es"))).toEqual(tags);
    expect(new Set(tags).size).toBe(tags.length);
  });
});

describe("acciones de serie sobre los datos de ejemplo (F54, web sin base)", () => {
  const primera = SAMPLE_LIBRARY_DATA.series[0] as LibrarySeries;
  const clave = { moduleId: primera.moduleId, seriesId: primera.seriesId };
  const cuenta = (data: typeof SAMPLE_LIBRARY_DATA, id: string) =>
    data.folders.find((f) => f.id === id)?.count ?? -1;

  it("mover cambia la carpeta de la serie (solo una, D-12) y reajusta los dos recuentos", () => {
    const origen = primera.folderId as string;
    const destino = SAMPLE_LIBRARY_DATA.folders.find((f) => f.id !== origen && f.kind === undefined) as LibraryFolder;

    const data = moveSampleSeries(SAMPLE_LIBRARY_DATA, clave, destino.id);

    expect(data.series.find((s) => s.seriesId === clave.seriesId)?.folderId).toBe(destino.id);
    expect(cuenta(data, origen)).toBe(cuenta(SAMPLE_LIBRARY_DATA, origen) - 1);
    expect(cuenta(data, destino.id)).toBe(cuenta(SAMPLE_LIBRARY_DATA, destino.id) + 1);
    expect(cuenta(data, GEMS_FOLDER_ID)).toBe(cuenta(SAMPLE_LIBRARY_DATA, GEMS_FOLDER_ID));
  });

  it("quitar la serie la saca de Tesoros y descuenta de Gemas y de su carpeta", () => {
    const origen = primera.folderId as string;

    const data = removeSampleSeries(SAMPLE_LIBRARY_DATA, clave);

    expect(data.series.some((s) => s.seriesId === clave.seriesId)).toBe(false);
    expect(cuenta(data, GEMS_FOLDER_ID)).toBe(cuenta(SAMPLE_LIBRARY_DATA, GEMS_FOLDER_ID) - 1);
    expect(cuenta(data, origen)).toBe(cuenta(SAMPLE_LIBRARY_DATA, origen) - 1);
  });

  it("crear y mover: la carpeta nueva recibe la serie", () => {
    const resultado = addSampleFolder(SAMPLE_LIBRARY_DATA, "Recién llegadas", [], clave);

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;
    const nueva = resultado.data.folders.at(-1) as LibraryFolder;
    expect(resultado.data.series.find((s) => s.seriesId === clave.seriesId)?.folderId).toBe(nueva.id);
    expect(nueva.count).toBe(1);
  });
});

describe("filtros activos del vacío de búsqueda (F56)", () => {
  it("sin nada marcado no hay filtros activos (solo texto no cuenta como filtro)", () => {
    expect(hasActiveFilters(DEFAULT_LIBRARY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...DEFAULT_LIBRARY_FILTERS, search: "dragon" })).toBe(false);
  });

  it("categorías, tipos, fuentes, carpeta o el chip «Leyendo» cuentan como filtros", () => {
    expect(hasActiveFilters({ ...DEFAULT_LIBRARY_FILTERS, tags: ["Seinen"] })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_LIBRARY_FILTERS, kinds: ["manga"] })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_LIBRARY_FILTERS, moduleIds: ["m"] })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_LIBRARY_FILTERS, folderId: "x" })).toBe(true);
    expect(hasActiveFilters({ ...DEFAULT_LIBRARY_FILTERS, chip: "reading" })).toBe(true);
  });

  it("Gemas (vista de todo) como carpeta elegida no es un filtro", () => {
    expect(hasActiveFilters({ ...DEFAULT_LIBRARY_FILTERS, folderId: GEMS_FOLDER_ID })).toBe(false);
  });

  it("clearedFilters quita los filtros y el texto pero respeta el orden y el NSFW", () => {
    const sucio = {
      ...DEFAULT_LIBRARY_FILTERS,
      search: "x",
      tags: ["Seinen"],
      kinds: ["manga" as const],
      moduleIds: ["m"],
      folderId: "x",
      chip: "reading" as const,
      order: "addedAt" as const,
      nsfwVisible: true,
    };

    expect(clearedFilters(sucio)).toEqual({
      ...DEFAULT_LIBRARY_FILTERS,
      order: "addedAt",
      nsfwVisible: true,
    });
  });
});
