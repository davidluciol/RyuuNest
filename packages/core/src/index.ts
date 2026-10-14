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
export * from "./contract/types.js";

// TODO(T07): puertos Storage, Http, Archive, Clock, SecureLock.
