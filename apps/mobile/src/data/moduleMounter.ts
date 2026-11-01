/**
 * Re-export del montador compartido en el núcleo (P-114): ver
 * `@ryuunest/core` → `createInstalledMounter` / `ModuleMounter` /
 * `MountedModule`. En el dispositivo se monta **sin** `loader`: los módulos
 * `script` quedan `UNSUPPORTED` hasta T40 (D-5, P-83).
 */
export {
  createInstalledMounter,
  type InstalledMounterDeps,
  type ModuleMounter,
  type MountedModule,
} from "@ryuunest/core";
