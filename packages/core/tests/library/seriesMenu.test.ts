import { beforeEach, describe, expect, it } from "vitest";

import { Favorites } from "../../src/library/Favorites";
import { FolderNameError, Folders } from "../../src/library/Folders";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock } from "../../src/ports/fakes";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F54 — acciones del menú de pulsación larga: mover, crear y mover, añadir a «Favoritos» y
 * quitar. Una serie sigue en una sola carpeta (D-12) y quitarla conserva su progreso (RF-30).
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
  await favorites.add("m", "s", null);
});

async function systemFolder(): Promise<number> {
  const folder = (await folders.list()).find((f) => f.system === "favorites");
  return folder?.id ?? -1;
}

describe("Favorites.moveToFavorites", () => {
  it("pasa la serie a «Favoritos» y la saca de la carpeta en la que estaba (D-12)", async () => {
    const otra = await folders.create("Otra");
    await favorites.move("m", "s", otra);

    await favorites.moveToFavorites("m", "s");

    expect((await favorites.get("m", "s"))?.folderId).toBe(await systemFolder());
  });

  it("si la serie no está guardada no inventa un favorito", async () => {
    await favorites.moveToFavorites("m", "nunca");

    expect(await favorites.get("m", "nunca")).toBeUndefined();
  });
});

describe("Folders.createAndMove", () => {
  it("crea la carpeta (con sus etiquetas) y mueve la serie, de una vez", async () => {
    const id = await folders.createAndMove("Nueva", 4, ["Seinen"], "m", "s");

    expect((await favorites.get("m", "s"))?.folderId).toBe(id);
    expect(await folders.tags(id)).toEqual(["Seinen"]);
  });

  it("un nombre repetido no crea nada ni mueve la serie", async () => {
    await expect(folders.createAndMove("favoritos", 4, [], "m", "s")).rejects.toBeInstanceOf(FolderNameError);

    expect((await favorites.get("m", "s"))?.folderId).toBeNull();
    expect((await folders.list()).map((f) => f.name)).toEqual(["Favoritos"]);
  });

  it("es atómico: si falla el movimiento no queda la carpeta creada", async () => {
    await expect(folders.createAndMove("Huérfana", 4, ["Seinen"], "m", "no-existe")).rejects.toThrow();

    expect((await folders.list()).map((f) => f.name)).toEqual(["Favoritos"]);
    expect(await driver.all("SELECT * FROM folder_tag")).toEqual([]);
  });
});

describe("quitar de Tesoros conserva el progreso (RF-30)", () => {
  it("Favorites.remove borra el favorito pero no su progreso ni sus leídos", async () => {
    await driver.run(
      "INSERT INTO progress (module_id, series_id, chapter_id, page_index, updated_at) VALUES ('m','s','c1',3,1)",
    );
    await driver.run("INSERT INTO chapter_read (module_id, series_id, chapter_id, read_at) VALUES ('m','s','c1',1)");

    await favorites.remove("m", "s");

    expect(await favorites.get("m", "s")).toBeUndefined();
    expect(await driver.all("SELECT 1 FROM progress")).toHaveLength(1);
    expect(await driver.all("SELECT 1 FROM chapter_read")).toHaveLength(1);
  });
});
