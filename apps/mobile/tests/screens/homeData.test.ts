import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { SqlDriver } from "@ryuunest/core";

import {
  openMigratedDriver,
  type NodeSqliteDriver,
} from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { loadHomeData, resolveHomeData } from "../../src/screens/home/homeData";
import { EMPTY_HOME_DATA, SAMPLE_HOME_DATA } from "../../src/screens/home/homeFixtures";

/**
 * F46 — Inicio (Guarida) lee del núcleo: progreso y favoritos con `browseLibrary`
 * (T23) y carpetas con `Folders` (T22). Se prueba contra SQLite real (`node:sqlite`).
 */
let driver: NodeSqliteDriver;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

async function addSeries(
  db: SqlDriver,
  s: {
    id: string;
    title: string;
    moduleId?: string;
    kind?: string;
    nsfw?: boolean;
    status?: string;
    folderId?: number | null;
    progress?: {
      chapterId: string;
      title: string | null;
      page: number;
      total: number | null;
      at: number;
    };
  },
): Promise<void> {
  const moduleId = s.moduleId ?? "mod-a";
  await db.run(
    `INSERT INTO series (module_id, series_id, title, title_norm, kind, nsfw, status, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      moduleId,
      s.id,
      s.title,
      s.title.toLowerCase(),
      s.kind ?? "manga",
      s.nsfw === true ? 1 : 0,
      s.status ?? "ongoing",
      1,
    ],
  );
  await db.run(
    `INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    [moduleId, s.id, s.folderId ?? null, 1, 1],
  );
  if (s.progress !== undefined) {
    await db.run(
      `INSERT INTO progress (module_id, series_id, chapter_id, chapter_title, page_index, page_total, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        moduleId,
        s.id,
        s.progress.chapterId,
        s.progress.title,
        s.progress.page,
        s.progress.total,
        s.progress.at,
      ],
    );
  }
}

async function addFolder(db: SqlDriver, id: number, name: string): Promise<void> {
  await db.run("INSERT INTO folder (id, name, sort, updated_at) VALUES (?, ?, ?, ?)", [
    id,
    name,
    id,
    1,
  ]);
}

describe("resolveHomeData (F46)", () => {
  it("sin base de datos en la plataforma (web) usa la reserva de ejemplo", async () => {
    expect(await resolveHomeData(async () => null, SAMPLE_HOME_DATA)).toBe(SAMPLE_HOME_DATA);
  });

  it("con base de datos lee del núcleo, no de la reserva", async () => {
    await addSeries(driver, {
      id: "real",
      title: "Real",
      progress: { chapterId: "c1", title: "Capítulo 1", page: 0, total: 10, at: 5 },
    });

    const data = await resolveHomeData(async () => driver, SAMPLE_HOME_DATA);

    expect(data.continueReading?.seriesId).toBe("real");
  });

  it("una base vacía da el estado vacío real, sin sembrar nada", async () => {
    expect(await resolveHomeData(async () => driver, SAMPLE_HOME_DATA)).toEqual(EMPTY_HOME_DATA);
    expect(await driver.get("SELECT COUNT(*) AS n FROM favorite")).toEqual({ n: 0 });
  });
});

describe("loadHomeData (F46)", () => {
  it("«Continuar» es la serie leída más recientemente, con capítulo y página guardados", async () => {
    await addSeries(driver, {
      id: "old",
      title: "Vieja",
      progress: { chapterId: "c1", title: "Capítulo 3", page: 1, total: 10, at: 100 },
    });
    await addSeries(driver, {
      id: "new",
      title: "Nueva",
      kind: "manhwa",
      status: "hiatus",
      progress: { chapterId: "c41", title: "Capítulo 41", page: 11, total: 38, at: 900 },
    });

    const data = await loadHomeData(driver);

    expect(data.continueReading).toMatchObject({
      moduleId: "mod-a",
      seriesId: "new",
      chapterId: "c41",
      title: "Nueva",
      kind: "manhwa",
      chapterLabel: "Capítulo 41",
      chapterNumber: 41,
      pageIndex: 11,
      pageTotal: 38,
    });
    expect(data.continueReading?.meta).toContain("mod-a");
    expect(data.recent.map((r) => r.seriesId)).toEqual(["new", "old"]);
  });

  it("las series sin progreso no salen en «Continuar» ni en recientes", async () => {
    await addSeries(driver, { id: "sin", title: "Sin leer" });

    const data = await loadHomeData(driver);

    expect(data.continueReading).toBeNull();
    expect(data.recent).toEqual([]);
  });

  it("cuenta lo leído sin guardar en favoritos", async () => {
    await driver.run(
      `INSERT INTO progress (module_id, series_id, chapter_id, chapter_title, page_index, page_total, updated_at)
       VALUES ('mod-a', 'suelta', 'c1', 'Capítulo 1', 3, 9, 7)`,
    );

    expect((await loadHomeData(driver)).continueReading).toMatchObject({
      seriesId: "suelta",
      pageIndex: 3,
    });
  });

  it("recientes: máximo 6", async () => {
    for (let i = 0; i < 8; i++) {
      await addSeries(driver, {
        id: `s${i}`,
        title: `Serie ${i}`,
        progress: { chapterId: "c", title: "Cap. 1", page: 0, total: 5, at: i + 1 },
      });
    }

    const data = await loadHomeData(driver);

    expect(data.recent).toHaveLength(6);
    expect(data.recent[0]?.seriesId).toBe("s7");
  });

  it("el NSFW se oculta salvo que se pida (RF-35)", async () => {
    await addSeries(driver, {
      id: "n",
      title: "Adulta",
      nsfw: true,
      progress: { chapterId: "c", title: "Cap. 1", page: 0, total: 5, at: 1 },
    });

    expect((await loadHomeData(driver)).continueReading).toBeNull();
    expect((await loadHomeData(driver, { nsfwVisible: true })).continueReading?.seriesId).toBe("n");
  });

  it("sin progreso total ni título de capítulo no inventa datos", async () => {
    await addSeries(driver, {
      id: "x",
      title: "X",
      progress: { chapterId: "ch-9", title: null, page: 2, total: null, at: 1 },
    });

    const { continueReading } = await loadHomeData(driver);

    expect(continueReading).toMatchObject({ chapterLabel: "ch-9", pageTotal: 0, pageIndex: 2 });
  });

  it("carpetas con series y su número; las vacías no salen; máximo 4", async () => {
    for (let id = 1; id <= 6; id++) await addFolder(driver, id, `Carpeta ${id}`);
    await addSeries(driver, { id: "a", title: "A", folderId: 1 });
    await addSeries(driver, { id: "b", title: "B", folderId: 1 });
    await addSeries(driver, { id: "c", title: "C", folderId: 2 });
    for (const [i, folderId] of [3, 4, 5, 6].entries()) {
      await addSeries(driver, { id: `f${i}`, title: `F${i}`, folderId });
    }

    const { folders } = await loadHomeData(driver);

    expect(folders).toHaveLength(4);
    expect(folders[0]).toEqual({ id: "1", name: "Carpeta 1", count: 2 });
    expect(folders.every((f) => f.count > 0)).toBe(true);
  });

  it("una carpeta sin series no aparece", async () => {
    await addFolder(driver, 1, "Vacía");

    expect((await loadHomeData(driver)).folders).toEqual([]);
  });
});
