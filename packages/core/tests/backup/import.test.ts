import { beforeEach, describe, expect, it } from "vitest";

import { exportBackup } from "../../src/backup/export";
import { importBackup, type ImportResult } from "../../src/backup/import";
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_BYTES,
  type Backup,
  type BackupFavorite,
  type BackupFolder,
  type BackupPref,
  type BackupProgress,
  type BackupRead,
  type BackupSeries,
} from "../../src/backup/schema";
import { Favorites } from "../../src/library/Favorites";
import { Folders } from "../../src/library/Folders";
import { SeriesPrefs } from "../../src/library/SeriesPrefs";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock, MemoryStorage } from "../../src/ports/fakes";
import { ChapterReadStore } from "../../src/progress/ChapterReadStore";
import { ProgressStore } from "../../src/progress/ProgressStore";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * T29a — importar respaldo JSON (SPEC §8.3, RF-38, AC-7, AC-8).
 *
 * El contrato: un respaldo inválido o sobredimensionado se rechaza **sin tocar datos**; la
 * fusión respeta el `updated_at` más reciente; el reemplazo restaura el estado del respaldo;
 * y los repos y módulos del respaldo vuelven como **sugerencias**, sin instalar nada.
 */

let driver: SqlDriver;
let clock: FixedClock;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
});

// ---------------------------------------------------------------------------------------
// Constructores de datos
// ---------------------------------------------------------------------------------------

function backupOf(parts: Partial<Backup> = {}): Backup {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: 1_000,
    repos: [],
    modules: [],
    folders: [],
    series: [],
    favorites: [],
    progress: [],
    read: [],
    prefs: [],
    settings: {},
    ...parts,
  };
}

function serie(over: Partial<BackupSeries> = {}): BackupSeries {
  return {
    moduleId: "ejemplo",
    seriesId: "s-1",
    title: "Reyes de la Noche",
    coverUrl: null,
    kind: "manga",
    nsfw: false,
    status: "ongoing",
    updatedAt: 1_000,
    ...over,
  };
}

function carpeta(over: Partial<BackupFolder> = {}): BackupFolder {
  return { id: 1, name: "Favoritas", sort: 0, updatedAt: 1_000, ...over };
}

function favorito(over: Partial<BackupFavorite> = {}): BackupFavorite {
  return {
    moduleId: "ejemplo",
    seriesId: "s-1",
    folderId: null,
    addedAt: 1_000,
    updatedAt: 1_000,
    ...over,
  };
}

function progreso(over: Partial<BackupProgress> = {}): BackupProgress {
  return {
    moduleId: "ejemplo",
    seriesId: "s-1",
    chapterId: "cap-1",
    releaseId: null,
    chapterTitle: null,
    pageIndex: 0,
    pageTotal: 20,
    updatedAt: 1_000,
    ...over,
  };
}

function leido(over: Partial<BackupRead> = {}): BackupRead {
  return { moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-1", readAt: 1_000, ...over };
}

function pref(over: Partial<BackupPref> = {}): BackupPref {
  return {
    moduleId: "ejemplo",
    seriesId: "s-1",
    readerMode: "vertical",
    preferredGroup: null,
    updatedAt: 1_000,
    ...over,
  };
}

const texto = (backup: unknown): string => JSON.stringify(backup);

/** Estado completo de la base, sin el `createdAt` (que cambia en cada exportación). */
async function estado(db: SqlDriver): Promise<Backup> {
  const backup = await exportBackup({ driver: db, storage: new MemoryStorage(), clock });
  return { ...backup, createdAt: 0 };
}

/** Importa y exige que se haya aplicado. */
async function aplicar(
  mode: "merge" | "replace",
  backup: unknown,
): Promise<Extract<ImportResult, { ok: true }>> {
  const result = await importBackup({ driver, mode }, texto(backup));
  if (!result.ok) {
    throw new Error(`Se esperaba un respaldo aplicado y se rechazó: ${result.message}`);
  }
  return result;
}

/** Importa y exige que se haya rechazado. */
async function rechazar(
  mode: "merge" | "replace",
  entrada: string,
): Promise<Extract<ImportResult, { ok: false }>> {
  const result = await importBackup({ driver, mode }, entrada);
  if (result.ok) {
    throw new Error("Se esperaba un respaldo rechazado y se aplicó");
  }
  return result;
}

/** Puebla la base local con una serie, su carpeta, un favorito, progreso, un leído y ajustes. */
async function poblarLocal(): Promise<void> {
  const series = new SeriesStore({ driver, clock });
  const carpetas = new Folders({ driver, clock });
  const favoritos = new Favorites({ driver, clock });
  const progresos = new ProgressStore({ driver, clock });
  const leidos = new ChapterReadStore({ driver, clock });
  const prefs = new SeriesPrefs({ driver, clock });

  clock.set(5_000);
  await series.upsert({ moduleId: "local", seriesId: "l-1", title: "Solo Local", kind: "comic" });
  const carpetaId = await carpetas.create("Pendientes", 3);
  await favoritos.add("local", "l-1", carpetaId);
  await progresos.save({
    moduleId: "local",
    seriesId: "l-1",
    chapterId: "cap-4",
    pageIndex: 7,
    pageTotal: 30,
  });
  await leidos.markRead({ moduleId: "local", seriesId: "l-1", chapterId: "cap-3" });
  await prefs.setReaderMode("local", "l-1", "paged-ltr");
  await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["language", "es"]);
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

// ---------------------------------------------------------------------------------------
// Rechazo sin tocar datos
// ---------------------------------------------------------------------------------------

describe("importBackup · rechazo de respaldos inválidos (sin tocar datos)", () => {
  it("texto que no es JSON → NOT_JSON", async () => {
    const result = await rechazar("merge", "{ esto no es json");

    expect(result.reason).toBe("NOT_JSON");
    expect(result.message).not.toBe("");
  });

  it("texto vacío → NOT_JSON", async () => {
    expect((await rechazar("replace", "")).reason).toBe("NOT_JSON");
  });

  it.each([
    ["una lista", "[]"],
    ["null", "null"],
    ["un número", "42"],
    ["una cadena", '"respaldo"'],
  ])("JSON válido pero %s en la raíz → INVALID", async (_nombre, entrada) => {
    const result = await rechazar("merge", entrada);

    expect(result.reason).toBe("INVALID");
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("otro `format` → INVALID, señalando `format`", async () => {
    const result = await rechazar("merge", texto({ ...backupOf(), format: "otra-app" }));

    expect(result.reason).toBe("INVALID");
    expect(result.issues.map((issue) => issue.path)).toContain("format");
  });

  it("una versión que esta app no conoce → INVALID, señalando `version`", async () => {
    const result = await rechazar("merge", texto({ ...backupOf(), version: 2 }));

    expect(result.reason).toBe("INVALID");
    expect(result.issues.map((issue) => issue.path)).toContain("version");
  });

  it("falta una sección → INVALID, señalando esa sección", async () => {
    const { series: _series, ...sinSeries } = backupOf();

    const result = await rechazar("merge", texto(sinSeries));

    expect(result.issues.map((issue) => issue.path)).toContain("series");
  });

  it("una sección que no es lista → INVALID", async () => {
    const result = await rechazar("merge", texto({ ...backupOf(), favorites: {} }));

    expect(result.issues.map((issue) => issue.path)).toContain("favorites");
  });

  it("un campo con el tipo equivocado señala fila y campo", async () => {
    const mala = { ...progreso(), pageIndex: "3" };

    const result = await rechazar("merge", texto(backupOf({ progress: [mala as never] })));

    expect(result.issues.map((issue) => issue.path)).toContain("progress[0].pageIndex");
  });

  it("una marca de tiempo negativa o fraccionaria → INVALID", async () => {
    const negativa = await rechazar("merge", texto(backupOf({ series: [serie({ updatedAt: -1 })] })));
    const fraccion = await rechazar(
      "merge",
      texto(backupOf({ series: [serie({ updatedAt: 1.5 })] })),
    );

    expect(negativa.issues.map((issue) => issue.path)).toContain("series[0].updatedAt");
    expect(fraccion.issues.map((issue) => issue.path)).toContain("series[0].updatedAt");
  });

  it("`pageIndex` negativo → INVALID", async () => {
    const result = await rechazar(
      "merge",
      texto(backupOf({ progress: [progreso({ pageIndex: -1 })] })),
    );

    expect(result.issues.map((issue) => issue.path)).toContain("progress[0].pageIndex");
  });

  it.each([
    ["kind", { series: [{ ...serie(), kind: "novela" }] }, "series[0].kind"],
    ["status", { series: [{ ...serie(), status: "roto" }] }, "series[0].status"],
    ["readerMode", { prefs: [{ ...pref(), readerMode: "diagonal" }] }, "prefs[0].readerMode"],
    [
      "runtime",
      {
        modules: [
          {
            id: "m",
            version: "1.0.0",
            repoUrl: "https://repo.example.com/index.json",
            runtime: "wasm",
            kinds: ["manga"],
            lang: "es",
            nsfw: false,
          },
        ],
      },
      "modules[0].runtime",
    ],
  ])("valor fuera de la enumeración (%s) → INVALID", async (_campo, parte, ruta) => {
    const result = await rechazar("merge", texto({ ...backupOf(), ...parte }));

    expect(result.issues.map((issue) => issue.path)).toContain(ruta);
  });

  it.each([
    ["http plano", "http://repo.example.com/index.json"],
    ["javascript:", "javascript:alert(1)"],
    ["file:", "file:///etc/passwd"],
    ["no es una URL", "esto no es una url"],
  ])("la URL de un repo debe ser HTTPS (%s) → INVALID", async (_nombre, url) => {
    const repo = { url, name: "Repo", addedAt: 1_000, updatedAt: 1_000 };

    const result = await rechazar("merge", texto(backupOf({ repos: [repo] })));

    expect(result.issues.map((issue) => issue.path)).toContain("repos[0].url");
  });

  it("la URL del repo de un módulo también debe ser HTTPS", async () => {
    const modulo = {
      id: "m",
      version: "1.0.0",
      repoUrl: "http://repo.example.com/index.json",
      runtime: "script" as const,
      kinds: ["manga" as const],
      lang: "es",
      nsfw: false,
    };

    const result = await rechazar("merge", texto(backupOf({ modules: [modulo] })));

    expect(result.issues.map((issue) => issue.path)).toContain("modules[0].repoUrl");
  });

  it("dos series con la misma clave (módulo + id) → INVALID", async () => {
    const result = await rechazar(
      "merge",
      texto(backupOf({ series: [serie(), serie({ title: "Otra" })] })),
    );

    expect(result.reason).toBe("INVALID");
    expect(result.issues.map((issue) => issue.path)).toContain("series[1]");
  });

  it("dos carpetas con el mismo id → INVALID", async () => {
    const result = await rechazar(
      "replace",
      texto(backupOf({ folders: [carpeta(), carpeta({ name: "Otra" })] })),
    );

    expect(result.issues.map((issue) => issue.path)).toContain("folders[1].id");
  });

  it("un favorito que apunta a una carpeta que no está en el respaldo → INVALID", async () => {
    const result = await rechazar(
      "merge",
      texto(backupOf({ favorites: [favorito({ folderId: 99 })] })),
    );

    expect(result.issues.map((issue) => issue.path)).toContain("favorites[0].folderId");
  });

  it("`settings` solo admite valores de texto", async () => {
    const result = await rechazar(
      "merge",
      texto({ ...backupOf(), settings: { language: "es", nsfwVisible: false } }),
    );

    expect(result.issues.map((issue) => issue.path)).toContain("settings.nsfwVisible");
  });

  it("un rechazo no devuelve ninguna sugerencia", async () => {
    const result = await rechazar("merge", "no es json");

    expect(result).not.toHaveProperty("suggestions");
  });

  it.each(["merge", "replace"] as const)(
    "un respaldo inválido no modifica ni una fila (%s)",
    async (mode) => {
      await poblarLocal();
      const antes = await estado(driver);

      await rechazar(mode, texto({ ...backupOf(), version: 99, series: [serie()] }));
      await rechazar(mode, "{ truncado");

      expect(await estado(driver)).toEqual(antes);
    },
  );

  it("lo que exporta `exportBackup` siempre se valida", async () => {
    await poblarLocal();
    const exportado = await exportBackup({ driver, storage: new MemoryStorage(), clock });
    const limpio = await openMigratedDriver();

    const result = await importBackup({ driver: limpio, mode: "replace" }, texto(exportado));

    expect(result.ok).toBe(true);
  });
});

describe("importBackup · tamaño máximo (SPEC §7.2)", () => {
  it("el tope es de 50 MB", () => {
    expect(MAX_BACKUP_BYTES).toBe(50 * 1024 * 1024);
  });

  it("un texto que pasa el tope se rechaza como TOO_LARGE, sin parsearlo", async () => {
    const result = await rechazar("merge", " ".repeat(MAX_BACKUP_BYTES + 1));

    expect(result.reason).toBe("TOO_LARGE");
  });

  it("el tope se mide en bytes UTF-8, no en caracteres", async () => {
    // «ñ» ocupa 2 bytes: la mitad más uno de caracteres ya pasa el tope.
    const result = await rechazar("merge", "ñ".repeat(MAX_BACKUP_BYTES / 2 + 1));

    expect(result.reason).toBe("TOO_LARGE");
  });

  it("un respaldo que ocupa justo el tope todavía se acepta", async () => {
    const cuerpo = texto(backupOf());
    const relleno = " ".repeat(MAX_BACKUP_BYTES - cuerpo.length);

    const result = await importBackup({ driver, mode: "merge" }, cuerpo + relleno);

    expect(result.ok).toBe(true);
  });

  it("un rechazo por tamaño no modifica ni una fila", async () => {
    await poblarLocal();
    const antes = await estado(driver);

    await rechazar("replace", " ".repeat(MAX_BACKUP_BYTES + 1));

    expect(await estado(driver)).toEqual(antes);
  });
});

// ---------------------------------------------------------------------------------------
// Atomicidad
// ---------------------------------------------------------------------------------------

describe("importBackup · atomicidad", () => {
  const respaldo = (): Backup =>
    backupOf({
      folders: [carpeta()],
      series: [serie(), serie({ seriesId: "s-2", title: "Segunda" })],
      favorites: [favorito({ folderId: 1 })],
      progress: [progreso()],
      read: [leido()],
      prefs: [pref()],
      settings: { nsfwVisible: "false" },
    });

  it.each([
    ["merge", 3],
    ["merge", 6],
    ["replace", 4],
    ["replace", 9],
  ] as const)(
    "un fallo a mitad de la escritura (%s, escritura %i) revierte todo",
    async (mode, fallaEn) => {
      await poblarLocal();
      const antes = await estado(driver);

      await expect(
        importBackup({ driver: conFalloEnEscritura(driver, fallaEn), mode }, texto(respaldo())),
      ).rejects.toThrow("disco lleno");

      expect(await estado(driver)).toEqual(antes);
    },
  );
});

// ---------------------------------------------------------------------------------------
// Fusión
// ---------------------------------------------------------------------------------------

describe("importBackup · fusión (merge)", () => {
  it("en una instalación limpia añade todo lo del respaldo", async () => {
    const result = await aplicar(
      "merge",
      backupOf({
        folders: [carpeta({ id: 4, name: "Favoritas", sort: 2, updatedAt: 3_000 })],
        series: [serie({ coverUrl: "https://sitio.test/1.jpg", updatedAt: 2_000 })],
        favorites: [favorito({ folderId: 4, addedAt: 2_500, updatedAt: 3_000 })],
        progress: [
          progreso({
            chapterId: "cap-7",
            releaseId: "g1",
            chapterTitle: "Cap. 7",
            pageIndex: 12,
            pageTotal: 40,
            updatedAt: 4_000,
          }),
        ],
        read: [leido({ chapterId: "cap-1", readAt: 5_000 })],
        prefs: [pref({ readerMode: "paged-rtl", preferredGroup: "grupo-techo", updatedAt: 6_000 })],
        settings: { language: "es" },
      }),
    );

    const ahora = await estado(driver);
    const carpetaLocal = ahora.folders[0];
    expect(ahora.folders).toEqual([
      { id: carpetaLocal?.id, name: "Favoritas", sort: 2, updatedAt: 3_000 },
    ]);
    expect(ahora.series).toEqual([
      {
        moduleId: "ejemplo",
        seriesId: "s-1",
        title: "Reyes de la Noche",
        coverUrl: "https://sitio.test/1.jpg",
        kind: "manga",
        nsfw: false,
        status: "ongoing",
        updatedAt: 2_000,
      },
    ]);
    expect(ahora.favorites).toEqual([
      {
        moduleId: "ejemplo",
        seriesId: "s-1",
        folderId: carpetaLocal?.id,
        addedAt: 2_500,
        updatedAt: 3_000,
      },
    ]);
    expect(ahora.progress).toEqual([
      {
        moduleId: "ejemplo",
        seriesId: "s-1",
        chapterId: "cap-7",
        releaseId: "g1",
        chapterTitle: "Cap. 7",
        pageIndex: 12,
        pageTotal: 40,
        updatedAt: 4_000,
      },
    ]);
    expect(ahora.read).toEqual([
      { moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-1", readAt: 5_000 },
    ]);
    expect(ahora.prefs).toEqual([
      {
        moduleId: "ejemplo",
        seriesId: "s-1",
        readerMode: "paged-rtl",
        preferredGroup: "grupo-techo",
        updatedAt: 6_000,
      },
    ]);
    expect(ahora.settings).toEqual({ language: "es" });

    expect(result.summary.mode).toBe("merge");
    for (const seccion of ["folders", "series", "favorites", "progress", "read", "prefs", "settings"] as const) {
      expect(result.summary.counts[seccion]).toEqual({ added: 1, updated: 0, kept: 0 });
    }
  });

  it("recalcula `title_norm` al importar una serie (minúsculas y sin acentos)", async () => {
    await aplicar("merge", backupOf({ series: [serie({ title: "Reyes de la Noche Ñandú" })] }));

    const guardada = await new SeriesStore({ driver, clock }).get("ejemplo", "s-1");

    expect(guardada?.titleNorm).toBe("reyes de la noche nandu");
  });

  it("no borra lo local que el respaldo no menciona", async () => {
    await poblarLocal();
    const antes = await estado(driver);

    await aplicar("merge", backupOf({ series: [serie({ seriesId: "s-9", title: "Nueva" })] }));

    const despues = await estado(driver);
    expect(despues.series).toHaveLength(antes.series.length + 1);
    expect(despues.series).toEqual(expect.arrayContaining(antes.series));
    expect(despues.folders).toEqual(antes.folders);
    expect(despues.favorites).toEqual(antes.favorites);
    expect(despues.progress).toEqual(antes.progress);
    expect(despues.read).toEqual(antes.read);
    expect(despues.prefs).toEqual(antes.prefs);
    expect(despues.settings).toEqual(antes.settings);
  });

  describe("progreso en conflicto (gana el `updated_at` más reciente)", () => {
    beforeEach(async () => {
      const progresos = new ProgressStore({ driver, clock });
      clock.set(5_000);
      await progresos.save({
        moduleId: "ejemplo",
        seriesId: "s-1",
        chapterId: "cap-3",
        pageIndex: 4,
        pageTotal: 20,
      });
      clock.set(8_000);
      await progresos.save({
        moduleId: "ejemplo",
        seriesId: "s-2",
        chapterId: "cap-9",
        pageIndex: 10,
        pageTotal: 30,
      });
      clock.set(6_000);
      await progresos.save({
        moduleId: "ejemplo",
        seriesId: "s-3",
        chapterId: "cap-2",
        pageIndex: 1,
        pageTotal: 10,
      });
    });

    it("el respaldo más nuevo reemplaza al progreso local", async () => {
      const result = await aplicar(
        "merge",
        backupOf({
          progress: [
            progreso({ seriesId: "s-1", chapterId: "cap-7", pageIndex: 15, updatedAt: 9_000 }),
          ],
        }),
      );

      const guardado = await new ProgressStore({ driver, clock }).get("ejemplo", "s-1");
      expect(guardado).toMatchObject({ chapterId: "cap-7", pageIndex: 15, updatedAt: 9_000 });
      expect(result.summary.counts.progress).toEqual({ added: 0, updated: 1, kept: 0 });
    });

    it("el progreso local más nuevo se conserva", async () => {
      const result = await aplicar(
        "merge",
        backupOf({
          progress: [
            progreso({ seriesId: "s-2", chapterId: "cap-1", pageIndex: 0, updatedAt: 2_000 }),
          ],
        }),
      );

      const guardado = await new ProgressStore({ driver, clock }).get("ejemplo", "s-2");
      expect(guardado).toMatchObject({ chapterId: "cap-9", pageIndex: 10, updatedAt: 8_000 });
      expect(result.summary.counts.progress).toEqual({ added: 0, updated: 0, kept: 1 });
    });

    it("si empatan, se conserva lo local", async () => {
      await aplicar(
        "merge",
        backupOf({
          progress: [
            progreso({ seriesId: "s-3", chapterId: "cap-OTRO", pageIndex: 5, updatedAt: 6_000 }),
          ],
        }),
      );

      const guardado = await new ProgressStore({ driver, clock }).get("ejemplo", "s-3");
      expect(guardado).toMatchObject({ chapterId: "cap-2", pageIndex: 1 });
    });

    it("dos respaldos con progreso en conflicto: queda el más reciente de los tres", async () => {
      const respaldoA = backupOf({
        progress: [
          progreso({ seriesId: "s-1", chapterId: "cap-A", pageIndex: 3, updatedAt: 7_000 }),
          progreso({ seriesId: "s-2", chapterId: "cap-A", pageIndex: 3, updatedAt: 7_000 }),
        ],
      });
      const respaldoB = backupOf({
        progress: [
          progreso({ seriesId: "s-1", chapterId: "cap-B", pageIndex: 9, updatedAt: 10_000 }),
          progreso({ seriesId: "s-2", chapterId: "cap-B", pageIndex: 9, updatedAt: 4_000 }),
        ],
      });

      await aplicar("merge", respaldoA);
      await aplicar("merge", respaldoB);

      const store = new ProgressStore({ driver, clock });
      // s-1: local 5000 < A 7000 < B 10000 → gana B.
      expect(await store.get("ejemplo", "s-1")).toMatchObject({ chapterId: "cap-B", pageIndex: 9 });
      // s-2: B 4000 < A 7000 < local 8000 → gana lo local.
      expect(await store.get("ejemplo", "s-2")).toMatchObject({ chapterId: "cap-9", pageIndex: 10 });
    });

    it("el progreso de una serie que no estaba se añade", async () => {
      const result = await aplicar(
        "merge",
        backupOf({ progress: [progreso({ seriesId: "s-nueva", updatedAt: 100 })] }),
      );

      expect(await new ProgressStore({ driver, clock }).get("ejemplo", "s-nueva")).toBeDefined();
      expect(result.summary.counts.progress).toEqual({ added: 1, updated: 0, kept: 0 });
    });
  });

  describe("series, favoritos y preferencias (gana el `updated_at` más reciente)", () => {
    beforeEach(async () => {
      const series = new SeriesStore({ driver, clock });
      const favoritos = new Favorites({ driver, clock });
      const prefs = new SeriesPrefs({ driver, clock });
      clock.set(5_000);
      await series.upsert({ moduleId: "ejemplo", seriesId: "s-1", title: "Título local" });
      await favoritos.add("ejemplo", "s-1", null);
      await prefs.setReaderMode("ejemplo", "s-1", "vertical");
    });

    it("el respaldo más nuevo actualiza serie, favorito y preferencia", async () => {
      const result = await aplicar(
        "merge",
        backupOf({
          series: [serie({ title: "Título nuevo", status: "completed", updatedAt: 9_000 })],
          favorites: [favorito({ addedAt: 4_000, updatedAt: 9_000 })],
          prefs: [pref({ readerMode: "paged-rtl", updatedAt: 9_000 })],
        }),
      );

      expect(await new SeriesStore({ driver, clock }).get("ejemplo", "s-1")).toMatchObject({
        title: "Título nuevo",
        status: "completed",
        updatedAt: 9_000,
      });
      expect(await new Favorites({ driver, clock }).get("ejemplo", "s-1")).toMatchObject({
        updatedAt: 9_000,
      });
      expect((await estado(driver)).prefs[0]).toMatchObject({
        readerMode: "paged-rtl",
        updatedAt: 9_000,
      });
      for (const seccion of ["series", "favorites", "prefs"] as const) {
        expect(result.summary.counts[seccion]).toEqual({ added: 0, updated: 1, kept: 0 });
      }
    });

    it("lo local más nuevo se conserva", async () => {
      const result = await aplicar(
        "merge",
        backupOf({
          series: [serie({ title: "Título viejo", updatedAt: 2_000 })],
          favorites: [favorito({ updatedAt: 2_000 })],
          prefs: [pref({ readerMode: "paged-ltr", updatedAt: 2_000 })],
        }),
      );

      expect(await new SeriesStore({ driver, clock }).get("ejemplo", "s-1")).toMatchObject({
        title: "Título local",
        updatedAt: 5_000,
      });
      expect((await estado(driver)).prefs[0]).toMatchObject({ readerMode: "vertical" });
      for (const seccion of ["series", "favorites", "prefs"] as const) {
        expect(result.summary.counts[seccion]).toEqual({ added: 0, updated: 0, kept: 1 });
      }
    });
  });

  describe("carpetas (se emparejan por nombre, no por id)", () => {
    it("el mismo nombre, sin distinguir mayúsculas, es la misma carpeta", async () => {
      const carpetas = new Folders({ driver, clock });
      clock.set(2_000);
      const idLocal = await carpetas.create("Favoritas", 1);
      await carpetas.create("Otra", 2);

      const result = await aplicar(
        "merge",
        backupOf({
          folders: [carpeta({ id: 77, name: "favoritas", sort: 5, updatedAt: 9_000 })],
          series: [serie()],
          favorites: [favorito({ folderId: 77, updatedAt: 9_000 })],
        }),
      );

      const ahora = await estado(driver);
      expect(ahora.folders).toHaveLength(2); // no se duplicó
      expect(ahora.folders.find((f) => f.id === idLocal)).toMatchObject({
        name: "favoritas",
        sort: 5,
        updatedAt: 9_000,
      });
      expect(ahora.favorites[0]?.folderId).toBe(idLocal);
      expect(result.summary.counts.folders).toEqual({ added: 0, updated: 1, kept: 0 });
    });

    it("la carpeta local más nueva conserva su nombre y orden", async () => {
      const carpetas = new Folders({ driver, clock });
      clock.set(8_000);
      const idLocal = await carpetas.create("Favoritas", 1);

      const result = await aplicar(
        "merge",
        backupOf({ folders: [carpeta({ id: 1, name: "FAVORITAS", sort: 9, updatedAt: 2_000 })] }),
      );

      expect((await estado(driver)).folders).toEqual([
        { id: idLocal, name: "Favoritas", sort: 1, updatedAt: 8_000 },
      ]);
      expect(result.summary.counts.folders).toEqual({ added: 0, updated: 0, kept: 1 });
    });

    it("un `id` del respaldo igual al local pero con otro nombre es otra carpeta", async () => {
      const carpetas = new Folders({ driver, clock });
      const idLocal = await carpetas.create("Pendientes", 0);

      await aplicar(
        "merge",
        backupOf({
          folders: [carpeta({ id: idLocal, name: "Terminadas" })],
          series: [serie()],
          favorites: [favorito({ folderId: idLocal })],
        }),
      );

      const ahora = await estado(driver);
      const terminadas = ahora.folders.find((f) => f.name === "Terminadas");
      expect(ahora.folders).toHaveLength(2);
      expect(terminadas?.id).not.toBe(idLocal);
      expect(ahora.favorites[0]?.folderId).toBe(terminadas?.id);
    });

    it("dos carpetas del respaldo con el mismo nombre se unifican en una", async () => {
      await aplicar(
        "merge",
        backupOf({
          folders: [carpeta({ id: 1, name: "Acción" }), carpeta({ id: 2, name: "acción" })],
        }),
      );

      expect((await estado(driver)).folders).toHaveLength(1);
    });
  });

  describe("capítulos leídos (unión) y ajustes (gana lo local)", () => {
    it("los capítulos leídos se unen y se conserva el `readAt` más reciente", async () => {
      const leidos = new ChapterReadStore({ driver, clock });
      clock.set(5_000);
      await leidos.markRead({ moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-1" });
      clock.set(9_000);
      await leidos.markRead({ moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-2" });

      const result = await aplicar(
        "merge",
        backupOf({
          read: [
            leido({ chapterId: "cap-1", readAt: 7_000 }), // más nuevo que el local
            leido({ chapterId: "cap-2", readAt: 1_000 }), // más viejo que el local
            leido({ chapterId: "cap-3", readAt: 2_000 }), // no estaba
          ],
        }),
      );

      const ahora = (await estado(driver)).read;
      expect(ahora).toEqual([
        { moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-1", readAt: 7_000 },
        { moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-2", readAt: 9_000 },
        { moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-3", readAt: 2_000 },
      ]);
      expect(result.summary.counts.read).toEqual({ added: 1, updated: 1, kept: 1 });
    });

    it("las claves de ajuste locales se conservan y solo se añaden las que faltan", async () => {
      await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["language", "es"]);

      const result = await aplicar(
        "merge",
        backupOf({ settings: { language: "en", nsfwVisible: "true" } }),
      );

      expect((await estado(driver)).settings).toEqual({ language: "es", nsfwVisible: "true" });
      expect(result.summary.counts.settings).toEqual({ added: 1, updated: 0, kept: 1 });
    });
  });

  it("es idempotente: importar el mismo respaldo dos veces no cambia nada la segunda vez", async () => {
    const respaldo = backupOf({
      folders: [carpeta({ id: 3, name: "Favoritas" })],
      series: [serie()],
      favorites: [favorito({ folderId: 3 })],
      progress: [progreso()],
      read: [leido()],
      prefs: [pref()],
      settings: { language: "es" },
    });
    await aplicar("merge", respaldo);
    const trasPrimera = await estado(driver);

    const segunda = await aplicar("merge", respaldo);

    expect(await estado(driver)).toEqual(trasPrimera);
    for (const seccion of ["folders", "series", "favorites", "progress", "read", "prefs", "settings"] as const) {
      expect(segunda.summary.counts[seccion]).toEqual({ added: 0, updated: 0, kept: 1 });
    }
  });
});

// ---------------------------------------------------------------------------------------
// Reemplazo
// ---------------------------------------------------------------------------------------

describe("importBackup · reemplazo (replace)", () => {
  it("restaura exactamente el estado del respaldo y descarta lo local", async () => {
    await poblarLocal();
    const respaldo = backupOf({
      folders: [carpeta({ id: 7, name: "Nueva", sort: 1, updatedAt: 3_000 })],
      series: [serie({ updatedAt: 2_000 })],
      favorites: [favorito({ folderId: 7, addedAt: 2_500, updatedAt: 3_000 })],
      progress: [progreso({ chapterId: "cap-7", pageIndex: 5, updatedAt: 4_000 })],
      read: [leido({ readAt: 5_000 })],
      prefs: [pref({ readerMode: "paged-rtl", updatedAt: 6_000 })],
      settings: { nsfwVisible: "false" },
    });

    const result = await aplicar("replace", respaldo);

    const { createdAt: _creado, repos: _repos, modules: _modules, ...esperado } = respaldo;
    const { createdAt: _c2, repos: _r2, modules: _m2, ...real } = await estado(driver);
    expect(real).toEqual(esperado);
    expect(result.summary.mode).toBe("replace");
    for (const seccion of ["folders", "series", "favorites", "progress", "read", "prefs", "settings"] as const) {
      expect(result.summary.counts[seccion]).toEqual({ added: 1, updated: 0, kept: 0 });
    }
  });

  it("conserva los `id` de carpeta del respaldo, para que los favoritos sigan apuntando bien", async () => {
    await aplicar(
      "replace",
      backupOf({
        folders: [carpeta({ id: 40, name: "A" }), carpeta({ id: 41, name: "B", sort: 1 })],
        series: [serie(), serie({ seriesId: "s-2", title: "Segunda" })],
        favorites: [
          favorito({ seriesId: "s-1", folderId: 41 }),
          favorito({ seriesId: "s-2", folderId: 40 }),
        ],
      }),
    );

    const ahora = await estado(driver);
    expect(ahora.folders.map((f) => f.id)).toEqual([40, 41]);
    expect(ahora.favorites.map((f) => [f.seriesId, f.folderId])).toEqual([
      ["s-1", 41],
      ["s-2", 40],
    ]);
  });

  it("un respaldo vacío pero válido deja vacías las tablas de usuario", async () => {
    await poblarLocal();

    await aplicar("replace", backupOf());

    const ahora = await estado(driver);
    expect(ahora.folders).toEqual([]);
    expect(ahora.series).toEqual([]);
    expect(ahora.favorites).toEqual([]);
    expect(ahora.progress).toEqual([]);
    expect(ahora.read).toEqual([]);
    expect(ahora.prefs).toEqual([]);
    expect(ahora.settings).toEqual({});
  });

  it("una carpeta nueva creada después del reemplazo no choca con los `id` restaurados", async () => {
    await aplicar("replace", backupOf({ folders: [carpeta({ id: 40, name: "A" })] }));

    const nuevoId = await new Folders({ driver, clock }).create("Despues", 1);

    expect(nuevoId).toBeGreaterThan(40);
  });
});

// ---------------------------------------------------------------------------------------
// Sugerencias (RF-38, AC-8)
// ---------------------------------------------------------------------------------------

describe("importBackup · sugerencias de repos y módulos (RF-38)", () => {
  const repos = [
    { url: "https://repo.example.com/index.json", name: "Repo uno", addedAt: 1_000, updatedAt: 2_000 },
    { url: "https://otro.example.org/index.json", name: "Repo dos", addedAt: 1_500, updatedAt: 2_500 },
  ];
  const modules = [
    {
      id: "ejemplo",
      version: "1.0.0",
      repoUrl: "https://repo.example.com/index.json",
      runtime: "script" as const,
      kinds: ["manga" as const],
      lang: "es",
      nsfw: false,
    },
  ];

  it.each(["merge", "replace"] as const)(
    "devuelve los repos y módulos del respaldo como sugerencias (%s)",
    async (mode) => {
      const result = await aplicar(mode, backupOf({ repos, modules }));

      expect(result.suggestions).toEqual({ repos, modules });
    },
  );

  it.each(["merge", "replace"] as const)(
    "no instala ni registra nada: ni repos, ni módulos, ni almacén (%s)",
    async (mode) => {
      await aplicar(mode, backupOf({ repos, modules, series: [serie()] }));

      expect((await driver.get<{ n: number }>("SELECT COUNT(*) AS n FROM repo"))?.n).toBe(0);
      expect((await driver.get<{ n: number }>("SELECT COUNT(*) AS n FROM module"))?.n).toBe(0);
      expect((await driver.get<{ n: number }>("SELECT COUNT(*) AS n FROM kv"))?.n).toBe(0);
    },
  );

  it("sin repos ni módulos en el respaldo, las sugerencias van vacías", async () => {
    const result = await aplicar("merge", backupOf());

    expect(result.suggestions).toEqual({ repos: [], modules: [] });
  });
});
