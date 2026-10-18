import { beforeEach, describe, expect, it } from "vitest";

import { FixedClock } from "../../src/ports/fakes";
import { Folders } from "../../src/library/Folders";
import { Favorites } from "../../src/library/Favorites";
import { normalizeTitle, SeriesStore } from "../../src/library/SeriesStore";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * Dominio de biblioteca (SPEC §3.5, §8.1, RF-26 a RF-30, D-12) — T22.
 *
 * Series con título normalizado, favoritos con **una** carpeta o ninguna, y CRUD de
 * carpetas. Las pruebas corren contra SQLite real: las claves foráneas y sus efectos
 * (`ON DELETE SET NULL`) no son declarativas, se observan.
 */

const MODULO = "tmo";

let driver: SqlDriver;
let clock: FixedClock;
let series: SeriesStore;
let carpetas: Folders;
let favoritos: Favorites;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  series = new SeriesStore({ driver, clock });
  carpetas = new Folders({ driver, clock });
  favoritos = new Favorites({ driver, clock });
});

async function contar(tabla: "series" | "favorite"): Promise<number> {
  const filas = await driver.all<{ n: number }>(`SELECT COUNT(*) AS n FROM ${tabla}`);
  return filas[0]?.n ?? 0;
}

describe("normalizeTitle · buscable por nombre", () => {
  it("pasa a minúsculas y quita los acentos (SPEC §8.1)", () => {
    expect(normalizeTitle("Élite Musical")).toBe("elite musical");
    expect(normalizeTitle("Ángel DE la GUERRA")).toBe("angel de la guerra");
    expect(normalizeTitle("龍の巣")).toBe("龍の巣"); // los ideogramas no tienen acentos que quitar
  });

  it("comprime espacios y recorta bordes", () => {
    expect(normalizeTitle("   Una   Serie   ")).toBe("una serie");
  });
});

describe("SeriesStore · alta y actualización", () => {
  it("registra una serie con su título normalizado", async () => {
    await series.upsert({
      moduleId: MODULO,
      seriesId: "s-1",
      title: "Reyes de la Noche",
      coverUrl: "https://sitio.test/1.jpg",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
    });

    const guardada = await series.get(MODULO, "s-1");
    expect(guardada).toEqual({
      moduleId: MODULO,
      seriesId: "s-1",
      title: "Reyes de la Noche",
      titleNorm: "reyes de la noche",
      coverUrl: "https://sitio.test/1.jpg",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
      updatedAt: 1_000,
    });
  });

  it("volver a subir la misma serie actualiza los datos en lugar de duplicar", async () => {
    await series.upsert({ moduleId: MODULO, seriesId: "s-1", title: "Viejo", nsfw: false });
    clock.set(2_000);
    await series.upsert({ moduleId: MODULO, seriesId: "s-1", title: "Nuevo", nsfw: true });

    const guardada = await series.get(MODULO, "s-1");
    expect(guardada?.title).toBe("Nuevo");
    expect(guardada?.titleNorm).toBe("nuevo");
    expect(guardada?.nsfw).toBe(true);
    expect(guardada?.updatedAt).toBe(2_000);
    await expect(contar("series")).resolves.toBe(1);
  });

  it("la clave primaria es (modulo, serie): la misma id en otro módulo es otra fila", async () => {
    await series.upsert({ moduleId: MODULO, seriesId: "x", title: "Una", nsfw: false });
    await series.upsert({ moduleId: "otro", seriesId: "x", title: "Otra", nsfw: false });

    await expect(series.get(MODULO, "x")).resolves.toMatchObject({ title: "Una" });
    await expect(series.get("otro", "x")).resolves.toMatchObject({ title: "Otra" });
    await expect(contar("series")).resolves.toBe(2);
  });

  it("devuelve undefined para una serie que no está", async () => {
    await expect(series.get(MODULO, "sin-registrar")).resolves.toBeUndefined();
  });
});

describe("Folders · crear, renombrar, reordenar y borrar (RF-29)", () => {
  it("crea carpetas con id autonumérico y lista por orden", async () => {
    const primera = await carpetas.create("Tesoros");
    const segunda = await carpetas.create("Pendientes");

    await expect(carpetas.list()).resolves.toEqual([
      { id: primera, name: "Tesoros", sort: 0, updatedAt: 1_000 },
      { id: segunda, name: "Pendientes", sort: 0, updatedAt: 1_000 },
    ]);
  });

  it("renombra una carpeta sin tocar sus favoritos", async () => {
    const id = await carpetas.create("Viejo");
    await series.upsert({ moduleId: MODULO, seriesId: "s", title: "S", nsfw: false });
    await favoritos.add(MODULO, "s", id);
    clock.set(3_000);

    await carpetas.rename(id, "Nuevo");

    await expect(carpetas.list()).resolves.toEqual([
      { id, name: "Nuevo", sort: 0, updatedAt: 3_000 },
    ]);
    await expect(favoritos.get(MODULO, "s")).resolves.toMatchObject({ folderId: id });
  });

  it("reordena: setOrder cambia el criterio de la lista", async () => {
    const a = await carpetas.create("A");
    const b = await carpetas.create("B");
    const c = await carpetas.create("C");

    await carpetas.setOrder([
      { id: c, sort: 0 },
      { id: a, sort: 1 },
      { id: b, sort: 2 },
    ]);

    await expect(carpetas.list()).resolves.toEqual([
      expect.objectContaining({ id: c }),
      expect.objectContaining({ id: a }),
      expect.objectContaining({ id: b }),
    ]);
  });

  it("borrar una carpeta deja sus favoritos sin carpeta (D-12, ON DELETE SET NULL)", async () => {
    const id = await carpetas.create("Temporal");
    await series.upsert({ moduleId: MODULO, seriesId: "s1", title: "Uno", nsfw: false });
    await series.upsert({ moduleId: MODULO, seriesId: "s2", title: "Dos", nsfw: false });
    await favoritos.add(MODULO, "s1", id);
    await favoritos.add(MODULO, "s2", id);

    await carpetas.remove(id);

    await expect(carpetas.list()).resolves.toEqual([]);
    await expect(favoritos.get(MODULO, "s1")).resolves.toMatchObject({ folderId: null });
    await expect(favoritos.get(MODULO, "s2")).resolves.toMatchObject({ folderId: null });
  });

  it("asignar una carpeta que no existe se rechaza (la clave foránea manda)", async () => {
    await series.upsert({ moduleId: MODULO, seriesId: "s", title: "S", nsfw: false });

    await expect(favoritos.add(MODULO, "s", 999)).rejects.toThrow();
  });
});

describe("Favorites · una carpeta o ninguna (D-12)", () => {
  it("añade un favorito sin carpeta y luego lo asigna", async () => {
    await series.upsert({ moduleId: MODULO, seriesId: "s", title: "S", nsfw: false });
    const carpeta = await carpetas.create("Favoritos");

    await favoritos.add(MODULO, "s", null);
    await expect(favoritos.get(MODULO, "s")).resolves.toMatchObject({ folderId: null });

    await favoritos.move(MODULO, "s", carpeta);

    const fila = await favoritos.get(MODULO, "s");
    expect(fila).toMatchObject({ folderId: carpeta, updatedAt: 1_000 });
    expect(fila?.addedAt).toBe(1_000);
  });

  it("mover de carpeta reemplaza la anterior, no añade una segunda", async () => {
    await series.upsert({ moduleId: MODULO, seriesId: "s", title: "S", nsfw: false });
    const una = await carpetas.create("Una");
    const otra = await carpetas.create("Otra");
    clock.set(2_000);
    await favoritos.add(MODULO, "s", una);

    clock.set(4_000);
    await favoritos.move(MODULO, "s", otra);

    await expect(favoritos.get(MODULO, "s")).resolves.toMatchObject({
      folderId: otra,
      addedAt: 2_000,
      updatedAt: 4_000,
    });
    await expect(contar("favorite")).resolves.toBe(1);
  });

  it("un favorito puede quedar sin carpeta explicitamente", async () => {
    const carpeta = await carpetas.create("C");
    await series.upsert({ moduleId: MODULO, seriesId: "s", title: "S", nsfw: false });
    await favoritos.add(MODULO, "s", carpeta);

    await favoritos.move(MODULO, "s", null);

    await expect(favoritos.get(MODULO, "s")).resolves.toMatchObject({ folderId: null });
  });

  it("quitar un favorito NO borra su progreso (RF-30)", async () => {
    await series.upsert({ moduleId: MODULO, seriesId: "s", title: "S", nsfw: false });
    await favoritos.add(MODULO, "s", null);
    await driver.run(
      "INSERT INTO progress (module_id, series_id, chapter_id, page_index, updated_at) VALUES (?, ?, ?, ?, ?)",
      [MODULO, "s", "cap-1", 12, 1_000],
    );

    await favoritos.remove(MODULO, "s");

    await expect(favoritos.get(MODULO, "s")).resolves.toBeUndefined();
    const progreso = await driver.get<{ chapter_id: string }>(
      "SELECT chapter_id FROM progress WHERE module_id = ? AND series_id = ?",
      [MODULO, "s"],
    );
    expect(progreso?.chapter_id).toBe("cap-1");
  });

  it("reañadir un favorito existente conserva la fecha de adición", async () => {
    clock.set(1_000);
    await series.upsert({ moduleId: MODULO, seriesId: "s", title: "S", nsfw: false });
    await favoritos.add(MODULO, "s", null);

    clock.set(9_000);
    await favoritos.add(MODULO, "s", null);

    await expect(favoritos.get(MODULO, "s")).resolves.toMatchObject({ addedAt: 1_000 });
    await expect(contar("favorite")).resolves.toBe(1);
  });
});
