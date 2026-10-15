/**
 * Registro de módulos instalados y su ciclo de vida (SPEC §3.1, RF-5 y RF-6).
 *
 * Lee y escribe la fila `module:<id>` que dejó el instalador (T13, SPEC §8.1): activar,
 * desactivar, guardar el último error, desinstalar y actualizar. Una actualización que
 * **amplía permisos** o **cambia de declarativo a script** exige confirmación otra vez.
 */
import { ModuleError } from "../contract/errors.js";
import { moduleKey, type InstalledPackage } from "../install/PackageInstaller.js";
import type { Storage } from "../ports/storage.js";

/** Opciones del registro. */
export interface ModuleRegistryOptions {
  storage: Storage;
}

/** Opciones de la actualización. */
export interface UpdateOptions {
  /** Confirmación explícita del usuario para un cambio que la exige. */
  confirmed?: boolean;
}

/** Resultado de una actualización (RF-6). */
export type UpdateResult =
  | { status: "updated"; module: InstalledPackage }
  | { status: "needs-confirmation"; reasons: string[] };

const MODULE_PREFIX = "module:";

/** Motivos por los que una actualización exige volver a confirmar (RF-6). */
export function confirmationReasons(current: InstalledPackage, next: InstalledPackage): string[] {
  const reasons: string[] = [];

  const currentDomains = new Set(current.permissions.domains);
  const added = next.permissions.domains.filter((domain) => !currentDomains.has(domain));
  if (added.length > 0) {
    reasons.push(`Amplía permisos a: ${added.join(", ")}`);
  }

  if (current.runtime === "declarative" && next.runtime === "script") {
    reasons.push("Cambia de declarativo a script (ejecuta código)");
  }

  return reasons;
}

export class ModuleRegistry {
  private readonly storage: Storage;

  constructor(options: ModuleRegistryOptions) {
    this.storage = options.storage;
  }

  /** Todos los módulos instalados, ordenados por id. */
  async list(): Promise<InstalledPackage[]> {
    const modules: InstalledPackage[] = [];

    for (const key of await this.storage.keys(MODULE_PREFIX)) {
      const raw = await this.storage.get(key);
      if (raw !== undefined) {
        modules.push(JSON.parse(raw) as InstalledPackage);
      }
    }

    return modules.sort((a, b) => a.id.localeCompare(b.id));
  }

  async get(id: string): Promise<InstalledPackage | undefined> {
    const raw = await this.storage.get(moduleKey(id));
    return raw === undefined ? undefined : (JSON.parse(raw) as InstalledPackage);
  }

  /** Activa o desactiva un módulo sin reinstalarlo (RF-5). */
  async setEnabled(id: string, enabled: boolean): Promise<InstalledPackage> {
    const current = await this.require(id);
    const next: InstalledPackage = { ...current, enabled };
    await this.write(next);
    return next;
  }

  /** Guarda (o borra, con `undefined`) el último error del módulo (RF-5, RNF-8). */
  async setLastError(id: string, error: string | undefined): Promise<InstalledPackage> {
    const current = await this.require(id);
    const next: InstalledPackage = { ...current };
    if (error === undefined) {
      delete next.lastError;
    } else {
      next.lastError = error;
    }
    await this.write(next);
    return next;
  }

  /** Desinstala: borra el registro y, con él, sus archivos (RF-5). Idempotente. */
  async uninstall(id: string): Promise<void> {
    await this.storage.delete(moduleKey(id));
  }

  /**
   * Actualiza un módulo instalado (RF-6). Si el cambio amplía permisos o pasa de
   * declarativo a script, devuelve `needs-confirmation` y **no** aplica nada hasta que
   * se repita con `{ confirmed: true }`.
   */
  async update(next: InstalledPackage, options: UpdateOptions = {}): Promise<UpdateResult> {
    const current = await this.require(next.id);

    const reasons = confirmationReasons(current, next);
    if (reasons.length > 0 && options.confirmed !== true) {
      return { status: "needs-confirmation", reasons };
    }

    const updated: InstalledPackage = {
      ...next,
      enabled: current.enabled,
      installedAt: current.installedAt,
    };
    delete updated.lastError;

    await this.write(updated);
    return { status: "updated", module: updated };
  }

  private async require(id: string): Promise<InstalledPackage> {
    const module = await this.get(id);
    if (module === undefined) {
      throw new ModuleError("NOT_FOUND", `El módulo ${id} no está instalado`);
    }
    return module;
  }

  private async write(module: InstalledPackage): Promise<void> {
    await this.storage.set(moduleKey(module.id), JSON.stringify(module));
  }
}
