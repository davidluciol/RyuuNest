import { beforeEach, describe, expect, it } from "vitest";

import type { SeriesDetails } from "../../src/contract/types";
import { Favorites } from "../../src/library/Favorites";
import { Folders } from "../../src/library/Folders";
import { browseLibrary } from "../../src/library/queries";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock } from "../../src/ports/fakes";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F55 (P-164) — búsqueda por palabras (sin tildes ni mayúsculas, en cualquier orden) y filtro
 * por categoría (etiquetas de las series guardadas): sale la serie con **alguna** de las
 * marcadas; con filtros activos solo salen las que coinciden, con o sin texto.
 */

let driver: SqlDriver;
let series: SeriesStore;
let favorites: Favorites;

beforeEach(async () => {
  driver = await openMigratedDriver();
  const clock = new FixedClock(1_000);
  series = new SeriesStore({ driver, clock });
  favorites = new Favorites({ driver, clock });
  await guardar("a", "El dragón de ceniza", ["Acción", "Fantasía"], "manhwa");
  await guardar("b", "Ceniza y brasas", ["Seinen"], "manga");
  await guardar("c", "Noche de ámbar", ["Seinen", "Isekai"], "manga");
  await guardar("d", "Sin etiquetas", [], "manga");
});

async function guardar(id: string, title: string, genres: string[], kind: string): Promise<void> {
  await series.saveFromDetails("m", { id, title, genres, nsfw: false, status: "ongoing", kind } as SeriesDetails);
  await favorites.add("m", id, null);
}

async function buscar(filtro: Parameters<typeof browseLibrary>[1] extends infer F ? Partial<F> : never): Promise<string[]> {
  const page = await browseLibrary(driver, { limit: 50, ...filtro });
  return page.items.map((e) => e.seriesId).sort();
}

describe("búsqueda por palabras (F55)", () => {
  it("varias palabras en cualquier orden, sin tildes ni mayúsculas", async () => {
    expect(await buscar({ search: "CENIZA dragon" })).toEqual(["a"]);
    expect(await buscar({ search: "ceniza" })).toEqual(["a", "b"]);
  });

  it("una palabra que no está en ninguna serie no devuelve nada", async () => {
    expect(await buscar({ search: "ceniza lobo" })).toEqual([]);
  });

  it("los espacios sobrantes no cuentan y el comodín % del usuario no es comodín", async () => {
    expect(await buscar({ search: "   dragon   " })).toEqual(["a"]);
    expect(await buscar({ search: "%" })).toEqual([]);
  });
});

describe("filtro por categoría (F55)", () => {
  it("sale la serie con alguna de las etiquetas marcadas (sin tildes ni mayúsculas)", async () => {
    expect(await buscar({ tags: ["seinen"] })).toEqual(["b", "c"]);
    expect(await buscar({ tags: ["accion", "ISEKAI"] })).toEqual(["a", "c"]);
  });

  it("sin etiquetas marcadas no filtra", async () => {
    expect(await buscar({ tags: [] })).toHaveLength(4);
  });

  it("se combina con el texto, el tipo y la carpeta", async () => {
    expect(await buscar({ tags: ["seinen"], search: "ceniza" })).toEqual(["b"]);
    expect(await buscar({ tags: ["seinen"], kinds: ["manhwa"] })).toEqual([]);
    const carpetas = new Folders({ driver, clock: new FixedClock(1) });
    const id = await carpetas.create("Mis fantasía", 1, ["Fantasía"]);
    expect(await buscar({ folderId: id, tags: ["acción"] })).toEqual(["a"]);
    expect(await buscar({ folderId: id, tags: ["seinen"] })).toEqual([]);
  });
});
