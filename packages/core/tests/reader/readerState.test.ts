import { beforeEach, describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import { SeriesPrefs } from "../../src/library/SeriesPrefs";
import { FixedClock } from "../../src/ports/fakes";
import { ChapterReadStore } from "../../src/progress/ChapterReadStore";
import { ProgressStore } from "../../src/progress/ProgressStore";
import { ReaderState, type ReaderChapter } from "../../src/reader/ReaderState";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * T27 — máquina de estados del lector, **headless** (SPEC §9; RF-18, RF-20, RF-21, RF-32).
 *
 * El estado vive en el núcleo, sin UI: modos de lectura, navegación anterior/siguiente,
 * salto entre capítulos, límites de capítulo y disparo del guardado de progreso (con
 * `page_total`) y de «capítulo terminado». El render (decodificar, precarcar, liberar) es
 * Parte 2: aquí solo se declara la **ventana de páginas** a mantener (`snapshot.window`).
 *
 * Páginas **base 0** (P-61): un capítulo de `page_total` páginas ocupa `0 … page_total-1`
 * y el estado nunca pasa de `page_total`. Llegar a la última página es «terminar el
 * capítulo»: se guarda de inmediato y se marca leído (T26).
 */

const MODULO = "tmo";
const SERIE = "s-1";

/** Capítulos en orden de lectura (del primero al último). */
const CAPITULOS: readonly ReaderChapter[] = [
  { chapterId: "cap-1", releaseId: "g1", title: "Cap. 1", pageTotal: 12 },
  { chapterId: "cap-2", releaseId: "g1", title: "Cap. 2", pageTotal: 60 },
  { chapterId: "cap-3", releaseId: "g2", title: "Cap. 3", pageTotal: 5 },
];

let driver: SqlDriver;
let clock: FixedClock;
let prefs: SeriesPrefs;
let leidos: ChapterReadStore;
let progreso: ProgressStore;

function crearLector(
  capitulos: readonly ReaderChapter[] = CAPITULOS,
  kind: "manga" | "manhua" | "comic" | null = "manga",
) {
  return new ReaderState({ progress: progreso, prefs, chapters: capitulos, kind });
}

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  prefs = new SeriesPrefs({ driver, clock });
  leidos = new ChapterReadStore({ driver, clock });
  progreso = new ProgressStore({ driver, clock, chapterRead: leidos });
});

describe("ReaderState · estado inicial y apertura de serie", () => {
  it("sin serie abierta el estado está vacío y navegar lanza `ModuleError`", async () => {
    const lector = crearLector();

    expect(lector.snapshot).toEqual({
      moduleId: null,
      seriesId: null,
      mode: null,
      chapter: null,
      pageIndex: 0,
      pageTotal: null,
      finished: false,
      nextChapter: null,
      previousChapter: null,
      window: null,
      dirty: false,
    });

    await expect(lector.next()).rejects.toBeInstanceOf(ModuleError);
    await expect(lector.previous()).rejects.toBeInstanceOf(ModuleError);
    await expect(lector.goToPage(3)).rejects.toBeInstanceOf(ModuleError);
    await expect(lector.flush()).resolves.toBeUndefined();
  });

  it("openSeries aplica el modo que corresponde al tipo de obra (RF-18)", async () => {
    const manga = crearLector(CAPITULOS, "manga");
    await expect(manga.openSeries(MODULO, SERIE)).resolves.toMatchObject({ mode: "paged-rtl" });

    const manhua = crearLector(CAPITULOS, "manhua");
    await expect(manhua.openSeries(MODULO, SERIE)).resolves.toMatchObject({ mode: "vertical" });

    const comic = crearLector(CAPITULOS, "comic");
    await expect(comic.openSeries(MODULO, SERIE)).resolves.toMatchObject({ mode: "paged-ltr" });
  });

  it("sin tipo de obra ni preferencia el modo queda null (decide el ajuste global, F20)", async () => {
    const lector = crearLector(CAPITULOS, null);

    await expect(lector.openSeries(MODULO, SERIE)).resolves.toMatchObject({ mode: null });
  });
});

describe("ReaderState · modo de lectura (T24, RF-18)", () => {
  it("cambiar de modo actualiza la preferencia de la serie", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);

    await expect(lector.setMode("vertical")).resolves.toMatchObject({ mode: "vertical" });
    await expect(prefs.modeFor(MODULO, SERIE, "manga")).resolves.toBe("vertical");
  });

  it("la preferencia se respeta al reabrir la serie (antes que el modo del tipo)", async () => {
    const primero = crearLector();
    await primero.openSeries(MODULO, SERIE);
    await primero.setMode("vertical");

    const segundo = crearLector();
    await expect(segundo.openSeries(MODULO, SERIE)).resolves.toMatchObject({ mode: "vertical" });
  });

  it("setMode rechaza un modo que no es del contrato", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);

    await expect(lector.setMode("horizontal" as never)).rejects.toMatchObject({ code: "INTERNAL" });
  });
});

describe("ReaderState · navegación dentro de un capítulo (RF-20)", () => {
  it("next, previous y goToPage mueven la página dentro del capítulo", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-1");

    await expect(lector.next()).resolves.toMatchObject({ pageIndex: 1, pageTotal: 12 });
    await expect(lector.next()).resolves.toMatchObject({ pageIndex: 2 });
    await expect(lector.previous()).resolves.toMatchObject({ pageIndex: 1 });
    await expect(lector.goToPage(7)).resolves.toMatchObject({ pageIndex: 7 });
    expect(lector.snapshot.chapter).toMatchObject({ chapterId: "cap-1" });
  });

  it("el cambio de página queda pendiente y `flush()` guarda con `page_total`", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-1");

    // Abrir capítulo y avanzar marcan pendiente, pero todavía no escriben.
    expect(lector.snapshot.dirty).toBe(true);
    await lector.next();
    await expect(progreso.get(MODULO, SERIE)).resolves.toBeUndefined();

    await lector.flush();

    await expect(progreso.get(MODULO, SERIE)).resolves.toEqual({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-1",
      releaseId: "g1",
      chapterTitle: "Cap. 1",
      pageIndex: 1,
      pageTotal: 12,
      updatedAt: 1_000,
    });
    expect(lector.snapshot.dirty).toBe(false);
  });

  it("`flush()` es idempotente: no reescribe lo ya guardado", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-1");
    await lector.next();
    await lector.flush();

    clock.set(9_999);
    await lector.flush();

    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({
      pageIndex: 1,
      updatedAt: 1_000,
    });
  });

  it("`page_index` respeta los límites: ni negativo ni mayor que `page_total`", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-1");

    await expect(lector.goToPage(-4)).resolves.toMatchObject({ pageIndex: 0 });
    await expect(lector.previous()).resolves.toMatchObject({ pageIndex: 0 });
    await expect(lector.goToPage(999)).resolves.toMatchObject({ pageIndex: 11 });

    const snap = lector.snapshot;
    expect(snap.pageIndex).toBeGreaterThanOrEqual(0);
    expect(snap.pageIndex).toBeLessThanOrEqual(snap.pageTotal ?? 0);
  });

  it("goToPage con un índice que no es entero lanza `ModuleError`", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-1");

    await expect(lector.goToPage(2.5)).rejects.toBeInstanceOf(ModuleError);
    await expect(lector.goToPage(Number.NaN)).rejects.toBeInstanceOf(ModuleError);
  });

  it("sin `page_total` el estado avanza sin tope superior y nunca termina", async () => {
    const lector = crearLector([{ chapterId: "cap-x", title: "Cap. X" }]);
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-x");

    await expect(lector.next()).resolves.toMatchObject({
      pageIndex: 1,
      pageTotal: null,
      finished: false,
    });
    await expect(lector.next()).resolves.toMatchObject({ pageIndex: 2, finished: false });
    await expect(lector.goToPage(500)).resolves.toMatchObject({ pageIndex: 500, finished: false });
    await expect(lector.goToPage(-2)).resolves.toMatchObject({ pageIndex: 0 });
  });
});

describe("ReaderState · salto entre capítulos", () => {
  it("openChapter salta a otro capítulo empezando en su página 0", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-1");
    await lector.next();
    await lector.next();

    const salto = await lector.openChapter("cap-3");

    expect(salto).toMatchObject({ chapter: { chapterId: "cap-3" }, pageIndex: 0, pageTotal: 5 });
    expect(salto.nextChapter).toBeNull();
    expect(salto.previousChapter).toMatchObject({ chapterId: "cap-2" });
    expect(salto.dirty).toBe(true);
  });

  it("openChapter con un capítulo que no está en la serie lanza `NOT_FOUND`", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);

    await expect(lector.openChapter("cap-x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("openNextChapter y openPreviousChapter recorren la lista; en los extremos no hay más", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-2");

    await expect(lector.openNextChapter()).resolves.toMatchObject({
      chapter: { chapterId: "cap-3" },
      pageIndex: 0,
    });
    await expect(lector.openPreviousChapter()).resolves.toMatchObject({
      chapter: { chapterId: "cap-2" },
      pageIndex: 0,
    });
    await expect(lector.openPreviousChapter()).resolves.toMatchObject({
      chapter: { chapterId: "cap-1" },
      pageIndex: 0,
    });
    await expect(lector.openPreviousChapter()).resolves.toBeNull();

    await lector.openChapter("cap-3");
    await expect(lector.openNextChapter()).resolves.toBeNull();
  });
});

describe("ReaderState · capítulo terminado (RF-21, RF-32)", () => {
  it("llegar a la última página marca terminado, guarda de inmediato y ofrece el siguiente", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-2");

    const fin = await lector.goToPage(59);

    expect(fin).toMatchObject({ pageIndex: 59, pageTotal: 60, finished: true, dirty: false });
    expect(fin.nextChapter).toMatchObject({ chapterId: "cap-3" });
    expect(fin.previousChapter).toMatchObject({ chapterId: "cap-1" });
    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({
      chapterId: "cap-2",
      pageIndex: 59,
      pageTotal: 60,
    });
  });

  it("next() en la última página termina el capítulo en lugar de pasar de página", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-3");
    await lector.goToPage(4);

    const fin = await lector.next();

    expect(fin).toMatchObject({ pageIndex: 4, finished: true });
  });

  it("next() estando terminado no avanza (la UI ofrece el siguiente con la tarjeta)", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-3");
    await lector.goToPage(4);
    await lector.next();

    await expect(lector.next()).resolves.toMatchObject({ pageIndex: 4, finished: true });
  });

  it("terminar el capítulo lo marca leído (T26); a medias, no", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-2");
    await lector.goToPage(30);

    await expect(leidos.isRead(MODULO, SERIE, "cap-2")).resolves.toBe(false);

    await lector.goToPage(59);

    await expect(leidos.isRead(MODULO, SERIE, "cap-2")).resolves.toBe(true);
    await expect(leidos.readIn(MODULO, SERIE)).resolves.toEqual(new Set(["cap-2"]));
  });

  it("un capítulo de una página termina al abrirlo", async () => {
    const lector = crearLector([{ chapterId: "unico", title: "Único", pageTotal: 1 }]);
    await lector.openSeries(MODULO, SERIE);

    const snap = await lector.openChapter("unico");

    expect(snap).toMatchObject({ pageIndex: 0, finished: true, dirty: false });
    await expect(leidos.isRead(MODULO, SERIE, "unico")).resolves.toBe(true);
  });

  it("en el último capítulo terminado no hay siguiente que ofrecer", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-3");
    await lector.goToPage(4);

    const fin = await lector.next();

    expect(fin.finished).toBe(true);
    expect(fin.nextChapter).toBeNull();
    await expect(lector.openNextChapter()).resolves.toBeNull();
  });

  it("abrir el siguiente desde la tarjeta de fin (RF-21) empieza el capítulo nuevo en página 0", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-2");
    await lector.goToPage(59);

    const siguiente = await lector.openNextChapter();

    expect(siguiente).toMatchObject({
      chapter: { chapterId: "cap-3" },
      pageIndex: 0,
      finished: false,
    });
    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({
      chapterId: "cap-2",
      pageIndex: 59,
    });
  });
});

describe("ReaderState · reanudación (RF-20)", () => {
  it("resume() devuelve el capítulo y la página exactos que había guardados", async () => {
    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-2",
      releaseId: "g1",
      chapterTitle: "Cap. 2",
      pageIndex: 30,
      pageTotal: 60,
    });

    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    const reanudado = await lector.resume();

    expect(reanudado).toMatchObject({
      chapter: { chapterId: "cap-2" },
      pageIndex: 30,
      pageTotal: 60,
      finished: false,
      dirty: false,
    });
  });

  it("resume() ajusta la página a los límites del capítulo (reedición con menos páginas)", async () => {
    await progreso.save({
      moduleId: MODULO,
      seriesId: SERIE,
      chapterId: "cap-3",
      pageIndex: 30,
      pageTotal: 30,
    });

    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    const reanudado = await lector.resume();

    // cap-3 tiene 5 páginas: se ajusta a la última y, al caer en ella, termina.
    expect(reanudado).toMatchObject({
      chapter: { chapterId: "cap-3" },
      pageIndex: 4,
      finished: true,
    });
    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({
      pageIndex: 4,
      pageTotal: 5,
    });
  });

  it("resume() sin progreso guardado, o con un capítulo que ya no existe, devuelve null", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await expect(lector.resume()).resolves.toBeNull();

    await progreso.save({ moduleId: MODULO, seriesId: SERIE, chapterId: "cap-x", pageIndex: 2 });
    await expect(lector.resume()).resolves.toBeNull();
  });
});

describe("ReaderState · ventana de memoria (SPEC §9, el render es Parte 2)", () => {
  it("paginado: la página actual y una ventana pequeña hacia delante", async () => {
    const lector = crearLector(CAPITULOS, "manga"); // paged-rtl
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-2");

    expect(lector.snapshot.window).toEqual({ from: 0, to: 2 });
    await lector.goToPage(30);
    expect(lector.snapshot.window).toEqual({ from: 30, to: 32 });
    await lector.goToPage(59);
    expect(lector.snapshot.window).toEqual({ from: 59, to: 59 });
  });

  it("vertical: solo las páginas cercanas a la visible permanecen en memoria", async () => {
    const lector = crearLector(CAPITULOS, "manhua"); // vertical
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-2");

    expect(lector.snapshot.window).toEqual({ from: 0, to: 4 });
    await lector.goToPage(30);
    expect(lector.snapshot.window).toEqual({ from: 28, to: 34 });
    await lector.goToPage(59);
    expect(lector.snapshot.window).toEqual({ from: 57, to: 59 });
  });

  it("sin modo efectivo no hay ventana que declarar", async () => {
    const lector = crearLector(CAPITULOS, null);
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-1");

    expect(lector.snapshot.window).toBeNull();
  });
});

describe("ReaderState · recorrido completo de un capítulo", () => {
  it("recorre un capítulo de 60 páginas de principio a fin (verificación manual, automatizada)", async () => {
    const lector = crearLector();
    await lector.openSeries(MODULO, SERIE);
    await lector.openChapter("cap-2");

    for (let esperado = 1; esperado < 60; esperado += 1) {
      const snap = await lector.next();
      expect(snap.pageIndex).toBe(esperado);
      expect(snap.pageIndex).toBeGreaterThanOrEqual(0);
      expect(snap.pageIndex).toBeLessThanOrEqual(60); // `page_index` en [0, page_total]
      expect(snap.finished).toBe(esperado === 59);
      expect(snap.dirty).toBe(esperado < 59);
    }

    // La última página se guarda de inmediato y marca el capítulo leído.
    const fin = await lector.next();
    expect(fin).toMatchObject({ pageIndex: 59, finished: true, dirty: false });
    expect(fin.nextChapter).toMatchObject({ chapterId: "cap-3" });
    await expect(progreso.get(MODULO, SERIE)).resolves.toMatchObject({
      chapterId: "cap-2",
      pageIndex: 59,
      pageTotal: 60,
    });
    await expect(leidos.isRead(MODULO, SERIE, "cap-2")).resolves.toBe(true);

    // Y reabrir devuelve la misma página (RF-20).
    const reabierto = crearLector();
    await reabierto.openSeries(MODULO, SERIE);
    await expect(reabierto.resume()).resolves.toMatchObject({
      chapter: { chapterId: "cap-2" },
      pageIndex: 59,
      finished: true,
    });
  });
});
