import { ModuleError, type InstallPreview } from "@ryuunest/core";

import type { SourceModule, SourcesData, SourcesService, SourcesUpdateResult } from "./sourcesData";
import { SAMPLE_SOURCES_DATA } from "./sourcesFixtures";

/**
 * F16 — `SourcesService` en memoria para la web (sin SQLite: F14c, P-79) y la
 * galería. Parte de una copia de los datos de ejemplo y aplica las mismas
 * reglas de confirmación que el núcleo (AC-8, confirmación reforzada, RF-6),
 * así Playwright recorre instalar, actualizar y desinstalar sin red.
 * Nada de esto se instala de verdad.
 */

/** Hash de ejemplo para la vista previa (no corresponde a ningún paquete real). */
const SAMPLE_SHA256 = "0".repeat(64);

/** Repo que añade el servicio de ejemplo en la web: el de los datos de ejemplo. */
const SAMPLE_REPO = SAMPLE_SOURCES_DATA.repos[0];

function clone(data: SourcesData): SourcesData {
  return {
    repos: data.repos.map((repo) => ({ ...repo })),
    modules: data.modules.map((module) => ({
      ...module,
      kinds: [...module.kinds],
      domains: [...module.domains],
    })),
  };
}

export function createSampleSourcesService(
  initial: SourcesData = SAMPLE_SOURCES_DATA,
): SourcesService {
  let state = clone(initial);

  function find(id: string): SourceModule {
    const module = state.modules.find((candidate) => candidate.id === id);
    if (module === undefined) {
      throw new ModuleError("NOT_FOUND", `El módulo ${id} no existe`);
    }
    return module;
  }

  function replace(id: string, patch: (module: SourceModule) => SourceModule): void {
    state = {
      ...state,
      modules: state.modules.map((module) => (module.id === id ? patch(module) : module)),
    };
  }

  return {
    async load() {
      return clone(state);
    },

    async addRepo(url) {
      if (!url.startsWith("https://")) {
        throw new ModuleError("UNSUPPORTED", "El repositorio debe usar HTTPS");
      }
      if (SAMPLE_REPO === undefined || state.repos.some((repo) => repo.id === SAMPLE_REPO.id)) {
        return;
      }
      state = {
        repos: [...state.repos, { ...SAMPLE_REPO }],
        modules: [
          ...state.modules,
          ...SAMPLE_SOURCES_DATA.modules
            .filter(
              (module) =>
                module.status === "available" &&
                !state.modules.some((existing) => existing.id === module.id),
            )
            .map((module) => ({ ...module })),
        ],
      };
    },

    async refreshRepo(id) {
      if (!state.repos.some((repo) => repo.id === id)) {
        throw new ModuleError("NOT_FOUND", `El repositorio ${id} no está registrado`);
      }
    },

    async removeRepo(id) {
      state = {
        repos: state.repos.filter((repo) => repo.id !== id),
        modules: state.modules
          .filter((module) => module.status === "installed" || module.repoId !== id)
          .map((module) => (module.repoId === id ? { ...module, orphan: true } : module)),
      };
    },

    async previewInstall(_repoId, moduleId): Promise<InstallPreview> {
      const module = find(moduleId);
      return {
        id: module.id,
        name: module.name,
        version: module.version,
        runtime: module.runtime,
        kinds: module.kinds,
        lang: module.lang,
        nsfw: module.nsfw,
        permissions: { domains: module.domains },
        repoId: module.repoId,
        sha256: SAMPLE_SHA256,
        size: 1024,
        reinforced: module.runtime === "script",
      };
    },

    async install(_repoId, moduleId, confirmation) {
      const module = find(moduleId);
      if (confirmation.confirmed !== true) {
        throw new ModuleError(
          "UNSUPPORTED",
          `La instalación de «${module.name}» requiere confirmación manual`,
        );
      }
      if (module.runtime === "script" && confirmation.reinforced !== true) {
        throw new ModuleError(
          "UNSUPPORTED",
          `Los módulos script exigen confirmación reforzada (mantener pulsado): «${module.name}»`,
        );
      }
      replace(moduleId, (current) => ({ ...current, status: "installed", enabled: true }));
    },

    async setEnabled(moduleId, enabled) {
      find(moduleId);
      replace(moduleId, (module) => ({ ...module, enabled }));
    },

    async uninstall(moduleId) {
      find(moduleId);
      replace(moduleId, (module) => {
        const { updateTo: _updateTo, lastError: _lastError, ...rest } = module;
        return { ...rest, status: "available", enabled: false };
      });
    },

    async previewUpdate(moduleId) {
      const module = find(moduleId);
      return {
        moduleId,
        currentVersion: module.version,
        available: module.updateTo !== undefined,
        ...(module.updateTo === undefined ? {} : { nextVersion: module.updateTo }),
        reasons: [],
        needsConfirmation: false,
        reinforced: false,
      };
    },

    async applyUpdate(moduleId, _confirmation): Promise<SourcesUpdateResult> {
      const module = find(moduleId);
      if (module.updateTo === undefined) {
        throw new ModuleError("UNSUPPORTED", `«${module.name}» ya está en su última versión`);
      }
      const updateTo = module.updateTo;
      replace(moduleId, (current) => {
        const { updateTo: _updateTo, lastError: _lastError, ...rest } = current;
        return { ...rest, version: updateTo };
      });
      return { status: "updated" };
    },

    async recordModuleError(moduleId, message) {
      find(moduleId);
      replace(moduleId, (module) => {
        const { lastError: _lastError, ...rest } = module;
        return message === undefined ? rest : { ...rest, lastError: message };
      });
    },
  };
}
