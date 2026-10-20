import { beforeEach, describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors";
import type { MediaKind } from "../../src/contract/types";
import { SeriesPrefs, defaultReaderModeFor, type ReaderMode } from "../../src/library/SeriesPrefs";
import { FixedClock } from "../../src/ports/fakes";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * Preferencias por serie (SPEC §8.1 `series_pref`, RF-16 y RF-18) — T24.
 *
 * El modo de lectura se recuerda **por serie**; si la serie no tiene preferencia guarda,
 * el modo es el que corresponde a su tipo: manhua y manhwa vertical, manga paginado de
 * derecha a izquierda, cómic paginado de izquierda a derecha. La `preferred_group` es la
 * release preferida por serie (RF-16).
 */

const MODULO = "tmo";
const SERIE = "s-1";

let driver: SqlDriver;
let clock: FixedClock;
let prefs: SeriesPrefs;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  prefs = new SeriesPrefs({ driver, clock });
});

describe("defaultReaderModeFor · el modo por tipo (RF-18)", () => {
  it("manhua y manhwa son verticales; manga D→I y cómic I→D", () => {
    const esperado: Readonly<Record<MediaKind, ReaderMode>> = {
      manga: "paged-rtl",
      manhua: "vertical",
      manhwa: "vertical",
      comic: "paged-ltr",
    };

    for (const kind of Object.keys(esperado) as MediaKind[]) {
      expect(defaultReaderModeFor(kind), kind).toBe(esperado[kind]);
    }
  });
});

describe("SeriesPrefs · guardar y leer por (module_id, series_id)", () => {
  it("sin preferencia guardada no hay fila", async () => {
    await expect(prefs.get(MODULO, SERIE)).resolves.toBeUndefined();
  });

  it("guarda el modo de lectura y se puede volver a leer", async () => {
    await prefs.setReaderMode(MODULO, SERIE, "paged-ltr");

    await expect(prefs.get(MODULO, SERIE)).resolves.toEqual({
      moduleId: MODULO,
      seriesId: SERIE,
      readerMode: "paged-ltr",
      preferredGroup: null,
      updatedAt: 1_000,
    });
  });

  it("guarda la release preferida (RF-16) y se puede quitar", async () => {
    await prefs.setPreferredGroup(MODULO, SERIE, "Grupo Techo");

    await expect(prefs.get(MODULO, SERIE)).resolves.toMatchObject({
      preferredGroup: "Grupo Techo",
      readerMode: null,
    });

    await prefs.setPreferredGroup(MODULO, SERIE, null);

    await expect(prefs.get(MODULO, SERIE)).resolves.toMatchObject({ preferredGroup: null });
  });

  it("las claves de dos series distintas no se pisan", async () => {
    await prefs.setReaderMode(MODULO, "a", "vertical");
    await prefs.setReaderMode(MODULO, "b", "paged-rtl");
    await prefs.setReaderMode("otro", "a", "paged-ltr");

    await expect(prefs.get(MODULO, "a")).resolves.toMatchObject({ readerMode: "vertical" });
    await expect(prefs.get(MODULO, "b")).resolves.toMatchObject({ readerMode: "paged-rtl" });
    await expect(prefs.get("otro", "a")).resolves.toMatchObject({ readerMode: "paged-ltr" });
  });

  it("cambiar el modo no borra la release preferida, y al revés", async () => {
    await prefs.setReaderMode(MODULO, SERIE, "vertical");
    await prefs.setPreferredGroup(MODULO, SERIE, "Grupo Techo");
    clock.set(2_000);
    await prefs.setReaderMode(MODULO, SERIE, "paged-rtl");

    await expect(prefs.get(MODULO, SERIE)).resolves.toMatchObject({
      readerMode: "paged-rtl",
      preferredGroup: "Grupo Techo",
      updatedAt: 2_000,
    });

    clock.set(3_000);
    await prefs.setPreferredGroup(MODULO, SERIE, "Otro Grupo");

    await expect(prefs.get(MODULO, SERIE)).resolves.toMatchObject({
      readerMode: "paged-rtl",
      preferredGroup: "Otro Grupo",
    });
  });

  it("actualizar una preferencia actualiza `updated_at` (SPEC §8.1)", async () => {
    await prefs.setReaderMode(MODULO, SERIE, "vertical");
    await expect(prefs.get(MODULO, SERIE)).resolves.toMatchObject({ updatedAt: 1_000 });

    clock.set(7_500);
    await prefs.setReaderMode(MODULO, SERIE, "vertical");

    await expect(prefs.get(MODULO, SERIE)).resolves.toMatchObject({ updatedAt: 7_500 });
  });
});

describe("SeriesPrefs · modo efectivo", () => {
  it("sin preferencia, usa el modo del tipo de obra", async () => {
    await expect(prefs.modeFor(MODULO, SERIE, "manga")).resolves.toBe("paged-rtl");
    await expect(prefs.modeFor(MODULO, SERIE, "manhwa")).resolves.toBe("vertical");
    await expect(prefs.modeFor(MODULO, SERIE, "comic")).resolves.toBe("paged-ltr");
  });

  it("con preferencia guardada, manda lo que eligió el lector, sea cual sea el tipo", async () => {
    await prefs.setReaderMode(MODULO, SERIE, "vertical");

    await expect(prefs.modeFor(MODULO, SERIE, "manga")).resolves.toBe("vertical");
  });

  it("sin preferencia y sin tipo conocido devuelve null (lo decide el ajuste global, F20)", async () => {
    await expect(prefs.modeFor(MODULO, SERIE, null)).resolves.toBeNull();
  });

  it("un valor ilegible en la base se rechaza con un error tipado", async () => {
    await driver.run(
      "INSERT INTO series_pref (module_id, series_id, reader_mode, updated_at) VALUES (?, ?, ?, ?)",
      [MODULO, "raro", "modo-imposible", 1_000],
    );

    const error = await prefs.get(MODULO, "raro").then(
      () => undefined,
      (lanzado: unknown) => lanzado,
    );

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).code).toBe("PARSE");
  });
});
