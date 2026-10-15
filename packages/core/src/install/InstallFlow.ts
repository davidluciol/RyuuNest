/**
 * Flujo de instalación (SPEC §7.1, pasos 2–8): previsualizar un módulo del índice de un
 * repo, confirmar e instalar.
 *
 * Es el **único punto de entrada** del núcleo para instalar, y exige confirmación manual
 * (RF-4, **AC-8**): sin `confirmed: true` no se descarga ni se escribe nada. Los módulos
 * `script` exigen además confirmación **reforzada** (mantener pulsado, paso 3).
 */
import { ModuleError } from "../contract/errors.js";
import type { MediaKind } from "../contract/types.js";
import type { ModuleRegistry } from "../modules/ModuleRegistry.js";
import type { RepoModuleSummary, RepoRegistry } from "../repo/RepoRegistry.js";
import type { InstalledPackage, PackageInstaller } from "./PackageInstaller.js";

/** Confirmación manual del usuario (SPEC §7.1, pasos 2 y 3). */
export interface InstallConfirmation {
  /** El usuario confirmó en la pantalla de confirmación. */
  confirmed: boolean;
  /** Confirmación reforzada (mantener pulsado); obligatoria en módulos `script`. */
  reinforced?: boolean;
}

/** Datos para la pantalla de confirmación (SPEC §7.1, paso 2). */
export interface InstallPreview {
  id: string;
  name: string;
  version: string;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;
  nsfw: boolean;
  permissions: { domains: string[] };
  repoId: string;
  sha256: string;
  size: number;
  /** El módulo ejecuta código: la confirmación debe ser reforzada. */
  reinforced: boolean;
}

/** Opciones del flujo. */
export interface InstallFlowOptions {
  repos: RepoRegistry;
  installer: PackageInstaller;
  modules: ModuleRegistry;
}

export class InstallFlow {
  private readonly repos: RepoRegistry;
  private readonly installer: PackageInstaller;
  private readonly modules: ModuleRegistry;

  constructor(options: InstallFlowOptions) {
    this.repos = options.repos;
    this.installer = options.installer;
    this.modules = options.modules;
  }

  /** Datos del módulo del índice, para la pantalla de confirmación. */
  async preview(repoId: string, moduleId: string): Promise<InstallPreview> {
    const entry = await this.requireModule(repoId, moduleId);

    return {
      id: entry.id,
      name: entry.name,
      version: entry.version,
      runtime: entry.runtime,
      kinds: entry.kinds,
      lang: entry.lang,
      nsfw: entry.nsfw,
      permissions: entry.permissions,
      repoId: entry.repoId,
      sha256: entry.sha256,
      size: entry.size,
      reinforced: entry.runtime === "script",
    };
  }

  /**
   * Instala un módulo del repo tras la confirmación manual (RF-4, AC-8). Sin confirmación
   * lanza `UNSUPPORTED` y no toca la red ni el almacén.
   */
  async install(
    repoId: string,
    moduleId: string,
    confirmation: InstallConfirmation,
  ): Promise<InstalledPackage> {
    const entry = await this.requireModule(repoId, moduleId);

    if (confirmation.confirmed !== true) {
      throw new ModuleError(
        "UNSUPPORTED",
        `La instalación de «${entry.name}» requiere confirmación manual`,
      );
    }

    if (entry.runtime === "script" && confirmation.reinforced !== true) {
      throw new ModuleError(
        "UNSUPPORTED",
        `Los módulos script exigen confirmación reforzada (mantener pulsado): «${entry.name}»`,
      );
    }

    if ((await this.modules.get(entry.id)) !== undefined) {
      throw new ModuleError(
        "UNSUPPORTED",
        `El módulo «${entry.name}» ya está instalado; usa la actualización`,
      );
    }

    return this.installer.install({
      repoUrl: repoId,
      package: entry.package,
      sha256: entry.sha256,
      size: entry.size,
    });
  }

  private async requireModule(repoId: string, moduleId: string): Promise<RepoModuleSummary> {
    const entry = (await this.repos.listModules(repoId)).find((module) => module.id === moduleId);
    if (entry === undefined) {
      throw new ModuleError("NOT_FOUND", `El módulo ${moduleId} no está en el repo ${repoId}`);
    }
    return entry;
  }
}
