import { beforeEach, describe, expect, it } from "vitest";

import type { SeriesDetails } from "../../src/contract/types";
import { Favorites } from "../../src/library/Favorites";
import { browseLibrary } from "../../src/library/queries";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock } from "../../src/ports/fakes";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F47 — las portadas que exigen cabeceras (M440, YupManga) se guardan con ellas: `saveFromDetails`
 * las persiste en `series.cover_headers` y `browseLibrary` las devuelve junto a `coverUrl`.
 */

let driver: SqlDriver;
let series: SeriesStore;

beforeEach(async () => {
  driver = await openMigratedDriver();
  series = new SeriesStore({ driver, clock: new FixedClock(1_000) });
});

function detalles(cover: SeriesDetails["cover"]): SeriesDetails {
  return {
    id: "a",
    title: "A",
    genres: [],
    nsfw: false,
    status: "ongoing",
    kind: "manga",
    ...(cover === undefined ? {} : { cover }),
  } as unknown as SeriesDetails;
}

async function biblioteca() {
  await new Favorites({ driver, clock: new FixedClock(1_000) }).add("m", "a", null);
  return (await browseLibrary(driver, { limit: 10 })).items[0];
}

describe("cabeceras de portada (F47)", () => {
  it("saveFromDetails guarda las cabeceras y la biblioteca las devuelve", async () => {
    await series.saveFromDetails(
      "m",
      detalles({
        url: "https://x.test/a.jpg",
        headers: { Referer: "https://x.test/", Cookie: "s=1" },
      }),
    );

    expect((await series.get("m", "a"))?.coverHeaders).toEqual({
      Referer: "https://x.test/",
      Cookie: "s=1",
    });
    expect((await biblioteca())?.coverHeaders).toEqual({
      Referer: "https://x.test/",
      Cookie: "s=1",
    });
  });

  it("una portada sin cabeceras las deja en null", async () => {
    await series.saveFromDetails("m", detalles({ url: "https://x.test/a.jpg" }));

    expect((await biblioteca())?.coverHeaders).toBeNull();
  });

  it("al guardar de nuevo se refrescan (cookies que caducan) y se pueden quitar", async () => {
    await series.saveFromDetails("m", detalles({ url: "u", headers: { Cookie: "viejo" } }));
    await series.saveFromDetails("m", detalles({ url: "u", headers: { Cookie: "nuevo" } }));
    expect((await series.get("m", "a"))?.coverHeaders).toEqual({ Cookie: "nuevo" });

    await series.saveFromDetails("m", detalles({ url: "u" }));
    expect((await series.get("m", "a"))?.coverHeaders).toBeNull();
  });

  it("una fila anterior a la migración (sin cabeceras) sigue siendo válida", async () => {
    await series.upsert({ moduleId: "m", seriesId: "a", title: "A", coverUrl: "u" });

    expect((await series.get("m", "a"))?.coverHeaders).toBeNull();
  });
});
