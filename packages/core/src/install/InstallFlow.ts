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
import {
  confirmationReasons,
  type ModuleRegistry,
  type UpdateResult,
} from "../modules/ModuleRegistry.js";
import type { RepoModuleSummary, RepoRegistry } from "../repo/RepoRegistry.js";
import type { InstalledPackage, PackageInstaller } from "./PackageInstaller.js";

/** Confirmación manual del usuario (SPEC §7.1, pasos 2 y 3). */
export interface InstallConfirmation {
  /** El usuario confirmó en la pantalla de confirmación. */
  confirmed: boolean;
  /** Confirmación reforzada (mantener pulsado); obligatoria en módulos `script`. */
  reinforced?: boolean;
}

/** Confirmación de una actualización (RF-6); mismas reglas que `InstallConfirmation`. */
export type UpdateConfirmation = Partial<InstallConfirmation>;

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

/** Datos para confirmar una actualización (RF-6), calculados sin descargar el paquete. */
export interface UpdatePreview {
  moduleId: string;
  currentVersion: string;
  /** Hay una versión distinta en el índice del repo de origen. */
  available: boolean;
  nextVersion?: string;
  /** Motivos que obligan a confirmar (permisos ampliados, paso a script). */
  reasons: string[];
  needsConfirmation: boolean;
  /** Pasa de declarativo a script: la confirmación debe ser reforzada. */
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

  /**
   * Compara lo instalado con el índice del repo de origen (RF-6). No descarga ni
   * escribe nada: sirve para pintar la pantalla de confirmación.
   */
  async previewUpdate(moduleId: string): Promise<UpdatePreview> {
    const { installed, entry } = await this.requireUpdateTarget(moduleId);

    if (entry.version === installed.version) {
      return {
        moduleId,
        currentVersion: installed.version,
        available: false,
        reasons: [],
        needsConfirmation: false,
        reinforced: false,
      };
    }

    const reasons = confirmationReasons(installed, {
      ...installed,
      runtime: entry.runtime,
      permissions: entry.permissions,
    });

    return {
      moduleId,
      currentVersion: installed.version,
      available: true,
      nextVersion: entry.version,
      reasons,
      needsConfirmation: reasons.length > 0,
      reinforced: installed.runtime === "declarative" && entry.runtime === "script",
    };
  }

  /**
   * Aplica la actualización (RF-6). Si exige confirmar y no se confirmó, devuelve
   * `needs-confirmation` **sin descargar**; pasar a script exige además la
   * confirmación reforzada. Descarga y verifica con `prepare()` y solo entonces escribe.
   */
  async applyUpdate(moduleId: string, confirmation: UpdateConfirmation): Promise<UpdateResult> {
    const { installed, entry } = await this.requireUpdateTarget(moduleId);
    const preview = await this.previewUpdate(moduleId);

    if (!preview.available) {
      throw new ModuleError("UNSUPPORTED", `«${entry.name}» ya está en su última versión`);
    }
    if (preview.needsConfirmation && confirmation.confirmed !== true) {
      return { status: "needs-confirmation", reasons: preview.reasons };
    }
    if (preview.reinforced && confirmation.reinforced !== true) {
      throw new ModuleError(
        "UNSUPPORTED",
        `Pasar «${entry.name}» a script exige confirmación reforzada (mantener pulsado)`,
      );
    }

    const next = await this.installer.prepare({
      repoUrl: installed.repoUrl,
      package: entry.package,
      sha256: entry.sha256,
      size: entry.size,
    });
    if (next.id !== moduleId) {
      throw new ModuleError(
        "PARSE",
        `El paquete de «${entry.name}» trae el módulo ${next.id} en lugar de ${moduleId}`,
      );
    }

    return this.modules.update(next, {
      ...(confirmation.confirmed === undefined ? {} : { confirmed: confirmation.confirmed }),
    });
  }

  private async requireUpdateTarget(
    moduleId: string,
  ): Promise<{ installed: InstalledPackage; entry: RepoModuleSummary }> {
    const installed = await this.modules.get(moduleId);
    if (installed === undefined) {
      throw new ModuleError("NOT_FOUND", `El módulo ${moduleId} no está instalado`);
    }
    const entry = (await this.repos.listModules(installed.repoUrl)).find(
      (module) => module.id === moduleId,
    );
    if (entry === undefined) {
      throw new ModuleError(
        "NOT_FOUND",
        `El repo ${installed.repoUrl} ya no ofrece el módulo ${moduleId}`,
      );
    }
    return { installed, entry };
  }

  private async requireModule(repoId: string, moduleId: string): Promise<RepoModuleSummary> {
    const entry = (await this.repos.listModules(repoId)).find((module) => module.id === moduleId);
    if (entry === undefined) {
      throw new ModuleError("NOT_FOUND", `El módulo ${moduleId} no está en el repo ${repoId}`);
    }
    return entry;
  }
}
