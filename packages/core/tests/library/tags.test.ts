import { beforeEach, describe, expect, it } from "vitest";

import type { SeriesDetails } from "../../src/contract/types";
import { Favorites } from "../../src/library/Favorites";
import { FolderNameError, Folders } from "../../src/library/Folders";
import { browseLibrary } from "../../src/library/queries";
import { SeriesStore } from "../../src/library/SeriesStore";
import { listLibraryTags } from "../../src/library/tags";
import { FixedClock } from "../../src/ports/fakes";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F53 — etiquetas: las de las series (`series_tag`, de `SeriesDetails.genres`) y las de una
 * carpeta inteligente (`folder_tag`), más la validación del nombre de carpeta.
 */

let driver: SqlDriver;
let series: SeriesStore;
let folders: Folders;
let favorites: Favorites;

beforeEach(async () => {
  driver = await openMigratedDriver();
  const clock = new FixedClock(1_000);
  series = new SeriesStore({ driver, clock });
  folders = new Folders({ driver, clock });
  favorites = new Favorites({ driver, clock });
});

function detalles(id: string, genres: string[]): SeriesDetails {
  return { id, title: `Serie ${id}`, genres, nsfw: false, status: "ongoing", kind: "manga" } as SeriesDetails;
}

async function guardar(id: string, genres: string[]): Promise<void> {
  await series.saveFromDetails("m", detalles(id, genres));
  await favorites.add("m", id, null);
}

describe("etiquetas de serie", () => {
  it("saveFromDetails guarda los géneros recortados y sin repetir (sin distinguir mayúsculas ni acentos)", async () => {
    await series.saveFromDetails("m", detalles("a", [" Acción ", "accion", "Seinen", ""]));

    expect(await series.tags("m", "a")).toEqual(["Acción", "Seinen"]);
  });

  it("volver a guardar reemplaza las etiquetas", async () => {
    await series.saveFromDetails("m", detalles("a", ["Seinen", "Isekai"]));
    await series.saveFromDetails("m", detalles("a", ["Shonen"]));

    expect(await series.tags("m", "a")).toEqual(["Shonen"]);
  });

  it("borrar la serie borra sus etiquetas", async () => {
    await series.saveFromDetails("m", detalles("a", ["Seinen"]));

    await driver.run("DELETE FROM series WHERE module_id = 'm' AND series_id = 'a'");

    expect(await driver.all("SELECT * FROM series_tag")).toEqual([]);
  });

  it("listLibraryTags: solo las de series guardadas, una vez cada una y por orden", async () => {
    await guardar("a", ["Seinen", "Acción"]);
    await guardar("b", ["seinen", "Isekai"]);
    await series.saveFromDetails("m", detalles("sin-guardar", ["Terror"]));

    expect(await listLibraryTags(driver)).toEqual(["Acción", "Isekai", "Seinen"]);
  });
});

describe("Folders · nombre y etiquetas (F53)", () => {
  it("rechaza un nombre vacío o de solo espacios", async () => {
    await expect(folders.create("   ")).rejects.toMatchObject({ reason: "EMPTY" });
    await expect(folders.create("")).rejects.toBeInstanceOf(FolderNameError);
  });

  it("rechaza un nombre repetido, sin distinguir mayúsculas ni espacios, incluido «Favoritos»", async () => {
    await folders.create("Noche");

    await expect(folders.create(" noche ")).rejects.toMatchObject({ reason: "DUPLICATE" });
    await expect(folders.create("FAVORITOS")).rejects.toMatchObject({ reason: "DUPLICATE" });
  });

  it("renombrar a un nombre ya usado se rechaza; conservar el propio no", async () => {
    const a = await folders.create("A");
    await folders.create("B");

    await expect(folders.rename(a, "b")).rejects.toMatchObject({ reason: "DUPLICATE" });
    await expect(folders.rename(a, "A")).resolves.toBeUndefined();
  });

  it("guarda las etiquetas de la carpeta, normalizadas y sin repetir", async () => {
    const id = await folders.create("Mis seinen", 0, ["Seinen", "seinen", " Acción "]);

    expect(await folders.tags(id)).toEqual(["Acción", "Seinen"]);
  });

  it("borrar la carpeta borra sus etiquetas", async () => {
    const id = await folders.create("X", 0, ["Seinen"]);

    await folders.remove(id);

    expect(await driver.all("SELECT * FROM folder_tag")).toEqual([]);
  });
});

describe("carpeta inteligente · browseLibrary (F53)", () => {
  it("incluye las series con alguna etiqueta de la carpeta, estén donde estén, y las puestas a mano, sin duplicar", async () => {
    await guardar("seinen", ["Seinen"]);
    await guardar("isekai", ["Isekai"]);
    await guardar("manual", ["Terror"]);
    const id = await folders.create("Mis seinen", 0, ["Seinen"]);
    await favorites.move("m", "manual", id);
    await favorites.move("m", "seinen", id); // coincide por etiqueta Y está a mano: sale una vez

    const page = await browseLibrary(driver, { folderId: id, limit: 50 });

    expect(page.items.map((e) => e.seriesId).sort()).toEqual(["manual", "seinen"]);
  });

  it("una carpeta sin etiquetas solo muestra lo puesto a mano", async () => {
    await guardar("a", ["Seinen"]);
    const id = await folders.create("Vacía");

    expect((await browseLibrary(driver, { folderId: id, limit: 50 })).items).toEqual([]);
  });
});
