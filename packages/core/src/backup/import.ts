/**
 * Importación del respaldo JSON (SPEC §8.3, RF-38) — T29.
 *
 * Valida el texto (tamaño, JSON y esquema) **antes** de tocar nada y después aplica el respaldo
 * a las tablas de usuario en **una sola transacción**: o entra todo o no entra nada. Dos modos:
 *
 * - `merge`: fusiona por `updated_at` (gana el más reciente; si empatan, se conserva lo
 *   local). Las carpetas se emparejan **por nombre** sin distinguir mayúsculas, porque sus
 *   `id` son locales a cada dispositivo. `read` se une (se conserva el `readAt` más reciente)
 *   y en `settings` **gana lo local**: solo se añaden las claves que faltan. No borra nada.
 * - `replace`: vacía las tablas de usuario y restaura exactamente el respaldo.
 *
 * Los repos y módulos del respaldo **no se instalan ni se registran**: se devuelven como
 * sugerencias para que el usuario las confirme una por una (RF-38, AC-8).
 */
import type { SqlDriver } from "../storage/SqlDriver.js";
import type { ValidationIssue } from "../validation.js";
import type { BackupModule, BackupRepo } from "./schema.js";

/** Cómo se aplica el respaldo. */
export type ImportMode = "merge" | "replace";

/** Secciones de usuario que modifica la importación. */
export type ImportSection =
  | "folders"
  | "series"
  | "favorites"
  | "progress"
  | "read"
  | "prefs"
  | "settings";

/**
 * Qué pasó con las filas de una sección. En `replace` todas cuentan como `added`; en `merge`,
 * `kept` son las filas del respaldo que no ganaron (iguales, más viejas o empatadas).
 */
export interface SectionCounts {
  added: number;
  updated: number;
  kept: number;
}

/** Resumen de una importación aplicada. */
export interface ImportSummary {
  mode: ImportMode;
  counts: Record<ImportSection, SectionCounts>;
}

/** Repos y módulos del respaldo, solo para sugerirlos (RF-38). Nada de esto se instala. */
export interface ImportSuggestions {
  repos: BackupRepo[];
  modules: BackupModule[];
}

/** Por qué se rechazó un respaldo. */
export type ImportRejection = "TOO_LARGE" | "NOT_JSON" | "INVALID";

/** Resultado de importar: aplicado, o rechazado **sin haber tocado ningún dato**. */
export type ImportResult =
  | { ok: true; summary: ImportSummary; suggestions: ImportSuggestions }
  | { ok: false; reason: ImportRejection; message: string; issues: ValidationIssue[] };

/** Opciones de la importación. */
export interface ImportBackupOptions {
  driver: SqlDriver;
  mode: ImportMode;
}

/**
 * Importa el texto de un respaldo. Un respaldo rechazado devuelve `{ ok: false }`; un fallo
 * al escribir (del driver) se propaga tras revertir la transacción.
 */
export async function importBackup(
  _options: ImportBackupOptions,
  _text: string,
): Promise<ImportResult> {
  throw new Error("T29b: importBackup sin implementar");
}
