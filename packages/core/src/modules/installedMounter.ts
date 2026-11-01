import { ModuleError } from "../contract/errors.js";
import type { ModuleManifest } from "../contract/types.js";
import { createModuleApi, type ModuleApiHandle } from "../runtimes/ModuleRuntime.js";
import { ModuleHost } from "../host/ModuleHost.js";
import { fromHex, utf8Decode } from "../bytes.js";
import { ModuleRegistry } from "./ModuleRegistry.js";
import { SqliteStorage } from "../storage/SqliteStorage.js";
import type { Http } from "../ports/http.js";
import type { ScriptLoader } from "../ports/scriptLoader.js";
import type { SqlDriver } from "../storage/SqlDriver.js";

/**
 * Montador de módulos instalados, compartido por móvil y web (F25, P-114):
 * lee el paquete del registro (`ModuleRegistry`), crea el `ModuleHost` con los
 * permisos del manifest y monta la `ModuleApi` con el runtime que pide
 * (`declarativo` o `script`). Al runtime script se le pasa el **paquete
 * completo** (R1, ADR-0003 D1-A); sin `loader`, un módulo script es
 * `UNSUPPORTED` (caso del dispositivo hasta T40).
 *
 * Descubrir, la ficha y el lector hablan con este montador.
 */
export interface MountedModule {
  handle: ModuleApiHandle;
  manifest: ModuleManifest;
}

export interface ModuleMounter {
  mount(moduleId: string): Promise<MountedModule>;
}

export interface InstalledMounterDeps {
  driver: SqlDriver;
  /** La `Http` de la plataforma; inyectable para probar sin red. */
  http: Http;
  /** Carga de módulos script (SPEC §6.5); obligatoria para montarlos. */
  loader?: ScriptLoader;
}

export function createInstalledMounter(deps: InstalledMounterDeps): ModuleMounter {
  const { driver, http, loader } = deps;
  const registry = new ModuleRegistry({ storage: new SqliteStorage(driver) });
  const mounted = new Map<string, Promise<MountedModule>>();

  async function requireUsablePackage(moduleId: string) {
    const pkg = await registry.get(moduleId);
    if (pkg === undefined || !pkg.enabled) {
      throw new ModuleError("NOT_FOUND", `El módulo ${moduleId} no está instalado ni activo`);
    }
    if (pkg.runtime === "script" && loader === undefined) {
      throw new ModuleError(
        "UNSUPPORTED",
        `Esta app aún no carga módulos script (${moduleId})`,
      );
    }
    return pkg;
  }

  return {
    mount(moduleId) {
      let module = mounted.get(moduleId);
      if (module === undefined) {
        module = requireUsablePackage(moduleId).then(async (pkg) => {
          const entry = pkg.files.find((file) => file.path === pkg.manifest.entry);
          if (entry === undefined) {
            throw new ModuleError(
              "NOT_FOUND",
              `El paquete de ${moduleId} no trae su archivo de entrada (${pkg.manifest.entry})`,
            );
          }
          const host = new ModuleHost({
            http,
            clock: { now: () => Date.now() },
            permissions: pkg.manifest.permissions,
          });
          const handle = await createModuleApi({
            manifest: pkg.manifest,
            entry: utf8Decode(fromHex(entry.hex)),
            files: Object.fromEntries(
              pkg.files.map((file) => [file.path, utf8Decode(fromHex(file.hex))]),
            ),
            host,
            ...(loader === undefined ? {} : { loader }),
          });
          return { handle, manifest: pkg.manifest };
        });
        // Un fallo al montar no se cachea: la próxima petición lo reintenta.
        module.catch(() => mounted.delete(moduleId));
        mounted.set(moduleId, module);
      }
      return module;
    },
  };
}
