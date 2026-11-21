import { describe, expect, it, vi } from "vitest";

import { createCatalogPager, mergeCatalogPage } from "../../src/screens/discover/catalogPaging";
import type { DiscoverEntry, DiscoverPage } from "../../src/screens/discover/discoverFixtures";

/** F84 — scroll infinito del catálogo: acumula páginas sin duplicar ni repetir peticiones. */

const entry = (id: string): DiscoverEntry => ({
  seriesId: id,
  moduleId: "m",
  title: id,
  kind: null,
  nsfw: false,
  hint: null,
});

const page = (n: number, ids: string[], hasNext: boolean): DiscoverPage => ({
  page: n,
  entries: ids.map(entry),
  hasNext,
});

describe("mergeCatalogPage", () => {
  it("añade la página siguiente al final y avanza el contador", () => {
    const merged = mergeCatalogPage(page(1, ["a", "b"], true), page(2, ["c"], false));
    expect(merged.entries.map((e) => e.seriesId)).toEqual(["a", "b", "c"]);
    expect(merged.page).toBe(2);
    expect(merged.hasNext).toBe(false);
  });

  it("descarta series repetidas entre páginas", () => {
    const merged = mergeCatalogPage(page(1, ["a", "b"], true), page(2, ["b", "c"], true));
    expect(merged.entries.map((e) => e.seriesId)).toEqual(["a", "b", "c"]);
    expect(merged.hasNext).toBe(true);
  });
});

describe("createCatalogPager", () => {
  it("pide la página siguiente y devuelve el catálogo acumulado", async () => {
    const loadPage = vi.fn(async (n: number) => page(n, [`s${n}`], n < 3));
    const loadMore = createCatalogPager(loadPage);

    const next = await loadMore(page(1, ["s1"], true));

    expect(loadPage).toHaveBeenCalledWith(2);
    expect(next?.entries.map((e) => e.seriesId)).toEqual(["s1", "s2"]);
  });

  it("no pide nada al agotarse la lista", async () => {
    const loadPage = vi.fn();
    const loadMore = createCatalogPager(loadPage);

    expect(await loadMore(page(3, ["x"], false))).toBeNull();
    expect(loadPage).not.toHaveBeenCalled();
  });

  it("ignora peticiones mientras hay una en curso (sin peticiones repetidas)", async () => {
    let release: (value: DiscoverPage) => void = () => undefined;
    const loadPage = vi.fn(() => new Promise<DiscoverPage>((resolve) => (release = resolve)));
    const loadMore = createCatalogPager(loadPage);
    const current = page(1, ["a"], true);

    const first = loadMore(current);
    expect(await loadMore(current)).toBeNull();
    release(page(2, ["b"], false));
    await first;

    expect(loadPage).toHaveBeenCalledTimes(1);
  });

  it("tras un error deja reintentar la misma página", async () => {
    const loadPage = vi
      .fn<(n: number) => Promise<DiscoverPage>>()
      .mockRejectedValueOnce(new Error("sin red"))
      .mockResolvedValueOnce(page(2, ["b"], false));
    const loadMore = createCatalogPager(loadPage);
    const current = page(1, ["a"], true);

    await expect(loadMore(current)).rejects.toThrow("sin red");
    const next = await loadMore(current);

    expect(loadPage).toHaveBeenNthCalledWith(2, 2);
    expect(next?.entries).toHaveLength(2);
  });
});
