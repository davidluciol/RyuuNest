/**
 * @ryuunest/module-sdk — SDK público para autores de módulos.
 *
 * Tipos públicos, validador de manifest e índice de repo, CLI y plantilla.
 * Prevé el sitio falso reutilizable (`@ryuunest/test-site`) para las pruebas.
 *
 * Tareas: T09, T10, T11 (`tasks/todo.md`).
 */
export const MODULE_SDK_VERSION = "0.0.0";

export {
  MEDIA_KINDS,
  MODULE_CAPABILITIES,
  MODULE_RUNTIMES,
  validateManifest,
  validateModuleFields,
} from "./manifest.js";
export type { ValidateOptions } from "./manifest.js";
export { REPO_INDEX_FORMAT, REPO_INDEX_VERSION, validateRepoIndex } from "./repoIndex.js";
export type { RepoIndex, RepoModuleEntry } from "./repoIndex.js";
export { compareSemver, isSemver } from "./semver.js";
export { childPath, indexedPath, isRecord, IssueCollector } from "./validation.js";
export type { ValidationIssue, ValidationResult } from "./validation.js";
