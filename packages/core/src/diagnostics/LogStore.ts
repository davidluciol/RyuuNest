/**
 * Registro de diagnóstico local (P-72, T36).
 *
 * Tabla `log` en SQLite: `at`, `level`, `code`, `message`, `context`,
 * `app_version`, `platform`. Tope de 500 entradas (borra las más viejas).
 * Todo mensaje y contexto pasa por `sanitize` antes de escribirse: sin
 * credenciales, cookies, cabeceras, HTML, URLs completas ni rutas locales.
 * El export sale en JSON y en texto legible; no hay red ni telemetría.
 */
import { ModuleError } from "../contract/errors.js";
import type { Clock } from "../ports/clock.js";
import { withTransaction, type SqlDriver } from "../storage/SqlDriver.js";
import { sanitizeContext, sanitizeText } from "./sanitize.js";

/** Entradas máximas que conserva la tabla; al pasar, borra las más viejas. */
export const LOG_MAX_ENTRIES = 500;

/** Niveles del registro. Cualquier otro nivel pedido se registra como `error`. */
export type LogLevel = "info" | "warn" | "error";

/** Una entrada del registro, ya saneada. */
export interface LogEntry {
  /** Id de fila (autoincremental). */
  id: number;
  /** Marca de tiempo en milisegundos. */
  at: number;
  level: LogLevel;
  /** Código corto del evento, en minúsculas con puntos (`install.failed`). */
  code: string;
  message: string;
  /** Contexto estructurado y saneado (opcional). */
  context?: Record<string, unknown>;
  appVersion: string;
  platform: string;
}

export interface LogStoreOptions {
  driver: SqlDriver;
  clock: Clock;
  appVersion?: string;
  platform?: string;
}

export interface ListOptions {
  /** Máximo de entradas; por defecto, todas (hasta el tope). */
  limit?: number;
}

export type LogExportFormat = "json" | "text";

/** Dependencias de `createLogStore`. */
export interface LogStore {
  /** Registra una entrada saneada; devuelve la fila creada. */
  record(level: LogLevel, code: string, message: string, context?: unknown): Promise<LogEntry>;
  /** Lista las entradas, la más reciente primero. */
  list(options?: ListOptions): Promise<LogEntry[]>;
  /** Borra todo el registro. */
  clear(): Promise<void>;
  /** Exporta el registro en JSON o en texto legible. */
  export(format: LogExportFormat): Promise<string>;
}

interface LogRow {
  id: number;
  at: number;
  level: string;
  code: string;
  message: string;
  context: string | null;
  app_version: string;
  platform: string;
}

function normalizeLevel(level: string): LogLevel {
  return level === "info" || level === "warn" ? level : "error";
}

function toEntry(row: LogRow): LogEntry {
  const entry: LogEntry = {
    id: row.id,
    at: row.at,
    level: normalizeLevel(row.level),
    code: row.code,
    message: row.message,
    appVersion: row.app_version,
    platform: row.platform,
  };
  if (row.context !== null) {
    entry.context = JSON.parse(row.context) as Record<string, unknown>;
  }
  return entry;
}

/** `YYYY-MM-DDTHH:mm:ss.sssZ` en UTC, sin dependencias de plataforma. */
function isoDate(at: number): string {
  return new Date(at).toISOString();
}

/** Crea el registro de diagnóstico sobre el driver dado. */
export function createLogStore(options: LogStoreOptions): LogStore {
  const { driver, clock } = options;
  const appVersion = options.appVersion ?? "0.0.0";
  const platform = options.platform ?? "unknown";

  async function trim(): Promise<void> {
    await driver.run(
      `DELETE FROM log WHERE id NOT IN (
         SELECT id FROM log ORDER BY at DESC, id DESC LIMIT ?
       )`,
      [LOG_MAX_ENTRIES],
    );
  }

  return {
    async record(level, code, message, context) {
      const normalizedCode = sanitizeText(code).toLowerCase();
      const cleanMessage = sanitizeText(message);
      if (normalizedCode === "" || cleanMessage === "") {
        throw new ModuleError("INTERNAL", "El registro necesita un código y un mensaje no vacíos");
      }
      const cleanContext = sanitizeContext(context);
      const at = clock.now();

      const { lastInsertRowid } = await driver.run(
        `INSERT INTO log (at, level, code, message, context, app_version, platform)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          at,
          normalizeLevel(level),
          normalizedCode,
          cleanMessage,
          cleanContext === undefined ? null : JSON.stringify(cleanContext),
          appVersion,
          platform,
        ],
      );
      await trim();

      return {
        id: lastInsertRowid,
        at,
        level: normalizeLevel(level),
        code: normalizedCode,
        message: cleanMessage,
        ...(cleanContext === undefined ? {} : { context: cleanContext }),
        appVersion,
        platform,
      };
    },

    async list(listOptions) {
      const rows = await driver.all<LogRow>(
        "SELECT id, at, level, code, message, context, app_version, platform FROM log ORDER BY at DESC, id DESC LIMIT ?",
        [listOptions?.limit ?? LOG_MAX_ENTRIES],
      );
      return rows.map(toEntry);
    },

    async clear() {
      await withTransaction(driver, () => driver.run("DELETE FROM log"));
    },

    async export(format) {
      const entries = await this.list();
      if (format === "json") {
        return JSON.stringify(
          { format: "ryuunest-log", version: 1, entries },
          null,
          2,
        );
      }
      return entries
        .map((entry) => {
          const context =
            entry.context === undefined ? "" : ` ${JSON.stringify(entry.context)}`;
          return `${isoDate(entry.at)} [${entry.level}] ${entry.code}: ${entry.message}${context}`;
        })
        .join("\n");
    },
  };
}
