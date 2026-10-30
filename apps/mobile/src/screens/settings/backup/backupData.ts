import {
  exportBackup,
  importBackup,
  ModuleRegistry,
  RepoRegistry,
  SqliteStorage,
  type BackupModule,
  type BackupRepo,
  type Clock,
  type Http,
  type ImportMode,
  type ImportResult,
  type MediaKind,
  type SqlDriver,
} from "@ryuunest/core";
import { validateRepoIndex } from "@ryuunest/module-sdk";

import type { BackupFiles } from "../../../data/backupFilesPort";

/**
 * F21 — capa de datos del respaldo en Ajustes (RF-37, RF-38; T28/T29 en el
 * núcleo). La pantalla no importa el núcleo: habla con `BackupService`
 * (patrón de F14c, F15b, F16 y F20).
 *
 * - `exportText` vuelca el estado local con `exportBackup` (lectura pura).
 * - `importText` aplica el texto con `importBackup` (`merge` o `replace`);
 *   un rechazo (`TOO_LARGE`/`NOT_JSON`/`INVALID`) **no toca datos** y vuelve
 *   como resultado, no como excepción.
 * - Las sugerencias (repos y módulos del respaldo) **nunca se instalan
 *   solas** (AC-8): `pendingRepos` descarta los repos ya registrados y
 *   `confirmRepo` registra uno solo con su confirmación; un módulo sugerido
 *   no se puede instalar desde aquí: pasa por el flujo de Fuentes.
 */

/** Sugerencia de repo del respaldo, ya filtrada (no registrada). */
export interface RepoSuggestion {
  url: string;
  name: string;
}

/** Sugerencia de módulo del respaldo (solo metadata, sin código). */
export interface ModuleSuggestion {
  id: string;
  version: string;
  repoUrl: string;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;
  nsfw: boolean;
}

/** Sugerencias tras importar: repos pendientes y módulos sugeridos. */
export interface BackupSuggestions {
  repos: RepoSuggestion[];
  modules: ModuleSuggestion[];
}

/** Resumen de una importación aplicada, para el aviso de éxito. */
export interface BackupImportSummary {
  mode: ImportMode;
  /** Filas añadidas por sección (totales). */
  added: number;
  /** Filas actualizadas por sección (totales). */
  updated: number;
  /** Filas que se quedaron como estaban (totales). */
  kept: number;
}

export interface BackupService {
  /** Vuelca el estado local como texto JSON (SPEC §8.3). */
  exportText(): Promise<string>;
  /** Lee el texto del respaldo y lo aplica; devuelve el resultado del núcleo. */
  applyText(text: string, mode: ImportMode): Promise<ImportResult>;
  /** Comparte (nativo) o descarga (web) el texto como archivo JSON. */
  shareText(text: string): Promise<void>;
  /** Abre el selector y devuelve el texto elegido, o `null` si canceló. */
  pickText(): Promise<{ text: string; name: string } | null>;
  /** Repos sugeridos que aún no están registrados (orden del respaldo). */
  pendingRepos(suggestions: readonly BackupRepo[]): Promise<RepoSuggestion[]>;
  /** Registra un repo sugerido (con su descarga de índice, RF-2). */
  confirmRepo(url: string): Promise<void>;
  /** Módulos sugeridos que aún no están instalados. */
  pendingModules(suggestions: readonly BackupModule[]): Promise<ModuleSuggestion[]>;
}

export interface BackupServiceDeps {
  driver: SqlDriver;
  http: Http;
  clock: Clock;
  files: BackupFiles;
  appVersion?: string;
}

/** Suma los conteos por sección en totales. */
export function summarizeImport(result: Extract<ImportResult, { ok: true }>): BackupImportSummary {
  let added = 0;
  let updated = 0;
  let kept = 0;
  for (const counts of Object.values(result.summary.counts)) {
    added += counts.added;
    updated += counts.updated;
    kept += counts.kept;
  }
  return { mode: result.summary.mode, added, updated, kept };
}

export function createBackupService(deps: BackupServiceDeps): BackupService {
  const { driver, http, clock, files } = deps;
  const storage = new SqliteStorage(driver);
  const repos = new RepoRegistry({
    storage,
    http,
    clock,
    validateIndex: (value) => validateRepoIndex(value, deps.appVersion ? { appVersion: deps.appVersion } : {}),
  });
  const modules = new ModuleRegistry({ storage });

  return {
    async exportText() {
      const backup = await exportBackup({ driver, storage, clock });
      return JSON.stringify(backup, null, 2);
    },

    async applyText(text, mode) {
      return importBackup({ driver, mode }, text);
    },

    async shareText(text) {
      await files.shareBackup(text);
    },

    async pickText() {
      return files.pickBackup();
    },

    async pendingRepos(suggestions) {
      const registradas = new Set((await repos.listRepos()).map((repo) => repo.url));
      const vistas = new Set<string>();
      const pendientes: RepoSuggestion[] = [];
      for (const repo of suggestions) {
        if (registradas.has(repo.url) || vistas.has(repo.url)) continue;
        vistas.add(repo.url);
        pendientes.push({ url: repo.url, name: repo.name });
      }
      return pendientes;
    },

    async confirmRepo(url) {
      // Igual que añadir un repo en Fuentes: descarga y valida su índice (RF-2).
      await repos.addRepo(url);
    },

    async pendingModules(suggestions) {
      const instalados = new Set((await modules.list()).map((module) => module.id));
      const vistos = new Set<string>();
      const pendientes: ModuleSuggestion[] = [];
      for (const module of suggestions) {
        if (instalados.has(module.id) || vistos.has(module.id)) continue;
        vistos.add(module.id);
        pendientes.push({
          id: module.id,
          version: module.version,
          repoUrl: module.repoUrl,
          runtime: module.runtime,
          kinds: [...module.kinds] as MediaKind[],
          lang: module.lang,
          nsfw: module.nsfw,
        });
      }
      return pendientes;
    },
  };
}
