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
  permissions: { domains: string[] };
  /** Ruta del paquete `.zip` dentro del repo. */
  package: string;
  /** SHA-256 del paquete, en hexadecimal (64 caracteres). */
  sha256: string;
  /** Tamaño del paquete en bytes. */
  size: number;
}

/** Índice de un repositorio de módulos (SPEC §6.7). */
export interface RepoIndex {
  format: "ryuunest-repo";
  version: 1;
  name: string;
  /** ISO 8601. */
  updatedAt: string;
  modules: RepoModuleEntry[];
}

export const REPO_INDEX_FORMAT = "ryuunest-repo";
export const REPO_INDEX_VERSION = 1;
