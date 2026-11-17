import { describe, expect, it, vi } from "vitest";

import type { ModuleApi, ModuleApiHandle, Page, SeriesSummary } from "@ryuunest/core";

import { loadFromApi } from "../../src/screens/discover/discoverData";

/**
 * F59 — Descubrir usa `home()` y `list()` del módulo cuando los declara y cae a
 * `latest`/`popular` cuando no (T43).
 */

function series(id: string): SeriesSummary {
  return { id, title: `Serie ${id}` };
}

function page(ids: string[], hasNext = false): Page<SeriesSummary> {
  return { items: ids.map(series), hasNext };
}

function handle(api: Partial<ModuleApi>): ModuleApiHandle {
  const full: ModuleApi = {
    search: vi.fn(async () => page(["s1"])),
    details: vi.fn(),
    pages: vi.fn(),
    ...api,
  };
  return { api: full } as unknown as ModuleApiHandle;
}

const FLAGS = { hasLatest: true, hasPopular: true, hasHome: false };

describe("loadFromApi · home()", () => {
  it("con `home` declarado trae sus secciones y no pide latest/popular", async () => {
    const latest = vi.fn(async () => page(["l1"]));
    const popular = vi.fn(async () => page(["p1"]));
    const home = vi.fn(async () => ({
      sections: [
        { id: "hot", title: "En emisión", ...page(["a", "b"], true) },
        { id: "new", title: "Nuevos", ...page(["c"]) },
      ],
    }));
    const data = await loadFromApi(
      handle({ latest, popular, home }),
      { ...FLAGS, hasHome: true },
      "m",
      "",
      1,
    );

    expect(data.sections.map((s) => [s.id, s.title, s.entries.map((e) => e.seriesId), s.hasMore])).toEqual([
      ["hot", "En emisión", ["a", "b"], true],
      ["new", "Nuevos", ["c"], false],
    ]);
    expect(data.sections[0]?.entries[0]?.moduleId).toBe("m");
    expect(latest).not.toHaveBeenCalled();
    expect(popular).not.toHaveBeenCalled();
  });

  it("sin `home` declarado (o con consulta) cae a latest/popular y no hay secciones", async () => {
    const home = vi.fn(async () => ({ sections: [] }));
    const data = await loadFromApi(
      handle({ latest: async () => page(["l1"]), popular: async () => page(["p1"]), home }),
      FLAGS,
      "m",
      "",
      1,
    );
    expect(data.sections).toEqual([]);
    expect(data.latest.map((e) => e.seriesId)).toEqual(["l1"]);
    expect(data.popular.map((e) => e.seriesId)).toEqual(["p1"]);
    expect(home).not.toHaveBeenCalled();
  });
});

describe("loadFromApi · list(sectionId, page)", () => {
  it("con una sección elegida el catálogo sale de `list` y no se piden filas ni búsqueda", async () => {
    const list = vi.fn(async () => page(["x", "y"], true));
    const search = vi.fn(async () => page(["nope"]));
    const home = vi.fn();
    const data = await loadFromApi(
      handle({ list, search, home }),
      { ...FLAGS, hasHome: true },
      "m",
      "",
      2,
      "hot",
    );
    expect(list).toHaveBeenCalledWith("hot", 2);
    expect(search).not.toHaveBeenCalled();
    expect(home).not.toHaveBeenCalled();
    expect(data.catalog).toMatchObject({ page: 2, hasNext: true });
    expect(data.catalog.entries.map((e) => e.seriesId)).toEqual(["x", "y"]);
    expect(data.sections).toEqual([]);
  });
});

describe("loadFromApi · filters() (F50)", () => {
  const FILTERS = [
    {
      id: "genre",
      label: "Género",
      type: "tags" as const,
      options: [
        { value: "horror", label: "Horror" },
        { value: "seinen", label: "Seinen" },
      ],
    },
    {
      id: "sort",
      label: "Orden",
      type: "select" as const,
      options: [
        { value: "name", label: "Nombre" },
        { value: "views", label: "Vistas" },
      ],
    },
    { id: "q", label: "Texto", type: "text" as const },
    { id: "empty", label: "Sin opciones", type: "tags" as const },
  ];
  const FLAGS_F = { ...FLAGS, hasFilters: true };

  it("devuelve los grupos `tags`/`select` con opciones (select = elección única)", async () => {
    const data = await loadFromApi(handle({ filters: async () => FILTERS }), FLAGS_F, "m", "", 1);
    expect(data.filters).toEqual([
      {
        id: "genre",
        label: "Género",
        multi: true,
        options: [
          { value: "horror", label: "Horror" },
          { value: "seinen", label: "Seinen" },
        ],
      },
      {
        id: "sort",
        label: "Orden",
        multi: false,
        options: [
          { value: "name", label: "Nombre" },
          { value: "views", label: "Vistas" },
        ],
      },
    ]);
  });

  it("sin `filters` declarado no hay filtros ni se llama a filters()", async () => {
    const filters = vi.fn(async () => FILTERS);
    const data = await loadFromApi(handle({ filters }), FLAGS, "m", "", 1);
    expect(data.filters).toEqual([]);
    expect(filters).not.toHaveBeenCalled();
  });

  it("la selección llega a search(query, page, filters), también sin texto, y apaga home()", async () => {
    const search = vi.fn(async () => page(["h1"]));
    const home = vi.fn();
    const selected = { genre: ["horror"], sort: ["views"] };
    await loadFromApi(
      handle({ search, home, filters: async () => FILTERS }),
      { ...FLAGS_F, hasHome: true },
      "m",
      "",
      1,
      undefined,
      selected,
    );
    // `select` viaja como texto (así lo leen los módulos); `tags`, como lista.
    expect(search).toHaveBeenCalledWith("", 1, { genre: ["horror"], sort: "views" });
    expect(home).not.toHaveBeenCalled();
  });

  it("sin selección, search se llama sin el tercer argumento", async () => {
    const search = vi.fn(async () => page([]));
    await loadFromApi(handle({ search }), FLAGS, "m", "x", 1);
    expect(search).toHaveBeenCalledWith("x", 1);
  });
});
