import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ChapterReadStore,
  ProgressStore,
  type ReaderChapter,
  type SqlDriver,
} from "@ryuunest/core";

import {
  openMigratedDriver,
  type NodeSqliteDriver,
} from "../../../../packages/core/tests/support/nodeSqliteDriver";
import {
  PROGRESS_SAVE_DELAY_MS,
  ReaderController,
} from "../../src/reader/readerController";

/**
 * F18 — el controlador del lector envuelve `ReaderState` (T27): guarda el progreso con
 * retraso corto y al salir (RF-20), reabre en la página exacta, recuerda el modo por serie
 * (RF-18) y marca el capítulo leído al terminarlo (RF-32). SQLite real (`node:sqlite`) y
 * temporizadores simulados.
 */

let driver: NodeSqliteDriver;
const clock = { now: () => Date.now() };

const CHAPTERS: ReaderChapter[] = [
  { chapterId: "ch-1", title: "Capítulo 1" },
  { chapterId: "ch-2", title: "Capítulo 2" },
  { chapterId: "ch-3", title: "Capítulo 3" },
];

beforeEach(async () => {
  vi.useFakeTimers();
  driver = await openMigratedDriver();
});

afterEach(() => {
  vi.useRealTimers();
  driver.close();
});

function controller(
  overrides: Partial<ConstructorParameters<typeof ReaderController>[0]> = {},
): ReaderController {
  return new ReaderController({
    driver,
    clock,
    moduleId: "m-a",
    seriesId: "serie-1",
    kind: "manhwa",
    chapters: CHAPTERS,
    ...overrides,
  });
}

function savedProgress() {
  return new ProgressStore({ driver, clock }).get("m-a", "serie-1");
}

describe("ReaderController · abrir", () => {
  it("abre el capítulo en la página 0, con el modo del tipo de obra y el total de páginas", async () => {
    const reader = controller();
    await reader.open({ chapterId: "ch-1", releaseId: "r-1", pageTotal: 10 });

    expect(reader.snapshot).toMatchObject({
      chapter: { chapterId: "ch-1", releaseId: "r-1", pageTotal: 10 },
      pageIndex: 0,
      pageTotal: 10,
      mode: "vertical",
      finished: false,
    });
  });

  it("reabre en la página exacta que se guardó (RF-20)", async () => {
    const first = controller();
    await first.open({ chapterId: "ch-1", pageTotal: 10 });
    await first.goToPage(6);
    await first.close();

    const second = controller();
    await second.open({ chapterId: "ch-1", pageTotal: 10 });

    expect(second.snapshot.pageIndex).toBe(6);
  });

  it("abrir otro capítulo empieza en su página 0", async () => {
    const first = controller();
    await first.open({ chapterId: "ch-1", pageTotal: 10 });
    await first.goToPage(6);
    await first.close();

    const second = controller();
    await second.open({ chapterId: "ch-2", pageTotal: 8 });
    await second.close();

    expect(second.snapshot).toMatchObject({ chapter: { chapterId: "ch-2" }, pageIndex: 0 });
    expect(await savedProgress()).toMatchObject({ chapterId: "ch-2", pageIndex: 0, pageTotal: 8 });
  });

  it("un capítulo ya terminado se reabre desde el principio, no desde la última página", async () => {
    const first = controller();
    await first.open({ chapterId: "ch-1", pageTotal: 10 });
    await first.goToPage(9);
    await first.close();

    const second = controller();
    await second.open({ chapterId: "ch-1", pageTotal: 10 });

    expect(second.snapshot.pageIndex).toBe(0);
  });
});

describe("ReaderController · guardado del progreso (RF-20)", () => {
  it("guarda page_index y page_total solo tras el retraso corto", async () => {
    const reader = controller();
    await reader.open({ chapterId: "ch-1", pageTotal: 10 });
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS);
    await reader.goToPage(4);

    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS - 1);
    expect(await savedProgress()).toMatchObject({ pageIndex: 0 });

    await vi.advanceTimersByTimeAsync(1);
    expect(await savedProgress()).toMatchObject({ chapterId: "ch-1", pageIndex: 4, pageTotal: 10 });
  });

  it("varios cambios seguidos dejan guardada la última página", async () => {
    const reader = controller();
    await reader.open({ chapterId: "ch-1", pageTotal: 10 });
    await reader.goToPage(1);
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS / 2);
    await reader.goToPage(2);
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS / 2);
    await reader.next();
    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS);

    expect(await savedProgress()).toMatchObject({ pageIndex: 3 });
  });

  it("al salir guarda de inmediato lo pendiente", async () => {
    const reader = controller();
    await reader.open({ chapterId: "ch-1", pageTotal: 10 });
    await reader.goToPage(5);

    await reader.close();

    expect(await savedProgress()).toMatchObject({ pageIndex: 5 });
    expect(reader.snapshot.dirty).toBe(false);
  });

  it("llegar a la última página guarda ya y marca el capítulo como leído (RF-32)", async () => {
    const reader = controller();
    await reader.open({ chapterId: "ch-1", pageTotal: 10 });
    await reader.goToPage(9);

    expect(await savedProgress()).toMatchObject({ pageIndex: 9, pageTotal: 10 });
    expect(await new ChapterReadStore({ driver, clock }).isRead("m-a", "serie-1", "ch-1")).toBe(true);
    expect(reader.snapshot).toMatchObject({
      finished: true,
      nextChapter: { chapterId: "ch-2" },
    });
  });

  it("un fallo al guardar se avisa y no revienta el lector", async () => {
    const failing: SqlDriver = {
      exec: (sql) => driver.exec(sql),
      all: (sql, params) => driver.all(sql, params),
      get: (sql, params) => driver.get(sql, params),
      run: (sql, params) =>
        sql.includes("INSERT INTO progress")
          ? Promise.reject(new Error("disco lleno"))
          : driver.run(sql, params),
    };
    const errors: unknown[] = [];
    const reader = controller({ driver: failing, onSaveError: (error) => errors.push(error) });
    await reader.open({ chapterId: "ch-1", pageTotal: 10 });
    await reader.goToPage(2);

    await vi.advanceTimersByTimeAsync(PROGRESS_SAVE_DELAY_MS);

    expect(errors).toHaveLength(1);
    expect(reader.snapshot.dirty).toBe(true);
  });
});

describe("ReaderController · modo de lectura por serie (RF-18)", () => {
  it("recuerda el modo elegido para la serie y no afecta a otra", async () => {
    const first = controller();
    await first.open({ chapterId: "ch-1", pageTotal: 10 });
    await first.setMode("paged-rtl");

    const sameSeries = controller();
    await sameSeries.open({ chapterId: "ch-1", pageTotal: 10 });
    const otherSeries = controller({ seriesId: "serie-2" });
    await otherSeries.open({ chapterId: "ch-1", pageTotal: 10 });

    expect(sameSeries.snapshot.mode).toBe("paged-rtl");
    expect(otherSeries.snapshot.mode).toBe("vertical");
  });

  it("sin preferencia, manga abre paginado D→I y cómic I→D", async () => {
    const manga = controller({ kind: "manga" });
    await manga.open({ chapterId: "ch-1", pageTotal: 10 });
    const comic = controller({ kind: "comic", seriesId: "serie-3" });
    await comic.open({ chapterId: "ch-1", pageTotal: 10 });

    expect(manga.snapshot.mode).toBe("paged-rtl");
    expect(comic.snapshot.mode).toBe("paged-ltr");
  });
});

describe("ReaderController · suscripción", () => {
  it("avisa a los oyentes en cada cambio y deja de avisar al darse de baja", async () => {
    const reader = controller();
    const pages: number[] = [];
    const unsubscribe = reader.subscribe((snapshot) => pages.push(snapshot.pageIndex));

    await reader.open({ chapterId: "ch-1", pageTotal: 10 });
    await reader.goToPage(3);
    unsubscribe();
    await reader.goToPage(4);

    expect(pages).toEqual([0, 3]);
  });
});
