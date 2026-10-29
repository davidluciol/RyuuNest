import type { ImportResult, MediaKind } from "@ryuunest/core";

import type { BackupFiles } from "../../../data/backupFiles";
import type {
  BackupImportSummary,
  BackupService,
  BackupSuggestions,
  ModuleSuggestion,
  RepoSuggestion,
} from "./backupData";

/** Puerto de archivos inerte para pruebas y galería (sin `document`). */
function createMemoryBackupFiles(): BackupFiles {
  return {
    async shareBackup() {
      return "shared";
    },
    async pickBackup() {
      return null;
    },
    downloadBackup() {},
  };
}

/**
 * F21 — `BackupService` de ejemplo para la web y la galería (sin SQLite, P-79).
 * Reproduce el contrato sin núcleo: exporta un respaldo vacío de ejemplo,
 * importa sin tocar nada (devuelve el rechazo o un resumen de fusión) y
 * sugiere un repo y un módulo de ejemplo que nunca se instalan solos (AC-8).
 */

const SAMPLE_SUGGESTIONS: BackupSuggestions = {
  repos: [{ url: "https://repositorio-ejemplo.test/index.json", name: "Repositorio de ejemplo" }],
  modules: [
    {
      id: "m-ejemplo-a",
      version: "1.0.0",
      repoUrl: "https://repositorio-ejemplo.test/index.json",
      runtime: "declarative",
      kinds: ["manga"] as MediaKind[],
      lang: "es",
      nsfw: false,
    },
  ],
};

export interface SampleBackupState {
  exported: boolean;
  imported: BackupImportSummary | null;
  confirmedRepos: string[];
}

export function createSampleBackupService(
  files: BackupFiles = createMemoryBackupFiles(),
  suggestions: BackupSuggestions = SAMPLE_SUGGESTIONS,
): BackupService & { state: SampleBackupState } {
  const state: SampleBackupState = {
    exported: false,
    imported: null,
    confirmedRepos: [],
  };

  const sampleText = JSON.stringify(
    {
      format: "ryuunest-backup",
      version: 1,
      createdAt: 0,
      repos: suggestions.repos.map((repo) => ({ url: repo.url, name: repo.name, addedAt: 0, updatedAt: 0 })),
      modules: suggestions.modules.map((module) => ({
        id: module.id,
        version: module.version,
        repoUrl: module.repoUrl,
        runtime: module.runtime,
        kinds: module.kinds,
        lang: module.lang,
        nsfw: module.nsfw,
      })),
      folders: [],
      series: [],
      favorites: [],
      progress: [],
      read: [],
      prefs: [],
      settings: {},
    },
    null,
    2,
  );

  return {
    state,

    async exportText() {
      state.exported = true;
      return sampleText;
    },

    async applyText(text, mode): Promise<ImportResult> {
      // El ejemplo valida lo justo para recorrer el flujo: rechaza el JSON
      // roto y un respaldo que no sea de RyuuNest (como el núcleo, F21b).
      let value: unknown;
      try {
        value = JSON.parse(text);
      } catch {
        return { ok: false, reason: "NOT_JSON", message: "El archivo no es un JSON válido", issues: [] };
      }
      if (
        typeof value !== "object" || value === null ||
        (value as { format?: unknown }).format !== "ryuunest-backup"
      ) {
        return {
          ok: false,
          reason: "INVALID",
          message: 'El respaldo no es válido: format: debe ser "ryuunest-backup"',
          issues: [{ path: "format", message: 'debe ser "ryuunest-backup"' }],
        };
      }
      state.imported = { mode, added: 1, updated: 0, kept: 0 };
      return {
        ok: true,
        summary: {
          mode,
          counts: {
            folders: { added: 0, updated: 0, kept: 0 },
            series: { added: 0, updated: 0, kept: 0 },
            favorites: { added: 0, updated: 0, kept: 0 },
            progress: { added: 0, updated: 0, kept: 0 },
            read: { added: 0, updated: 0, kept: 0 },
            prefs: { added: 0, updated: 0, kept: 0 },
            settings: { added: 1, updated: 0, kept: 0 },
          },
        },
        suggestions: {
          repos: suggestions.repos.map((repo) => ({
            url: repo.url,
            name: repo.name,
            addedAt: 0,
            updatedAt: 0,
          })),
          modules: suggestions.modules.map((module) => ({
            id: module.id,
            version: module.version,
            repoUrl: module.repoUrl,
            runtime: module.runtime,
            kinds: module.kinds,
            lang: module.lang,
            nsfw: module.nsfw,
          })),
        },
      };
    },

    async shareText(text) {
      // En web `shareBackup` ya descarga el archivo (no hay hoja del sistema).
      await files.shareBackup(text);
    },

    async pickText() {
      return files.pickBackup();
    },

    async pendingRepos(all) {
      return all
        .filter((repo) => !state.confirmedRepos.includes(repo.url))
        .map((repo): RepoSuggestion => ({ url: repo.url, name: repo.name }));
    },

    async confirmRepo(url) {
      if (!state.confirmedRepos.includes(url)) {
        state.confirmedRepos.push(url);
      }
    },

    async pendingModules(all) {
      return all.map((module): ModuleSuggestion => ({
        id: module.id,
        version: module.version,
        repoUrl: module.repoUrl,
        runtime: module.runtime,
        kinds: [...module.kinds],
        lang: module.lang,
        nsfw: module.nsfw,
      }));
    },
  };
}
