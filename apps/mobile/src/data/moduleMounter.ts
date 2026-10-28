import {
  ModuleError,
  ModuleHost,
  ModuleRegistry,
  SqliteStorage,
  createModuleApi,
  fromHex,
  utf8Decode,
  type Http,
  type ModuleApiHandle,
  type ModuleManifest,
  type SqlDriver,
} from "@ryuunest/core";

/**
 * Monta la `ModuleApi` de un módulo por su id. Descubrir, la ficha y el lector hablan con
 * este puerto: en el dispositivo lo implementan los módulos instalados (`createInstalledMounter`)
 * y en la web los de ejemplo sobre `test-site`.
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
}

/**
 * Monta los módulos del registro real (T14) con el runtime (T20): decodifica la entrada del
 * paquete (hex → texto) y le da el `ModuleHost` con los permisos de su manifest. Los módulos
 * script quedan fuera hasta tener `ScriptLoader` de app (D-5): montarlos sin poder cargarlos
 * sería prometer lo que no funciona.
 */
export function createInstalledMounter(deps: InstalledMounterDeps): ModuleMounter {
  const { driver, http } = deps;
  const registry = new ModuleRegistry({ storage: new SqliteStorage(driver) });
  const mounted = new Map<string, Promise<MountedModule>>();

  async function requireUsablePackage(moduleId: string) {
    const pkg = await registry.get(moduleId);
    if (pkg === undefined || !pkg.enabled) {
      throw new ModuleError("NOT_FOUND", `El módulo ${moduleId} no está instalado ni activo`);
    }
    if (pkg.runtime !== "declarative") {
      throw new ModuleError(
        "UNSUPPORTED",
        `La app aún no carga módulos script en el dispositivo (${moduleId})`,
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
            host,
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
