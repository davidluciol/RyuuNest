import { beforeEach, describe, expect, it } from "vitest";

import { FixedClock } from "../../src/ports/fakes";
import { ChapterReadStore } from "../../src/progress/ChapterReadStore";
import { ProgressStore } from "../../src/progress/ProgressStore";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * T26 — capítulos leídos (SPEC §8.1 `chapter_read`; RF-32).
 *
 * Marcar y desmarcar a mano, y consultar el conjunto de leídos de una serie **sin
 * contadores** (RF-42 es v2). Además, terminar el capítulo lo marca solo: cuando el progreso
 * (T25) guarda la **última página** del capítulo, avisa al marcador si se le dio uno.
 */

const MODULO = "tmo";
const SERIE = "s-1";

let driver: SqlDriver;
let clock: FixedClock;
let leidos: ChapterReadStore;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  leidos = new ChapterReadStore({ driver, clock });
});

describe("ChapterReadStore · marcar y desmarcar (RF-32)", () => {
  it("sin capítulos leídos el conjunto de la serie está vacío", async () => {
    await expect(leidos.readIn(MODULO, SERIE)).resolves.toEqual(new Set());
    await expect(leidos.isRead(MODULO, SERIE, "cap-1")).resolves.toBe(false);
  });

  it("marcar un capítulo lo deja leído y desmarcarlo lo quita", async () => {
    await leidos.markRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1" });

    await expect(leidos.isRead(MODULO, SERIE, "cap-1")).resolves.toBe(true);
    await expect(leidos.readIn(MODULO, SERIE)).resolves.toEqual(new Set(["cap-1"]));

    await leidos.unmarkRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1" });

    await expect(leidos.isRead(MODULO, SERIE, "cap-1")).resolves.toBe(false);
    await expect(leidos.readIn(MODULO, SERIE)).resolves.toEqual(new Set());
  });

  it("desmarcar un capítulo que no estaba leído no falla", async () => {
    await expect(
      leidos.unmarkRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-9" }),
    ).resolves.toBeUndefined();
  });

  it("volver a marcar el mismo capítulo actualiza `read_at` y no duplica filas", async () => {
    await leidos.markRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1" });
    clock.set(5_000);
    await leidos.markRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1" });

    const filas = await driver.all<{ n: number; read_at: number }>(
      "SELECT COUNT(*) AS n, MAX(read_at) AS read_at FROM chapter_read",
    );
    expect(filas[0]?.n).toBe(1);
    expect(filas[0]?.read_at).toBe(5_000);
  });

  it("el conjunto es por serie y por módulo: nada se pisa", async () => {
    await leidos.markRead({ moduleId: MODULO, seriesId: "a", chapterId: "cap-1" });
    await leidos.markRead({ moduleId: MODULO, seriesId: "b", chapterId: "cap-1" });
    await leidos.markRead({ moduleId: "otro", seriesId: "a", chapterId: "cap-1" });

    await expect(leidos.readIn(MODULO, "a")).resolves.toEqual(new Set(["cap-1"]));
    await expect(leidos.readIn(MODULO, "b")).resolves.toEqual(new Set(["cap-1"]));

    await leidos.unmarkRead({ moduleId: MODULO, seriesId: "a", chapterId: "cap-1" });

    await expect(leidos.readIn(MODULO, "a")).resolves.toEqual(new Set());
    await expect(leidos.readIn(MODULO, "b")).resolves.toEqual(new Set(["cap-1"]));
    await expect(leidos.readIn("otro", "a")).resolves.toEqual(new Set(["cap-1"]));
  });

  it("devuelve todos los leídos de una serie, sin contadores (RF-42 es v2)", async () => {
    await leidos.markRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1" });
    await leidos.markRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-3" });

    await expect(leidos.readIn(MODULO, SERIE)).resolves.toEqual(new Set(["cap-1", "cap-3"]));
  });
});

describe("ChapterReadStore · terminar el capítulo lo marca solo (RF-32)", () => {
  it("guardar la última página del capítulo lo marca como leído", async () => {
    const progreso = new ProgressStore({ driver, clock, chapterRead: leidos });

    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-2",
      pageIndex: 39,
      pageTotal: 40,
    });

    await expect(leidos.isRead(MODULO, SERIE, "cap-2")).resolves.toBe(true);
  });

  it("una página intermedia no lo marca", async () => {
    const progreso = new ProgressStore({ driver, clock, chapterRead: leidos });

    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-2",
      pageIndex: 10,
      pageTotal: 40,
    });

    await expect(leidos.isRead(MODULO, SERIE, "cap-2")).resolves.toBe(false);
  });

  it("sin total de páginas no se puede saber si terminó: no marca nada", async () => {
    const progreso = new ProgressStore({ driver, clock, chapterRead: leidos });

    await progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-2", pageIndex: 5 });

    await expect(leidos.isRead(MODULO, SERIE, "cap-2")).resolves.toBe(false);
  });

  it("sin marcador inyectado el progreso no toca `chapter_read` (núcleo headless)", async () => {
    const progreso = new ProgressStore({ driver, clock });

    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-2",
      pageIndex: 39,
      pageTotal: 40,
    });

    const filas = await driver.all<{ n: number }>("SELECT COUNT(*) AS n FROM chapter_read");
    expect(filas[0]?.n).toBe(0);
  });

  it("las escrituras concurrentes de la última página dejan una sola fila", async () => {
    const progreso = new ProgressStore({ driver, clock, chapterRead: leidos });

    await Promise.all(
      Array.from({ length: 20 }, () =>
        progreso.save({
          moduleId: MODULO,
          seriesId: SERIE,
          chapterId: "cap-2",
          pageIndex: 39,
          pageTotal: 40,
        }),
      ),
    );

    const filas = await driver.all<{ n: number }>("SELECT COUNT(*) AS n FROM chapter_read");
    expect(filas[0]?.n).toBe(1);
  });

  it("marcar a mano y terminar el capítulo convergen en la misma fila", async () => {
    const progreso = new ProgressStore({ driver, clock, chapterRead: leidos });

    await leidos.markRead({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-2" });
    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-2",
      pageIndex: 39,
      pageTotal: 40,
    });

    const filas = await driver.all<{ n: number }>("SELECT COUNT(*) AS n FROM chapter_read");
    expect(filas[0]?.n).toBe(1);
    await expect(leidos.readIn(MODULO, SERIE)).resolves.toEqual(new Set(["cap-2"]));
  });
});
