/**
 * @ryuunest/core — núcleo TypeScript puro de RyuuNest.
 *
 * Contrato de módulos, runtimes, host, instalador de paquetes, repositorios,
 * biblioteca, progreso, estado del lector y respaldo. Sin dependencias de
 * plataforma (móvil, TV o web detrás de puertos).
 *
 * Orden de construcción: `tasks/plan.md` (Parte 1).
 */
export const CORE_VERSION = "0.0.0";

export * from "./bytes.js";
export * from "./contract/errors.js";
export * from "./contract/repoIndex.js";
export * from "./contract/types.js";
export * from "./host/ModuleHost.js";
export * from "./install/InstallFlow.js";
export * from "./install/PackageInstaller.js";
export * from "./library/Favorites.js";
export * from "./library/Folders.js";
export * from "./library/queries.js";
export * from "./library/SeriesPrefs.js";
export * from "./library/SeriesStore.js";
export * from "./modules/ModuleRegistry.js";
export * from "./ports/index.js";
export * from "./progress/ChapterReadStore.js";
export * from "./progress/ProgressStore.js";
export * from "./repo/RepoRegistry.js";
export * from "./runtimes/DeclarativeRuntime.js";
export * from "./runtimes/errorMapping.js";
export * from "./runtimes/ModuleRuntime.js";
export * from "./runtimes/ScriptRuntime.js";
export * from "./runtimes/transforms.js";
export * from "./storage/MemoryStorage.js";
export * from "./storage/migrations.js";
export * from "./storage/schema.js";
export * from "./storage/SqlDriver.js";
export * from "./storage/SqliteStorage.js";
export * from "./validation.js";

// Los validadores de manifest e índice de repo viven en `module-sdk` (SPEC §5.1) y
// entran inyectados en el núcleo (P-37): ver `RepoIndexValidator` (T12).
