import type { SqlDriver, SqlRow, SqlRunResult, SqlValue } from "@ryuunest/core";

/**
 * F18 — `SqlDriver` en memoria para la web, donde no hay SQLite (P-79). Atiende solo las
 * sentencias que la ficha y el lector necesitan (progreso, capítulos leídos y preferencias de
 * serie, T24–T26) y **rechaza cualquier otra** en vez de devolver vacío: si el núcleo cambia una
 * sentencia, el fallo se ve en las pruebas y no como datos que «desaparecen».
 *
 * Dura lo que dure la sesión del navegador; en el dispositivo se usa `ryuunest.db` (expo-sqlite).
 */

const NO_CHANGES: SqlRunResult = { changes: 0, lastInsertRowid: 0 };
const ONE_CHANGE: SqlRunResult = { changes: 1, lastInsertRowid: 0 };

function unknownStatement(sql: string): Error {
  return new Error(`El driver de sesión no conoce esta sentencia: ${sql.trim().slice(0, 80)}`);
}

function key(...parts: readonly SqlValue[]): string {
  return parts.map(String).join("\u0000");
}

export function createSessionSqlDriver(): SqlDriver {
  const progress = new Map<string, SqlRow>();
  const chaptersRead = new Map<string, { chapter_id: string; scope: string }>();
  const prefs = new Map<string, SqlRow>();

  function upsertPref(params: readonly SqlValue[], column: "reader_mode" | "preferred_group") {
    const [moduleId, seriesId, value, updatedAt] = params as [string, string, string | null, number];
    const id = key(moduleId, seriesId);
    const current = prefs.get(id) ?? {
      module_id: moduleId,
      series_id: seriesId,
      reader_mode: null,
      preferred_group: null,
    };
    prefs.set(id, { ...current, [column]: value, updated_at: updatedAt });
  }

  return {
    async exec(sql) {
      throw unknownStatement(sql);
    },

    async run(sql, params = []) {
      if (sql.includes("INSERT INTO progress")) {
        const [moduleId, seriesId, chapterId, releaseId, chapterTitle, pageIndex, pageTotal, updatedAt] =
          params;
        progress.set(key(moduleId, seriesId), {
          module_id: moduleId,
          series_id: seriesId,
          chapter_id: chapterId,
          release_id: releaseId,
          chapter_title: chapterTitle,
          page_index: pageIndex,
          page_total: pageTotal,
          updated_at: updatedAt,
        });
        return ONE_CHANGE;
      }
      if (sql.includes("INSERT INTO chapter_read")) {
        const [moduleId, seriesId, chapterId] = params;
        chaptersRead.set(key(moduleId, seriesId, chapterId), {
          chapter_id: String(chapterId),
          scope: key(moduleId, seriesId),
        });
        return ONE_CHANGE;
      }
      if (sql.includes("DELETE FROM chapter_read")) {
        const [moduleId, seriesId, chapterId] = params;
        return chaptersRead.delete(key(moduleId, seriesId, chapterId)) ? ONE_CHANGE : NO_CHANGES;
      }
      if (sql.includes("INSERT INTO series_pref")) {
        if (sql.includes("(module_id, series_id, reader_mode")) {
          upsertPref(params, "reader_mode");
          return ONE_CHANGE;
        }
        if (sql.includes("(module_id, series_id, preferred_group")) {
          upsertPref(params, "preferred_group");
          return ONE_CHANGE;
        }
      }
      throw unknownStatement(sql);
    },

    async all<T = SqlRow>(sql: string, params: readonly SqlValue[] = []): Promise<T[]> {
      if (sql.includes("FROM chapter_read WHERE module_id = ? AND series_id = ?") && !sql.includes("chapter_id = ?")) {
        const scope = key(params[0] as string, params[1] as string);
        return [...chaptersRead.values()]
          .filter((row) => row.scope === scope)
          .map((row) => ({ chapter_id: row.chapter_id })) as T[];
      }
      throw unknownStatement(sql);
    },

    async get<T = SqlRow>(sql: string, params: readonly SqlValue[] = []): Promise<T | undefined> {
      if (sql.includes("FROM progress WHERE module_id = ? AND series_id = ?")) {
        return progress.get(key(params[0] as string, params[1] as string)) as T | undefined;
      }
      if (sql.includes("FROM series_pref WHERE module_id = ? AND series_id = ?")) {
        return prefs.get(key(params[0] as string, params[1] as string)) as T | undefined;
      }
      if (sql.includes("FROM chapter_read WHERE module_id = ? AND series_id = ? AND chapter_id = ?")) {
        const row = chaptersRead.get(key(params[0] as string, params[1] as string, params[2] as string));
        return row === undefined ? undefined : ({ chapter_id: row.chapter_id } as T);
      }
      throw unknownStatement(sql);
    },
  };
}
