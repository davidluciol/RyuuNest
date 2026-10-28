import {
  InstallFlow,
  ModuleError,
  ModuleRegistry,
  PackageInstaller,
  RepoRegistry,
  SqliteStorage,
  type Archive,
  type Clock,
  type Http,
  type InstallConfirmation,
  type InstallPreview,
  type MediaKind,
  type SecureLock,
  type SqlDriver,
  type UpdatePreview,
} from "@ryuunest/core";
import { validateManifest, validateRepoIndex } from "@ryuunest/module-sdk";

import { OFFICIAL_REPO_DISMISSAL_SETTING, OFFICIAL_REPO_URL } from "../../data/officialRepo";

/**
 * F16 — capa de datos de Fuentes (RF-1 a RF-8). Junta el núcleo (T12–T15) con
 * las piezas de la plataforma: `SqliteStorage` sobre el `SqlDriver`, la `Http`
 * y el `Archive` de la app y el `SecureLock` del dispositivo. La pantalla no
 * importa el núcleo: habla con `SourcesService` (patrón de F14c y F15b).
 *
 * RF-7 (protección de instalación): se lee de la tabla `setting`
 * (`security.installProtection`, apagada por defecto; el interruptor lo pone
 * F20). Activa, añadir un repo e instalar o actualizar un módulo **script**
 * piden el bloqueo del dispositivo; si no hay bloqueo, falla cerrado.
 */

/** Ajuste (tabla `setting`, SPEC §8.1) que activa la protección de instalación. */
export const INSTALL_PROTECTION_SETTING = ["security", "installProtection"].join(".");

export interface RepoRow {
  id: string;
  name: string;
  url: string;
  moduleCount: number;
}

/** Una fila de la lista de módulos: instalado o solo disponible en un repo. */
export interface SourceModule {
  id: string;
  name: string;
  status: "installed" | "available";
  version: string;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;
  nsfw: boolean;
  domains: string[];
  /** Repo de origen: el del paquete instalado o el que lo ofrece. */
  repoId: string;
  enabled: boolean;
  /** Instalado cuyo repo ya no está registrado (RF-8: sin actualizaciones). */
  orphan: boolean;
  /** Versión nueva disponible en el índice del repo (RF-6). */
  updateTo?: string;
  lastError?: string;
}

export interface SourcesData {
  repos: RepoRow[];
  modules: SourceModule[];
  /**
   * El usuario quitó el repo oficial (P-85): no se vuelve a añadir solo y la
   * pantalla avisa de cómo recuperarlo.
   */
  officialRepoDismissed: boolean;
}

/** Resultado de actualizar para la pantalla: no necesita el paquete entero. */
export type SourcesUpdateResult =
  { status: "updated" } | { status: "needs-confirmation"; reasons: string[] };

export interface SourcesService {
  load(): Promise<SourcesData>;
  addRepo(url: string): Promise<void>;
  /**
   * Repo oficial por defecto (P-85): con la lista vacía y sin descarte, lo
   * registra. Devuelve si lo añadió; si el índice falla, lanza.
   */
  ensureOfficialRepo(): Promise<boolean>;
  /** Vuelve a registrar el repo oficial y limpia el descarte (Ajustes). */
  restoreOfficialRepo(): Promise<void>;
  /** Vuelve a leer el índice de un repo ya registrado (RF-6: detecta versiones nuevas). */
  refreshRepo(id: string): Promise<void>;
  removeRepo(id: string): Promise<void>;
  previewInstall(repoId: string, moduleId: string): Promise<InstallPreview>;
  install(repoId: string, moduleId: string, confirmation: InstallConfirmation): Promise<void>;
  setEnabled(moduleId: string, enabled: boolean): Promise<void>;
  uninstall(moduleId: string): Promise<void>;
  previewUpdate(moduleId: string): Promise<UpdatePreview>;
  applyUpdate(
    moduleId: string,
    confirmation: Partial<InstallConfirmation>,
  ): Promise<SourcesUpdateResult>;
  recordModuleError(moduleId: string, message: string | undefined): Promise<void>;
}

export interface SourcesServiceDeps {
  driver: SqlDriver;
  http: Http;
  archive: Archive;
  secureLock: SecureLock;
  clock: Clock;
  appVersion?: string;
}

export function createSourcesService(deps: SourcesServiceDeps): SourcesService {
  const { driver, http, archive, secureLock, clock, appVersion } = deps;
  const storage = new SqliteStorage(driver);
  const repos = new RepoRegistry({
    storage,
    http,
    clock,
    validateIndex: (value) => validateRepoIndex(value, appVersion ? { appVersion } : {}),
  });
  const modules = new ModuleRegistry({ storage });
  const installer = new PackageInstaller({
    http,
    archive,
    storage,
    clock,
    validateManifest: validateManifest,
    ...(appVersion === undefined ? {} : { appVersion }),
  });
  const flow = new InstallFlow({ repos, installer, modules });

  async function protectionOn(): Promise<boolean> {
    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      INSTALL_PROTECTION_SETTING,
    ]);
    return row?.value === "true";
  }

  async function officialDismissed(): Promise<boolean> {
    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      OFFICIAL_REPO_DISMISSAL_SETTING,
    ]);
    return row?.value === "true";
  }

  /** RF-7: con la protección activa pide el bloqueo; sin bloqueo, no se instala. */
  async function requireUnlock(reason: string): Promise<void> {
    if (!(await protectionOn())) return;
    if (!(await secureLock.isAvailable())) {
      throw new ModuleError(
        "UNSUPPORTED",
        "La protección de instalación está activa y este dispositivo no tiene bloqueo configurado",
      );
    }
    if (!(await secureLock.authenticate(reason))) {
      throw new ModuleError("UNSUPPORTED", "No se confirmó el bloqueo del dispositivo");
    }
  }

  return {
    async load() {
      const [repoRecords, offered, installed] = await Promise.all([
        repos.listRepos(),
        repos.listModules(),
        modules.list(),
      ]);
      const repoIds = new Set(repoRecords.map((repo) => repo.id));
      const rows: SourceModule[] = [];

      for (const pkg of installed) {
        const entry = offered.find((o) => o.id === pkg.id && o.repoId === pkg.repoUrl);
        rows.push({
          id: pkg.id,
          name: pkg.manifest.name,
          status: "installed",
          version: pkg.version,
          runtime: pkg.runtime,
          kinds: pkg.kinds,
          lang: pkg.lang,
          nsfw: pkg.nsfw,
          domains: pkg.permissions.domains,
          repoId: pkg.repoUrl,
          enabled: pkg.enabled,
          orphan: !repoIds.has(pkg.repoUrl),
          ...(entry !== undefined && entry.version !== pkg.version
            ? { updateTo: entry.version }
            : {}),
          ...(pkg.lastError === undefined ? {} : { lastError: pkg.lastError }),
        });
      }

      const installedIds = new Set(installed.map((pkg) => pkg.id));
      for (const entry of offered) {
        if (installedIds.has(entry.id)) continue;
        rows.push({
          id: entry.id,
          name: entry.name,
          status: "available",
          version: entry.version,
          runtime: entry.runtime,
          kinds: entry.kinds,
          lang: entry.lang,
          nsfw: entry.nsfw,
          domains: entry.permissions.domains,
          repoId: entry.repoId,
          enabled: false,
          orphan: false,
        });
      }

      return {
        repos: repoRecords.map((repo) => ({
          id: repo.id,
          name: repo.name,
          url: repo.url,
          moduleCount: offered.filter((o) => o.repoId === repo.id).length,
        })),
        modules: rows,
        officialRepoDismissed: await officialDismissed(),
      };
    },

    async addRepo(url) {
      await requireUnlock("Confirma para añadir el repositorio");
      await repos.addRepo(url);
      // Reponer el oficial a mano también limpia el descarte (P-85).
      if (url === OFFICIAL_REPO_URL) {
        await driver.run("DELETE FROM setting WHERE key = ?", [OFFICIAL_REPO_DISMISSAL_SETTING]);
      }
    },

    async ensureOfficialRepo() {
      if ((await repos.listRepos()).length > 0) return false;
      if (await officialDismissed()) return false;
      // Primera parte (P-85): no pide el bloqueo; RF-7 protege los repos que
      // añade el usuario. Si el índice falla, lanza y quien llama decide.
      await repos.addRepo(OFFICIAL_REPO_URL);
      return true;
    },

    async restoreOfficialRepo() {
      await repos.addRepo(OFFICIAL_REPO_URL);
      await driver.run("DELETE FROM setting WHERE key = ?", [OFFICIAL_REPO_DISMISSAL_SETTING]);
    },

    async refreshRepo(id) {
      // Releer un repo ya registrado no es añadir uno nuevo: no pide el bloqueo (RF-7).
      await repos.addRepo(id);
    },

    async removeRepo(id) {
      await repos.removeRepo(id);
      if (id === OFFICIAL_REPO_URL) {
        // P-85: quitar el oficial se recuerda para no volver a añadirlo solo.
        await driver.run("INSERT OR REPLACE INTO setting (key, value) VALUES (?, 'true')", [
          OFFICIAL_REPO_DISMISSAL_SETTING,
        ]);
      }
    },

    previewInstall: (repoId, moduleId) => flow.preview(repoId, moduleId),

    async install(repoId, moduleId, confirmation) {
      // Sin confirmación no se pide el bloqueo ni se toca nada (AC-8).
      if (confirmation.confirmed === true) {
        const preview = await flow.preview(repoId, moduleId);
        if (preview.runtime === "script") {
          await requireUnlock("Confirma para instalar un módulo que ejecuta código");
        }
      }
      await flow.install(repoId, moduleId, confirmation);
    },

    async setEnabled(moduleId, enabled) {
      await modules.setEnabled(moduleId, enabled);
    },

    async uninstall(moduleId) {
      await modules.uninstall(moduleId);
    },

    previewUpdate: (moduleId) => flow.previewUpdate(moduleId),

    async applyUpdate(moduleId, confirmation) {
      const preview = await flow.previewUpdate(moduleId);
      if (preview.available && preview.reinforced && confirmation.confirmed === true) {
        await requireUnlock("Confirma para actualizar a un módulo que ejecuta código");
      }
      const result = await flow.applyUpdate(moduleId, confirmation);
      return result.status === "updated"
        ? { status: "updated" }
        : { status: "needs-confirmation", reasons: result.reasons };
    },

    async recordModuleError(moduleId, message) {
      await modules.setLastError(moduleId, message);
    },
  };
}

/**
 * Carga inicial de Fuentes (P-85): con cero repos y sin descarte, prueba el
 * repo oficial una sola vez; si no se puede descargar (sin red o índice
 * caído), la pantalla sigue con el estado vacío y un aviso. La usan la ruta
 * de Fuentes y, más adelante, la de primer uso.
 */
export async function loadSourcesWithOfficialRepo(
  service: SourcesService,
): Promise<{ data: SourcesData; officialRepoFailed: boolean }> {
  const data = await service.load();
  if (data.repos.length > 0 || data.officialRepoDismissed) {
    return { data, officialRepoFailed: false };
  }
  try {
    const added = await service.ensureOfficialRepo();
    return { data: added ? await service.load() : data, officialRepoFailed: false };
  } catch {
    return { data, officialRepoFailed: true };
  }
}
