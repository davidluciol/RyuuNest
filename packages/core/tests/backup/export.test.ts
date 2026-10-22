import { beforeEach, describe, expect, it } from "vitest";

import { exportBackup } from "../../src/backup/export";
import { BACKUP_FORMAT, BACKUP_VERSION } from "../../src/backup/schema";
import type { ModuleManifest } from "../../src/contract/types";
import { moduleKey, type InstalledPackage } from "../../src/install/PackageInstaller";
import { Favorites } from "../../src/library/Favorites";
import { Folders } from "../../src/library/Folders";
import { SeriesPrefs } from "../../src/library/SeriesPrefs";
import { SeriesStore } from "../../src/library/SeriesStore";
import { FixedClock, MemoryStorage } from "../../src/ports/fakes";
import { ChapterReadStore } from "../../src/progress/ChapterReadStore";
import { ProgressStore } from "../../src/progress/ProgressStore";
import { repoKey, type RepoRecord } from "../../src/repo/RepoRegistry";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * T28 — exportar respaldo JSON (SPEC §8.3, RF-37).
 *
 * La exportación es una lectura: vuelca todo el estado local (repos, módulos y las tablas
 * de usuario) en un `Backup` con la forma de `schema.ts`. No incluye secretos — de cada
 * módulo solo sale la metadata para sugerirlo (RF-38), nunca su código, manifest ni
 * permisos.
 */

const REPO_URL = "https://repo.example.com/index.json";

/** Manifest completo para un módulo, con permisos y archivos que **no** deben exportarse. */
const MANIFEST: ModuleManifest = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "script",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  baseUrl: "https://ejemplo.com",
  capabilities: ["popular"],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.js",
};

let driver: SqlDriver;
let clock: FixedClock;
let storage: MemoryStorage;

beforeEach(async () => {
  driver = await openMigratedDriver();
  clock = new FixedClock(1_000);
  storage = new MemoryStorage();
});

async function seedRepo(): Promise<void> {
  const record: RepoRecord = {
    id: REPO_URL,
    url: REPO_URL,
    name: "Repo de ejemplo",
    addedAt: 1_000,
    updatedAt: 2_000,
  };
  await storage.set(repoKey(REPO_URL), JSON.stringify(record));
}

async function seedModule(): Promise<void> {
  const installed: InstalledPackage = {
    id: "ejemplo",
    version: "1.0.0",
    repoUrl: REPO_URL,
    runtime: "script",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    permissions: { domains: ["ejemplo.com"] },
    manifest: MANIFEST,
    files: [{ path: "index.js", hex: "deadbeef" }],
    installedAt: 2_000,
    enabled: true,
  };
  await storage.set(moduleKey("ejemplo"), JSON.stringify(installed));
}

describe("exportBackup · forma del respaldo (SPEC §8.3)", () => {
  it("sin datos devuelve la cabecera y las secciones vacías", async () => {
    const backup = await exportBackup({ driver, storage, clock });

    expect(backup).toEqual({
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
    });
  });

  it("`createdAt` sale del reloj inyectado", async () => {
    clock.set(9_999);
    const backup = await exportBackup({ driver, storage, clock });

    expect(backup.createdAt).toBe(9_999);
  });
});

describe("exportBackup · repos y módulos (sin secretos)", () => {
  it("exporta el repo con su nombre y fechas", async () => {
    await seedRepo();

    const backup = await exportBackup({ driver, storage, clock });

    expect(backup.repos).toEqual([
      { url: REPO_URL, name: "Repo de ejemplo", addedAt: 1_000, updatedAt: 2_000 },
    ]);
  });

  it("exporta solo la metadata del módulo: sin código, manifest ni permisos", async () => {
    await seedModule();

    const backup = await exportBackup({ driver, storage, clock });
    const json = JSON.stringify(backup);

    expect(backup.modules).toEqual([
      {
        id: "ejemplo",
        version: "1.0.0",
        repoUrl: REPO_URL,
        runtime: "script",
        kinds: ["manga"],
        lang: "es",
        nsfw: false,
      },
    ]);
    expect(json).not.toContain("deadbeef"); // el contenido del paquete no se vuelca
    expect(json).not.toContain("permissions");
    expect(json).not.toContain("manifest");
    expect(json).not.toContain("files");
  });
});

describe("exportBackup · filas de usuario", () => {
  it("vuelca carpetas, series, favoritos, progreso, leídos, prefs y ajustes", async () => {
    const series = new SeriesStore({ driver, clock });
    const carpetas = new Folders({ driver, clock });
    const favoritos = new Favorites({ driver, clock });
    const progreso = new ProgressStore({ driver, clock });
    const leidos = new ChapterReadStore({ driver, clock });
    const prefs = new SeriesPrefs({ driver, clock });

    await series.upsert({
      moduleId: "ejemplo",
      seriesId: "s-1",
      title: "Reyes de la Noche",
      coverUrl: "https://sitio.test/1.jpg",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
    });

    clock.set(2_000);
    const folderId = await carpetas.create("Favoritas", 0);

    clock.set(3_000);
    await favoritos.add("ejemplo", "s-1", folderId);

    clock.set(4_000);
    await progreso.save({
      moduleId: "ejemplo",
      seriesId: "s-1",
      chapterId: "cap-7",
      releaseId: "g1",
      chapterTitle: "Cap. 7",
      pageIndex: 12,
      pageTotal: 40,
    });

    clock.set(5_000);
    await leidos.markRead({ moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-1" });

    clock.set(6_000);
    await prefs.setReaderMode("ejemplo", "s-1", "paged-rtl");
    clock.set(7_000);
    await prefs.setPreferredGroup("ejemplo", "s-1", "grupo-techo");

    await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["language", "es"]);
    await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["nsfwVisible", "false"]);

    clock.set(8_000);
    const backup = await exportBackup({ driver, storage, clock });

    expect(backup.folders).toEqual([
      { id: folderId, name: "Favoritas", sort: 0, updatedAt: 2_000 },
    ]);
    expect(backup.series).toEqual([
      {
        moduleId: "ejemplo",
        seriesId: "s-1",
        title: "Reyes de la Noche",
        coverUrl: "https://sitio.test/1.jpg",
        kind: "manga",
        nsfw: false,
        status: "ongoing",
        updatedAt: 1_000,
      },
    ]);
    expect(backup.favorites).toEqual([
      { moduleId: "ejemplo", seriesId: "s-1", folderId, addedAt: 3_000, updatedAt: 3_000 },
    ]);
    expect(backup.progress).toEqual([
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
    expect(backup.read).toEqual([
      { moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-1", readAt: 5_000 },
    ]);
    expect(backup.prefs).toEqual([
      {
        moduleId: "ejemplo",
        seriesId: "s-1",
        readerMode: "paged-rtl",
        preferredGroup: "grupo-techo",
        updatedAt: 7_000,
      },
    ]);
    expect(backup.settings).toEqual({ language: "es", nsfwVisible: "false" });
  });

  it("los campos opcionales se exportan como `null`, no se omiten", async () => {
    const series = new SeriesStore({ driver, clock });
    const progreso = new ProgressStore({ driver, clock });
    const prefs = new SeriesPrefs({ driver, clock });

    await series.upsert({ moduleId: "ejemplo", seriesId: "s-2", title: "Sueltas" });
    clock.set(2_000);
    await progreso.save({ moduleId: "ejemplo", seriesId: "s-2", chapterId: "cap-1", pageIndex: 0 });
    clock.set(3_000);
    await prefs.setReaderMode("ejemplo", "s-2", "vertical");

    const backup = await exportBackup({ driver, storage, clock });

    expect(backup.series[0]).toMatchObject({ coverUrl: null, kind: null, status: null });
    expect(backup.progress[0]).toMatchObject({ releaseId: null, chapterTitle: null, pageTotal: null });
    expect(backup.prefs[0]).toMatchObject({ preferredGroup: null });
  });
});
