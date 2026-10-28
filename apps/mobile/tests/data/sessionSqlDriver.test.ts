import { describe, expect, it } from "vitest";

import { ChapterReadStore, ProgressStore, SeriesPrefs } from "@ryuunest/core";

import { createSessionSqlDriver } from "../../src/data/sessionSqlDriver";

/**
 * F18 — en la web no hay SQLite (P-79), pero la ficha y el lector usan los mismos almacenes del
 * núcleo (T24–T26). El driver de sesión los mantiene en memoria para esa sesión y para
 * Playwright. Se prueba por los almacenes reales, no por el SQL: si el núcleo cambiara una
 * sentencia, el driver tiene que fallar en voz alta y no devolver vacío.
 */

const clock = { now: () => 1_000 };

function stores() {
  const driver = createSessionSqlDriver();
  return {
    driver,
    progress: new ProgressStore({ driver, clock }),
    read: new ChapterReadStore({ driver, clock }),
    prefs: new SeriesPrefs({ driver, clock }),
  };
}

describe("createSessionSqlDriver", () => {
  it("guarda el progreso por serie y lo sobrescribe en el siguiente guardado", async () => {
    const { progress } = stores();
    expect(await progress.get("m-a", "s-1")).toBeUndefined();

    await progress.save({ moduleId: "m-a", seriesId: "s-1", chapterId: "ch-1", pageIndex: 2, pageTotal: 8 });
    await progress.save({ moduleId: "m-a", seriesId: "s-1", chapterId: "ch-2", releaseId: "r-1", pageIndex: 0, pageTotal: 5 });

    expect(await progress.get("m-a", "s-1")).toMatchObject({
      chapterId: "ch-2",
      releaseId: "r-1",
      pageIndex: 0,
      pageTotal: 5,
      updatedAt: 1_000,
    });
    expect(await progress.get("m-a", "s-2")).toBeUndefined();
  });

  it("marca, lista y desmarca capítulos leídos", async () => {
    const { read } = stores();
    await read.markRead({ moduleId: "m-a", seriesId: "s-1", chapterId: "ch-1" });
    await read.markRead({ moduleId: "m-a", seriesId: "s-1", chapterId: "ch-3" });
    await read.markRead({ moduleId: "m-a", seriesId: "s-2", chapterId: "ch-9" });

    expect([...(await read.readIn("m-a", "s-1"))].sort()).toEqual(["ch-1", "ch-3"]);
    expect(await read.isRead("m-a", "s-1", "ch-3")).toBe(true);

    await read.unmarkRead({ moduleId: "m-a", seriesId: "s-1", chapterId: "ch-1" });
    expect(await read.isRead("m-a", "s-1", "ch-1")).toBe(false);
  });

  it("recuerda el modo y el grupo preferido de la serie sin que uno pise al otro", async () => {
    const { prefs } = stores();
    await prefs.setReaderMode("m-a", "s-1", "paged-rtl");
    await prefs.setPreferredGroup("m-a", "s-1", "Equipo Ryuu");

    expect(await prefs.get("m-a", "s-1")).toMatchObject({
      readerMode: "paged-rtl",
      preferredGroup: "Equipo Ryuu",
    });
    expect(await prefs.modeFor("m-a", "s-1", "manhwa")).toBe("paged-rtl");
    expect(await prefs.modeFor("m-a", "s-2", "manhwa")).toBe("vertical");
  });

  it("rechaza una sentencia que no conoce en vez de fingir que funcionó", async () => {
    const { driver } = stores();
    await expect(driver.run("DELETE FROM favorite")).rejects.toThrow(/sentencia/i);
    await expect(driver.get("SELECT * FROM favorite")).rejects.toThrow(/sentencia/i);
    await expect(driver.all("SELECT * FROM favorite")).rejects.toThrow(/sentencia/i);
  });
});
