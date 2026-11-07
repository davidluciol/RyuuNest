/**
 * Re-export del montador compartido en el núcleo (P-114): ver
 * `@ryuunest/core` → `createInstalledMounter` / `ModuleMounter` /
 * `MountedModule`. En el dispositivo se monta con `createFunctionScriptLoader`
 * (T40: Hermes admite `new Function`), que carga los módulos `script`.
 */
export {
  createInstalledMounter,
  type InstalledMounterDeps,
  type ModuleMounter,
  type MountedModule,
} from "@ryuunest/core";
