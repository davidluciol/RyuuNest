import { beforeEach, describe, expect, it } from "vitest";

import { Favorites } from "../../src/library/Favorites";
import { Folders } from "../../src/library/Folders";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock } from "../../src/ports/fakes";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F95 — el corazón de la ficha guarda en «Favoritos». Quitarlo deja la serie en «Gemas» (sin
 * carpeta) y conserva el progreso (RF-30). Una sola carpeta por serie (D-12).
 */

let driver: SqlDriver;
let favorites: Favorites;
let folders: Folders;

beforeEach(async () => {
  driver = await openMigratedDriver();
  const clock = new FixedClock(1_000);
  favorites = new Favorites({ driver, clock });
  folders = new Folders({ driver, clock });
  await new SeriesStore({ driver, clock }).upsert({ moduleId: "m", seriesId: "s", title: "S", nsfw: false });
});

async function favoritesFolder(): Promise<number> {
  return (await folders.list()).find((f) => f.system === "favorites")?.id ?? -1;
}

describe("Favorites.toggleHeart", () => {
  it("sin guardar: la guarda en «Favoritos» y devuelve true", async () => {
    expect(await favorites.toggleHeart("m", "s")).toBe(true);

    expect((await favorites.get("m", "s"))?.folderId).toBe(await favoritesFolder());
    expect(await favorites.isHearted("m", "s")).toBe(true);
  });

  it("en otra carpeta: pasa a «Favoritos» (una sola carpeta)", async () => {
    await favorites.add("m", "s", await folders.create("Otra"));

    expect(await favorites.toggleHeart("m", "s")).toBe(true);

    expect((await favorites.get("m", "s"))?.folderId).toBe(await favoritesFolder());
  });

  it("ya en «Favoritos»: la deja en «Gemas» (sin carpeta), no la elimina", async () => {
    await favorites.toggleHeart("m", "s");

    expect(await favorites.toggleHeart("m", "s")).toBe(false);

    expect(await favorites.get("m", "s")).toMatchObject({ folderId: null });
    expect(await favorites.isHearted("m", "s")).toBe(false);
  });

  it("guardada en Gemas o sin guardar no cuenta como corazón", async () => {
    expect(await favorites.isHearted("m", "s")).toBe(false);
    await favorites.add("m", "s", null);
    expect(await favorites.isHearted("m", "s")).toBe(false);
  });
});
