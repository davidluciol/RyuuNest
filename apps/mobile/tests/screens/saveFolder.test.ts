import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Favorites, Folders, type SeriesDetails } from "@ryuunest/core";

import {
  openMigratedDriver,
  type NodeSqliteDriver,
} from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { createAndSave, loadSaveOptions, saveInFolder } from "../../src/screens/series/saveFolder";

/**
 * F96 — hoja «Guardar» de la ficha: carpetas elegibles (Gemas, Favoritos y las del usuario), marca
 * de la actual, guardar/mover y crear+guardar. Una sola carpeta por serie (D-12).
 */

const DETAILS: SeriesDetails = {
  id: "s",
  title: "La serie",
  cover: null,
  kind: "manga",
  nsfw: false,
  status: "ongoing",
  genres: [],
  chapters: [],
} as unknown as SeriesDetails;

let driver: NodeSqliteDriver;
const clock = { now: () => 5_000 };

beforeEach(async () => {
  driver = await openMigratedDriver();
});
afterEach(() => driver.close());

describe("loadSaveOptions", () => {
  it("sin carpetas propias lista Gemas y Favoritos, con Gemas como actual aunque no esté guardada", async () => {
    const state = await loadSaveOptions(driver, "m", "s");

    expect(state.options.map((o) => o.name)).toEqual(["Gemas", "Favoritos"]);
    expect(state.currentId).toBe("gems");
    expect(state.saved).toBe(false);
    expect(state.favoritesId).toBe(state.options.find((o) => o.name === "Favoritos")?.id);
  });

  it("incluye las carpetas del usuario y marca la actual", async () => {
    const id = await new Folders({ driver, clock }).create("Mis lecturas", 5);
    await saveInFolder(driver, "m", "s", DETAILS, String(id));

    const state = await loadSaveOptions(driver, "m", "s");

    expect(state.options.map((o) => o.name)).toEqual(["Gemas", "Favoritos", "Mis lecturas"]);
    expect(state).toMatchObject({ currentId: String(id), saved: true });
  });
});

describe("saveInFolder", () => {
  it("sin guardar: guarda la serie en esa carpeta; guardada: la mueve (una sola carpeta)", async () => {
    const folders = new Folders({ driver, clock });
    const a = await folders.create("A", 5);
    const b = await folders.create("B", 6);

    await saveInFolder(driver, "m", "s", DETAILS, String(a));
    expect((await new Favorites({ driver, clock }).get("m", "s"))?.folderId).toBe(a);

    await saveInFolder(driver, "m", "s", DETAILS, String(b));
    expect((await new Favorites({ driver, clock }).get("m", "s"))?.folderId).toBe(b);
  });

  it("«gems» la deja guardada sin carpeta", async () => {
    await saveInFolder(driver, "m", "s", DETAILS, "gems");

    expect(await new Favorites({ driver, clock }).get("m", "s")).toMatchObject({ folderId: null });
  });
});

describe("createAndSave", () => {
  it("crea la carpeta y guarda la serie en ella", async () => {
    expect(await createAndSave(driver, "m", "s", DETAILS, "Nueva", ["Seinen"])).toBeNull();

    const state = await loadSaveOptions(driver, "m", "s");
    const nueva = state.options.find((o) => o.name === "Nueva");
    expect(state.currentId).toBe(nueva?.id);
  });

  it("nombre repetido: devuelve el problema y no deja la serie guardada", async () => {
    expect(await createAndSave(driver, "m", "s", DETAILS, "favoritos", [])).toBe("DUPLICATE");

    expect((await loadSaveOptions(driver, "m", "s")).saved).toBe(false);
  });
});
