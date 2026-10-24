import { describe, expect, it } from "vitest";

import { exportBackup } from "../../src/backup/export";
import { importBackup, type ImportResult } from "../../src/backup/import";
import type { Backup } from "../../src/backup/schema";
import type { RepoIndex } from "../../src/contract/repoIndex";
import { moduleKey, type InstalledPackage } from "../../src/install/PackageInstaller";
import { Favorites } from "../../src/library/Favorites";
import { Folders } from "../../src/library/Folders";
import { SeriesPrefs } from "../../src/library/SeriesPrefs";
import { SeriesStore } from "../../src/library/SeriesStore";
import { ModuleRegistry } from "../../src/modules/ModuleRegistry";
import { FixedClock, MemoryStorage, StubHttp } from "../../src/ports/fakes";
import { ChapterReadStore } from "../../src/progress/ChapterReadStore";
import { ProgressStore } from "../../src/progress/ProgressStore";
import { RepoRegistry, type RepoIndexValidator } from "../../src/repo/RepoRegistry";
import type { SqlDriver } from "../../src/storage/SqlDriver";

import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * E2E del respaldo (T30): AC-7 y AC-8, RF-38.
 *
 * Recorre el flujo completo con dos dispositivos reales (SQLite en memoria + `Storage`)
 * unidos solo por el JSON del respaldo:
 *
 * 1. el origen exporta biblioteca, carpetas, progreso, preferencias, ajustes, repos y
 *    módulos;
 * 2. una instalación limpia importa ese texto y reproduce el estado **sin pérdidas**;
 * 3. los repos y módulos **no se instalan ni registran solos**: vuelven como sugerencias y
 *    solo el usuario los confirma;
 * 4. al fusionar con un conflicto, gana el `updated_at` más reciente.
 */

const REPO_A = "https://repo-a.example.com/index.json";
const REPO_B = "https://repo-b.example.com/index.json";

const INDICE_A: RepoIndex = {
  format: "ryuunest-repo",
  version: 1,
  name: "Portal de Ceniza",
  updatedAt: "2026-10-01T00:00:00Z",
  modules: [],
};

const INDICE_B: RepoIndex = {
  format: "ryuunest-repo",
  version: 1,
  name: "Portal de Jade",
  updatedAt: "2026-10-02T00:00:00Z",
  modules: [],
};

/** El validador real vive en `module-sdk` (P-37); aquí basta con aceptar el fixture. */
const aceptarIndice: RepoIndexValidator = (value) => ({ ok: true, value: value as RepoIndex });

/** Paquete instalado en el origen: el respaldo solo debe llevarse su metadata. */
const MODULO: InstalledPackage = {
  id: "ejemplo",
  version: "2.1.0",
  repoUrl: REPO_A,
  runtime: "script",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  permissions: { domains: ["repo-a.example.com"] },
  manifest: {
    id: "ejemplo",
    name: "Ejemplo",
    version: "2.1.0",
    apiVersion: 1,
    runtime: "script",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    baseUrl: "https://repo-a.example.com",
    capabilities: ["popular"],
    permissions: { domains: ["repo-a.example.com"] },
    entry: "index.js",
  },
  files: [],
  installedAt: 1_000,
  enabled: true,
};

interface Dispositivo {
  driver: SqlDriver;
  storage: MemoryStorage;
  clock: FixedClock;
  repos: RepoRegistry;
  modules: ModuleRegistry;
}

/** Un dispositivo nuevo: base migrada y almacén clave-valor vacío. */
async function dispositivoLimpio(clock = new FixedClock(1_000)): Promise<Dispositivo> {
  const driver = await openMigratedDriver();
  const storage = new MemoryStorage();
  const http = new StubHttp({
    [REPO_A]: { body: JSON.stringify(INDICE_A) },
    [REPO_B]: { body: JSON.stringify(INDICE_B) },
  });

  return {
    driver,
    storage,
    clock,
    repos: new RepoRegistry({ storage, http, clock, validateIndex: aceptarIndice }),
    modules: new ModuleRegistry({ storage }),
  };
}

/**
 * El dispositivo de origen: dos repos (uno con un módulo instalado), dos carpetas, cuatro
 * series, tres favoritos, dos progresos, tres capítulos leídos, preferencias y ajustes.
 * Cada bloque lleva su propia fecha para que la fusión tenga algo que comparar.
 */
async function dispositivoDeOrigen(): Promise<Dispositivo> {
  const dispositivo = await dispositivoLimpio(new FixedClock(1_000));
  const { driver, storage, clock, repos } = dispositivo;

  await repos.addRepo(REPO_A); // addedAt = 1 000
  clock.set(2_000);
  await repos.addRepo(REPO_B); // addedAt = 2 000

  clock.set(3_000);
  const carpetas = new Folders({ driver, clock });
  const tesoros = await carpetas.create("Tesoros", 0);
  const pendientes = await carpetas.create("Pendientes", 1);

  clock.set(4_000);
  const series = new SeriesStore({ driver, clock });
  await series.upsert({
    moduleId: "ejemplo",
    seriesId: "s-1",
    title: "Reyes de la Noche",
    coverUrl: "https://img.example.com/reyes.jpg",
    kind: "manga",
    status: "ongoing",
  });
  await series.upsert({
    moduleId: "ejemplo",
    seriesId: "s-2",
    title: "Bruma de Jade",
    kind: "manhwa",
    status: "completed",
  });
  await series.upsert({
    moduleId: "otro",
    seriesId: "s-3",
    title: "Sendero Roto",
    kind: "manhua",
    nsfw: true,
    status: "hiatus",
  });
  await series.upsert({
    moduleId: "otro",
    seriesId: "s-4",
    title: "Café y Ceniza",
    kind: "comic",
    status: "unknown",
  });

  clock.set(5_000);
  const favoritos = new Favorites({ driver, clock });
  await favoritos.add("ejemplo", "s-1", tesoros);
  await favoritos.add("ejemplo", "s-2", pendientes);
  await favoritos.add("otro", "s-3", null);

  clock.set(6_000);
  const progresos = new ProgressStore({ driver, clock });
  await progresos.save({
    moduleId: "ejemplo",
    seriesId: "s-1",
    chapterId: "cap-12",
    chapterTitle: "El pacto",
    pageIndex: 8,
    pageTotal: 40,
  });
  await progresos.save({
    moduleId: "otro",
    seriesId: "s-3",
    chapterId: "cap-2",
    pageIndex: 0,
    pageTotal: 25,
  });

  clock.set(7_000);
  const leidos = new ChapterReadStore({ driver, clock });
  await leidos.markRead({ moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-11" });
  await leidos.markRead({ moduleId: "ejemplo", seriesId: "s-1", chapterId: "cap-12" });
  await leidos.markRead({ moduleId: "otro", seriesId: "s-3", chapterId: "cap-1" });

  clock.set(8_000);
  const prefs = new SeriesPrefs({ driver, clock });
  await prefs.setReaderMode("ejemplo", "s-1", "vertical");
  await prefs.setReaderMode("ejemplo", "s-2", "paged-ltr");
  await prefs.setPreferredGroup("ejemplo", "s-2", "Oficial");
  await prefs.setReaderMode("otro", "s-3", "paged-rtl");

  clock.set(9_000);
  await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["language", "es"]);
  await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["nsfwVisible", "false"]);
  await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["reader.keepPages", "3"]);

  await storage.set(moduleKey(MODULO.id), JSON.stringify(MODULO));

  clock.set(10_000);
  return dispositivo;
}

async function exportar(dispositivo: Dispositivo): Promise<Backup> {
  return exportBackup({
    driver: dispositivo.driver,
    storage: dispositivo.storage,
    clock: dispositivo.clock,
  });
}

async function importar(
  dispositivo: Dispositivo,
  respaldo: Backup,
  mode: "merge" | "replace",
): Promise<Extract<ImportResult, { ok: true }>> {
  const result = await importBackup({ driver: dispositivo.driver, mode }, JSON.stringify(respaldo));
  if (!result.ok) {
    throw new Error(`Se esperaba un respaldo aplicado y se rechazó: ${result.message}`);
  }
  return result;
}

/** Las secciones de usuario del respaldo, sin `createdAt` (cambia en cada exportación). */
function bibliotecaDe(backup: Backup): Omit<Backup, "createdAt" | "repos" | "modules"> {
  return {
    format: backup.format,
    version: backup.version,
    folders: backup.folders,
    series: backup.series,
    favorites: backup.favorites,
    progress: backup.progress,
    read: backup.read,
    prefs: backup.prefs,
    settings: backup.settings,
  };
}

describe("respaldo E2E (AC-7, AC-8, RF-38)", () => {
  it("reproduce biblioteca, carpetas, progreso, preferencias y ajustes sin pérdidas en una instalación limpia", async () => {
    const origen = await dispositivoDeOrigen();
    const respaldo = await exportar(origen);

    const destino = await dispositivoLimpio(new FixedClock(20_000));
    const resultado = await importar(destino, respaldo, "replace");

    expect(resultado.summary.mode).toBe("replace");
    expect(resultado.summary.counts.folders.added).toBe(2);
    expect(resultado.summary.counts.series.added).toBe(4);
    expect(resultado.summary.counts.progress.added).toBe(2);
    expect(resultado.summary.counts.read.added).toBe(3);

    const restaurado = await exportar(destino);
    expect(bibliotecaDe(restaurado)).toEqual(bibliotecaDe(respaldo));

    // Comprobaciones concretas para que el igualado anterior no pase por vacío.
    expect(restaurado.folders.map((folder) => folder.name)).toEqual(["Tesoros", "Pendientes"]);
    expect(restaurado.favorites).toHaveLength(3);
    expect(restaurado.favorites.find((row) => row.seriesId === "s-1")?.folderId).toBe(
      restaurado.folders[0]?.id,
    );
    expect(restaurado.progress.find((row) => row.seriesId === "s-1")).toMatchObject({
      chapterId: "cap-12",
      chapterTitle: "El pacto",
      pageIndex: 8,
      pageTotal: 40,
    });
    expect(restaurado.read.map((row) => row.chapterId).sort()).toEqual(["cap-1", "cap-11", "cap-12"]);
    expect(restaurado.settings).toEqual({
      language: "es",
      nsfwVisible: "false",
      "reader.keepPages": "3",
    });
  });

  it("no instala ni registra nada solo: repos y módulos vuelven como sugerencias", async () => {
    const origen = await dispositivoDeOrigen();
    const respaldo = await exportar(origen);

    const destino = await dispositivoLimpio(new FixedClock(20_000));
    const resultado = await importar(destino, respaldo, "merge");

    // El respaldo lleva dos repos y un módulo; sin esto, las comprobaciones serían vacías.
    expect(respaldo.repos.map((repo) => repo.url)).toEqual([REPO_A, REPO_B]);
    expect(respaldo.modules.map((module) => module.id)).toEqual([MODULO.id]);

    expect(resultado.suggestions.repos).toEqual(respaldo.repos);
    expect(resultado.suggestions.modules).toEqual(respaldo.modules);

    // Nada se instala ni se registra por su cuenta (AC-8): ni repos, ni módulos.
    expect(await destino.repos.listRepos()).toEqual([]);
    expect(await destino.modules.list()).toEqual([]);
    expect(await destino.storage.keys("repo:")).toEqual([]);
    expect(await destino.storage.keys("module:")).toEqual([]);
  });

  it("solo al confirmar las sugerencias se recuperan los repos (RF-38)", async () => {
    const origen = await dispositivoDeOrigen();
    const respaldo = await exportar(origen);

    const destino = await dispositivoLimpio(new FixedClock(20_000));
    const resultado = await importar(destino, respaldo, "merge");

    for (const repo of resultado.suggestions.repos) {
      await destino.repos.addRepo(repo.url);
    }

    const registrados = await destino.repos.listRepos();
    expect(registrados.map(({ url, name }) => ({ url, name }))).toEqual(
      respaldo.repos.map(({ url, name }) => ({ url, name })),
    );

    // Confirmar un repo no instala sus módulos: eso exige su propia confirmación.
    expect(await destino.modules.list()).toEqual([]);
  });

  it("al fusionar un conflicto de progreso gana el updated_at más reciente", async () => {
    const origen = await dispositivoLimpio(new FixedClock(1_000));
    const seriesOrigen = new SeriesStore({ driver: origen.driver, clock: origen.clock });
    await seriesOrigen.upsert({ moduleId: "ejemplo", seriesId: "s-1", title: "Reyes de la Noche" });
    await seriesOrigen.upsert({ moduleId: "ejemplo", seriesId: "s-2", title: "Bruma de Jade" });
    await seriesOrigen.upsert({ moduleId: "ejemplo", seriesId: "s-3", title: "Sendero Roto" });
    const progresosOrigen = new ProgressStore({ driver: origen.driver, clock: origen.clock });

    origen.clock.set(4_000);
    await progresosOrigen.save({
      moduleId: "ejemplo",
      seriesId: "s-2",
      chapterId: "cap-3",
      pageIndex: 1,
      pageTotal: 30,
    });
    origen.clock.set(5_000);
    await progresosOrigen.save({
      moduleId: "ejemplo",
      seriesId: "s-1",
      chapterId: "cap-20",
      pageIndex: 9,
      pageTotal: 40,
    });
    origen.clock.set(6_000);
    await progresosOrigen.save({
      moduleId: "ejemplo",
      seriesId: "s-3",
      chapterId: "cap-7",
      pageIndex: 4,
      pageTotal: 20,
    });
    origen.clock.set(7_000);
    const respaldo = await exportar(origen);

    const destino = await dispositivoLimpio(new FixedClock(1_000));
    const seriesDestino = new SeriesStore({ driver: destino.driver, clock: destino.clock });
    await seriesDestino.upsert({ moduleId: "ejemplo", seriesId: "s-1", title: "Reyes de la Noche" });
    await seriesDestino.upsert({ moduleId: "ejemplo", seriesId: "s-2", title: "Bruma de Jade" });
    await seriesDestino.upsert({ moduleId: "ejemplo", seriesId: "s-3", title: "Sendero Roto" });
    const progresosDestino = new ProgressStore({ driver: destino.driver, clock: destino.clock });

    destino.clock.set(3_000);
    await progresosDestino.save({
      moduleId: "ejemplo",
      seriesId: "s-1",
      chapterId: "cap-12",
      pageIndex: 2,
      pageTotal: 40,
    });
    destino.clock.set(6_000);
    await progresosDestino.save({
      moduleId: "ejemplo",
      seriesId: "s-3",
      chapterId: "cap-7",
      pageIndex: 2,
      pageTotal: 20,
    });
    destino.clock.set(7_000);
    await progresosDestino.save({
      moduleId: "ejemplo",
      seriesId: "s-2",
      chapterId: "cap-3",
      pageIndex: 6,
      pageTotal: 30,
    });
    destino.clock.set(8_000);
    const resultado = await importar(destino, respaldo, "merge");
    expect(resultado.summary.counts.progress).toEqual({ added: 0, updated: 1, kept: 2 });

    const fusionado = await exportar(destino);
    const porSerie = new Map(fusionado.progress.map((row) => [row.seriesId, row]));

    // s-1: el respaldo (5 000) es más reciente que lo local (3 000) → gana el respaldo.
    expect(porSerie.get("s-1")).toMatchObject({
      chapterId: "cap-20",
      pageIndex: 9,
      updatedAt: 5_000,
    });
    // s-2: lo local (7 000) es más reciente que el respaldo (4 000) → se conserva lo local.
    expect(porSerie.get("s-2")).toMatchObject({
      chapterId: "cap-3",
      pageIndex: 6,
      updatedAt: 7_000,
    });
    // s-3: empate (6 000) → se conserva lo local, no se pisa con el respaldo (P-68).
    expect(porSerie.get("s-3")).toMatchObject({
      chapterId: "cap-7",
      pageIndex: 2,
      updatedAt: 6_000,
    });
  });
});
