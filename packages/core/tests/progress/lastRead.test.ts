import { beforeEach, describe, expect, it } from "vitest";

import { FixedClock } from "../../src/ports/fakes";
import { getLastRead, listLastRead } from "../../src/progress/lastRead";
import { ProgressStore } from "../../src/progress/ProgressStore";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F78 — historial «último leído»: una entrada por serie (la última lectura), más reciente
 * primero, aunque la serie no esté en favoritos. Sale de `progress` + `series`.
 */
let driver: SqlDriver;
let clock: FixedClock;
let progress: ProgressStore;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  progress = new ProgressStore({ driver, clock });
});

async function addSeries(id: string, extra: { nsfw?: boolean; title?: string } = {}) {
  await driver.run(
    `INSERT INTO series (module_id, series_id, title, title_norm, cover_url, kind, nsfw, status, updated_at)
     VALUES ('m', ?, ?, ?, 'http://c/x.jpg', 'manhwa', ?, 'hiatus', 1)`,
    [id, extra.title ?? id, (extra.title ?? id).toLowerCase(), extra.nsfw === true ? 1 : 0],
  );
}

async function read(id: string, at: number, page = 0, total: number | null = 10, chapter = "c1") {
  clock.set(at);
  await progress.save({
    moduleId: "m",
    seriesId: id,
    chapterId: chapter,
    releaseId: "r1",
    chapterTitle: `Capítulo ${chapter}`,
    pageIndex: page,
    pageTotal: total,
  });
}

describe("listLastRead / getLastRead (F78)", () => {
  it("sin lecturas: lista vacía y getLastRead undefined", async () => {
    expect(await listLastRead(driver)).toEqual([]);
    expect(await getLastRead(driver)).toBeUndefined();
  });

  it("una entrada por serie, más reciente primero, con todos los datos", async () => {
    await addSeries("a", { title: "Serie A" });
    await addSeries("b");
    await read("a", 100, 2, 10, "c1");
    await read("b", 200);
    await read("a", 300, 4, 10, "c2"); // reemplaza la anterior de «a»

    const list = await listLastRead(driver);

    expect(list.map((e) => e.seriesId)).toEqual(["a", "b"]);
    expect(list[0]).toEqual({
      moduleId: "m",
      seriesId: "a",
      title: "Serie A",
      coverUrl: "http://c/x.jpg",
      kind: "manhwa",
      status: "hiatus",
      nsfw: false,
      chapterId: "c2",
      releaseId: "r1",
      chapterTitle: "Capítulo c2",
      pageIndex: 4,
      pageTotal: 10,
      pagesLeft: 5,
      readAt: 300,
    });
    expect(await getLastRead(driver)).toEqual(list[0]);
  });

  it("cuenta lo leído sin guardar y sin fila en `series`: título = id, sin inventar datos", async () => {
    await read("huerfana", 50, 0, null);

    const [entry] = await listLastRead(driver);

    expect(entry).toMatchObject({
      title: "huerfana",
      coverUrl: null,
      kind: null,
      status: null,
      pageTotal: null,
      pagesLeft: null,
    });
  });

  it("respeta el límite y oculta NSFW salvo que se pida (RF-35)", async () => {
    await addSeries("n", { nsfw: true });
    await addSeries("a");
    await read("n", 900);
    await read("a", 100);

    expect((await listLastRead(driver)).map((e) => e.seriesId)).toEqual(["a"]);
    expect((await listLastRead(driver, { nsfwVisible: true })).map((e) => e.seriesId)).toEqual([
      "n",
      "a",
    ]);
    expect(await listLastRead(driver, { nsfwVisible: true, limit: 1 })).toHaveLength(1);
  });
});
