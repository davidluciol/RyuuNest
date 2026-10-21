import { beforeEach, describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import { FixedClock } from "../../src/ports/fakes";
import { ProgressStore } from "../../src/progress/ProgressStore";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * T25 — progreso atómico y reanudación (SPEC §8.1 `progress`, §3.6; RF-20, RF-31, RF-41).
 *
 * **Un registro por serie** (clave `module_id, series_id`): dónde se quedó el lector
 * —capítulo, versión de publicación y página— más el total de páginas del capítulo, que es
 * lo que alimenta la barra de progreso. El retardo (debounce) y el guardado «al salir» son
 * de la interfaz; aquí solo se guarda y se lee.
 */

const MODULO = "tmo";
const SERIE = "s-1";

let driver: SqlDriver;
let clock: FixedClock;
let progreso: ProgressStore;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  progreso = new ProgressStore({ driver, clock });
});

describe("ProgressStore · guardar y leer por serie (RF-31)", () => {
  it("sin lectura guardada no hay fila", async () => {
    await expect(progreso.get(MODULO, SERIE)).resolves.toBeUndefined();
  });

  it("guarda capítulo, versión, página y total, y los relee", async () => {
    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-7",
      releaseId: "grupo-techo",
      chapterTitle: "Capítulo 7",
      pageIndex: 12,
      pageTotal: 40,
    });

    await expect(progreso.get(MODULO, SERIE)).resolves.toEqual({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-7",
      releaseId: "grupo-techo",
      chapterTitle: "Capítulo 7",
      pageIndex: 12,
      pageTotal: 40,
      updatedAt: 1_000,
    });
  });

  it("la versión de publicación y el título del capítulo son opcionales", async () => {
    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-1",
      pageIndex: 0,
    });

    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({
      releaseId: null,
      chapterTitle: null,
      pageIndex: 0,
      pageTotal: null,
    });
  });

  it("avanzar de página sobre el mismo capítulo actualiza la fila, no añade otra", async () => {
    await progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1", pageIndex: 1 });
    await progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1", pageIndex: 2 });
    await progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-2", pageIndex: 0 });

    const filas = await driver.all<{ n: number }>("SELECT COUNT(*) AS n FROM progress");
    expect(filas[0]?.n).toBe(1);
    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({
      chapterId: "cap-2",
      pageIndex: 0,
    });
  });

  it("las series y los módulos no se pisan entre sí", async () => {
    await progreso.save({ moduleId: MODULO, seriesId: "a", chapterId: "c-a", pageIndex: 3 });
    await progreso.save({ moduleId: MODULO, seriesId: "b", chapterId: "c-b", pageIndex: 4 });
    await progreso.save({ moduleId: "otro", seriesId: "a", chapterId: "c-otro", pageIndex: 5 });

    await expect(progreso.get(MODULO, "a")).resolves.toMatchObject({ pageIndex: 3 });
    await expect(progreso.get(MODULO, "b")).resolves.toMatchObject({ pageIndex: 4 });
    await expect(progreso.get("otro", "a")).resolves.toMatchObject({ pageIndex: 5 });
  });
});

describe("ProgressStore · reanudación y `updated_at` (RF-20)", () => {
  it("cerrar y reabrir devuelve la misma página (misma base, otra instancia)", async () => {
    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-9",
      pageIndex: 33,
      pageTotal: 60,
    });

    // Reabrir la app: nueva instancia del almacén sobre la misma base.
    const reabierto = new ProgressStore({ driver, clock: new FixedClock(9_999) });

    await expect(reabierto.get(MODULO, SERIE)).resolves.toMatchObject({
      chapterId: "cap-9",
      pageIndex: 33,
      pageTotal: 60,
    });
  });

  it("cada escritura actualiza `updated_at` (fusión del respaldo, SPEC §8.1)", async () => {
    await progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1", pageIndex: 0 });
    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({ updatedAt: 1_000 });

    clock.set(42_000);
    await progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1", pageIndex: 1 });

    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({ updatedAt: 42_000 });
  });
});

describe("ProgressStore · escrituras concurrentes", () => {
  it("varias escrituras de la misma serie dejan una fila coherente", async () => {
    const escrituras = Array.from({ length: 30 }, (_valor, indice) =>
      progreso.save({
        moduleId: MODULO,
        seriesId: SERIE,
        chapterId: "cap-1",
        pageIndex: indice,
        pageTotal: 100,
      }),
    );

    await Promise.all(escrituras);

    const filas = await driver.all<{ n: number }>("SELECT COUNT(*) AS n FROM progress");
    expect(filas[0]?.n).toBe(1);

    const guardado = await progreso.get(MODULO, SERIE);
    expect(guardado).toBeDefined();
    // La fila es exactamente una de las escrituras: sin campos mezclados ni a medias.
    expect(guardado).toMatchObject({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1", pageTotal: 100 });
    expect(guardado?.pageIndex).toBeGreaterThanOrEqual(0);
    expect(guardado?.pageIndex).toBeLessThan(30);
    expect(Number.isInteger(guardado?.pageIndex)).toBe(true);
  });
});

describe("ProgressStore · datos inválidos", () => {
  it("rechaza una página negativa o no entera sin escribir nada", async () => {
    for (const pageIndex of [-1, 1.5, Number.NaN]) {
      await expect(
        progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-1", pageIndex }),
      ).rejects.toBeInstanceOf(ModuleError);
    }
    await expect(progreso.get(MODULO, SERIE)).resolves.toBeUndefined();
  });

  it("rechaza un total de páginas que no sea un entero positivo", async () => {
    await expect(
      progreso.save({
        moduleId: MODULO,
        seriesId: SERIE,
        chapterId: "cap-1",
        pageIndex: 0,
        pageTotal: 0,
      }),
    ).rejects.toBeInstanceOf(ModuleError);
  });
});
