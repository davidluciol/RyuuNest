/**
 * Índice de un repositorio de módulos (SPEC §6.7).
 *
 * Es parte del contrato, así que su **forma** vive en el núcleo (P-37); el validador
 * vive en `module-sdk` (SPEC §5.1), que reexporta estos tipos.
 */
import type { MediaKind } from "./types.js";

/** Entrada de un módulo dentro del índice (SPEC §6.7). */
export interface RepoModuleEntry {
  id: string;
  name: string;
  version: string;
  apiVersion: 1;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  lang: string;
  nsfw: boolean;
  /** El sitio a veces pide resolver un reto anti-bot (#183). */
  antiBot?: boolean;
  permissions: { domains: string[] };
  /** Ruta del paquete `.zip` dentro del repo. */
  package: string;
  /** SHA-256 del paquete, en hexadecimal (64 caracteres). */
  sha256: string;
  /** Tamaño del paquete en bytes. */
  size: number;
  /** Versión mínima de la app (aditivo, T38): permite ocultar lo incompatible antes de descargar. */
  minAppVersion?: string;
}

/** Entrada que esta app no puede usar (T38, R3): se lista aparte, no invalida el repo. */
export interface IncompatibleModuleEntry {
  id: string;
  name?: string;
  /** Motivo legible: `apiVersion`, `runtime`, `kinds` o `minAppVersion`. */
  reason: string;
}

/** Índice de un repositorio de módulos (SPEC §6.7). */
export interface RepoIndex {
  format: "ryuunest-repo";
  version: 1;
  name: string;
  /** ISO 8601. */
  updatedAt: string;
  /** Solo las entradas compatibles con esta app. */
  modules: RepoModuleEntry[];
  /** Entradas que esta app no entiende (T38). Ausente en índices guardados antes de T38. */
  incompatible?: IncompatibleModuleEntry[];
  /** Entradas rotas descartadas, con ruta y motivo (T38). */
  warnings?: string[];
}

export const REPO_INDEX_FORMAT = "ryuunest-repo";
export const REPO_INDEX_VERSION = 1;
