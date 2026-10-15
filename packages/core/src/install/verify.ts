/**
 * Verificaciones del instalador (SPEC §7.1 y §7.2): hash SHA-256, rutas seguras
 * (zip-slip) y límites de tamaño y número de archivos.
 */
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

import { ModuleError } from "../contract/errors.js";
import type { ArchiveEntry } from "../ports/archive.js";

/** Límites del SPEC §7.1. */
export interface InstallLimits {
  /** Tope del paquete `.zip` descargado, en bytes. */
  packageBytes: number;
  /** Tope del contenido descomprimido, en bytes. */
  unpackedBytes: number;
  /** Tope del número de archivos. */
  files: number;
}

/** Límites por defecto: paquete ≤ 2 MB, descomprimido ≤ 5 MB, ≤ 50 archivos. */
export const INSTALL_LIMITS: InstallLimits = {
  packageBytes: 2 * 1024 * 1024,
  unpackedBytes: 5 * 1024 * 1024,
  files: 50,
};

/** SHA-256 en hexadecimal (minúsculas). */
export function sha256Hex(data: Uint8Array): string {
  return bytesToHex(sha256(data));
}

/**
 * ¿Es una ruta de entrada segura? Rechaza lo que escapa del directorio del módulo:
 * rutas absolutas, con letra de unidad, con `..` y con bytes nulos.
 */
export function isSafeEntryPath(path: string): boolean {
  if (path.length === 0 || path.includes("\0")) {
    return false;
  }

  const normalized = path.replace(/\\/g, "/");
  if (normalized.startsWith("/") || /^[a-zA-Z]:/.test(normalized)) {
    return false;
  }

  return normalized.split("/").every((segment) => segment !== "..");
}

/** Lanza `ModuleError` si la ruta escapa del directorio del módulo (zip-slip). */
export function assertSafeEntryPath(path: string): void {
  if (!isSafeEntryPath(path)) {
    throw new ModuleError(
      "UNSUPPORTED",
      `Ruta no permitida dentro del paquete (zip-slip): ${path}`,
    );
  }
}

/** Lanza `ModuleError` si el contenido descomprimido supera los límites del SPEC §7.1. */
export function assertUnpackedLimits(
  entries: readonly ArchiveEntry[],
  limits: InstallLimits,
): void {
  if (entries.length > limits.files) {
    throw new ModuleError(
      "UNSUPPORTED",
      `El paquete trae ${entries.length} archivos y el tope es ${limits.files}`,
    );
  }

  let total = 0;
  for (const entry of entries) {
    total += entry.data.length;
    if (total > limits.unpackedBytes) {
      throw new ModuleError(
        "UNSUPPORTED",
        `El contenido descomprimido supera el tope de ${limits.unpackedBytes} bytes (bomba de compresión)`,
      );
    }
  }
}
