import { beforeEach, describe, expect, it } from "vitest";

import { Favorites } from "../../src/library/Favorites";
import { SeriesStore } from "../../src/library/SeriesStore";
import { SeriesPrefs } from "../../src/library/SeriesPrefs";
import { removeSeriesFromLibrary } from "../../src/library/removeSeriesFromLibrary";
import { FixedClock } from "../../src/ports/fakes";
import { ChapterReadStore } from "../../src/progress/ChapterReadStore";
import { ProgressStore } from "../../src/progress/ProgressStore";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * Quitar una serie de la biblioteca (P-62, T25b).
 *
 * La operación borra el favorito, el progreso y los capítulos leídos **en una sola
 * transacción**; la fila `series` y `series_pref` se conservan como caché (P-73).
 * Las pruebas corren contra SQLite real para observar la transacción de verdad.
 */

const MODULO = "tmo";
const OTRO_MODULO = "otro";

let driver: SqlDriver;
let clock: FixedClock;
let series: SeriesStore;
let favoritos: Favorites;
let progresos: ProgressStore;
let leidos: ChapterReadStore;
let prefs: SeriesPrefs;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  series = new SeriesStore({ driver, clock });
  favoritos = new Favorites({ driver, clock });
  progresos = new ProgressStore({ driver, clock });
  leidos = new ChapterReadStore({ driver, clock });
  prefs = new SeriesPrefs({ driver, clock });
});

/** Siembra una serie completa: fila, favorito, progreso, un leído y preferencias. */
async function sembrar(moduleId: string, seriesId: string): Promise<void> {
  clock.set(2_000);
  await series.upsert({
    moduleId,
    seriesId,
    title: `Serie ${seriesId}`,
    kind: "manga",
    nsfw: false,
    status: "ongoing",
  });
  await favoritos.add(moduleId, seriesId, null);
  await progresos.save({
    moduleId,
    seriesId,
    chapterId: "cap-4",
    chapterTitle: "El cuarto",
    pageIndex: 7,
    pageTotal: 30,
  });
  await leidos.markRead({ moduleId, seriesId, chapterId: "cap-3" });
  await prefs.setReaderMode(moduleId, seriesId, "paged-rtl");
  await prefs.setPreferredGroup(moduleId, seriesId, "grupo-oficial");
}

/** Envuelve un driver y hace fallar la escritura número `fallaEn` (cuenta desde 1). */
function conFalloEnEscritura(inner: SqlDriver, fallaEn: number): SqlDriver {
  let escrituras = 0;
  return {
    exec: (sql) => inner.exec(sql),
    all: (sql, params) => inner.all(sql, params),
    get: (sql, params) => inner.get(sql, params),
    run: (sql, params) => {
      escrituras += 1;
      if (escrituras === fallaEn) {
        return Promise.reject(new Error("disco lleno (simulado)"));
      }
      return inner.run(sql, params);
    },
  };
}

/** Comprueba que una serie sigue completa (no la tocó un borrado ajeno). */
async function esperarIntacta(moduleId: string, seriesId: string): Promise<void> {
  expect(await series.get(moduleId, seriesId)).toBeDefined();
  expect(await favoritos.get(moduleId, seriesId)).toBeDefined();
  expect(await progresos.get(moduleId, seriesId)).toBeDefined();
  expect(await leidos.isRead(moduleId, seriesId, "cap-3")).toBe(true);
  expect(await prefs.get(moduleId, seriesId)).toBeDefined();
}

describe("removeSeriesFromLibrary · borra lo que la biblioteca mostraba", () => {
  it("quita el favorito, el progreso y los capítulos leídos de la serie", async () => {
    await sembrar(MODULO, "s-1");

    await removeSeriesFromLibrary({ driver, moduleId: MODULO, seriesId: "s-1" });

    expect(await favoritos.get(MODULO, "s-1")).toBeUndefined();
    expect(await progresos.get(MODULO, "s-1")).toBeUndefined();
    expect(await leidos.readIn(MODULO, "s-1")).toEqual(new Set());
  });

  it("conserva la fila series y series_pref como caché (P-73)", async () => {
    await sembrar(MODULO, "s-1");

    await removeSeriesFromLibrary({ driver, moduleId: MODULO, seriesId: "s-1" });

    expect(await favoritos.get(MODULO, "s-1")).toBeUndefined();
    const fila = await series.get(MODULO, "s-1");
    expect(fila?.title).toBe("Serie s-1");
    const preferencia = await prefs.get(MODULO, "s-1");
    expect(preferencia?.readerMode).toBe("paged-rtl");
    expect(preferencia?.preferredGroup).toBe("grupo-oficial");
  });

  it("no toca otras series ni la misma id de otro módulo", async () => {
    await sembrar(MODULO, "s-1");
    await sembrar(MODULO, "s-2");
    await sembrar(OTRO_MODULO, "s-1");

    await removeSeriesFromLibrary({ driver, moduleId: MODULO, seriesId: "s-1" });

    expect(await favoritos.get(MODULO, "s-1")).toBeUndefined();
    await esperarIntacta(MODULO, "s-2");
    await esperarIntacta(OTRO_MODULO, "s-1");
  });

  it("no falla si la serie no estaba en la biblioteca", async () => {
    await expect(
      removeSeriesFromLibrary({ driver, moduleId: MODULO, seriesId: "no-existe" }),
    ).resolves.toBeUndefined();
  });
});

describe("removeSeriesFromLibrary · atomicidad", () => {
  it("revierte todo si una escritura falla a mitad", async () => {
    await sembrar(MODULO, "s-1");
    const roto = conFalloEnEscritura(driver, 2);

    await expect(
      removeSeriesFromLibrary({ driver: roto, moduleId: MODULO, seriesId: "s-1" }),
    ).rejects.toThrow("disco lleno");

    expect(await favoritos.get(MODULO, "s-1")).toBeDefined();
    expect(await progresos.get(MODULO, "s-1")).toBeDefined();
    expect(await leidos.isRead(MODULO, "s-1", "cap-3")).toBe(true);
  });
});
