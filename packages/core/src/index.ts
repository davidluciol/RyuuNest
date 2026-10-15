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

export * from "./contract/errors.js";
export * from "./contract/repoIndex.js";
export * from "./contract/types.js";
export * from "./host/ModuleHost.js";
export * from "./ports/index.js";
export * from "./repo/RepoRegistry.js";
export * from "./validation.js";

// Los validadores de manifest e índice de repo viven en `module-sdk` (SPEC §5.1) y
// entran inyectados en el núcleo (P-37): ver `RepoIndexValidator` (T12).
