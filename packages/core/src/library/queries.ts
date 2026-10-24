/**
 * Consultas de la biblioteca (SPEC §3.5, §8.2, RF-26 a RF-29, RF-35 y RF-42) — T23.
 *
 * La biblioteca es la lista de favoritos enriquecida con su serie y su progreso. Se puede
 * buscar por nombre (sobre `title_norm`, sin acentos ni mayúsculas), filtrar por tipo,
 * fuente, carpeta, NSFW y «Leyendo» (P-70), y ordenar por nombre, último leído o fecha de
 * adición. Todos los filtros se combinan.
 *
 * Dos decisiones del SPEC guían el diseño:
 * - **RF-35**: el NSFW se oculta por defecto; solo se incluye si quien llama lo pide.
 * - **RF-42**: aquí no se calculan contadores de no leídos ni totales de capítulos (v2).
 *   La consulta ni toca `chapter_read`.
 *
 * La paginación es por **cursor opaco** (clave en el propio orden, no un desplazamiento:
 * SPEC §8.2), así que insertar o borrar entre páginas no repite ni salta entradas.
 */
import { ModuleError } from "../contract/errors.js";
import type { MediaKind, SeriesStatus } from "../contract/types.js";
import { normalizeTitle } from "./SeriesStore.js";
import { escapeLike, fromSqlBoolean, type SqlDriver, type SqlValue } from "../storage/SqlDriver.js";

/** Órdenes disponibles (RF-28). */
export type LibraryOrder = "name" | "lastRead" | "addedAt";

/** Filtro y orden de una página de biblioteca. */
export interface LibraryFilter {
  /** Búsqueda por nombre; se normaliza igual que `title_norm`. */
  search?: string | undefined;
  /** Tipos admitidos (D-13). Vacío o ausente = todos. */
  kinds?: readonly MediaKind[] | undefined;
  /** Fuentes (módulos) admitidas. Vacía o ausente = todas. */
  moduleIds?: readonly string[] | undefined;
  /** `number` = esa carpeta; `null` = sin carpeta; ausente = da igual. */
  folderId?: number | null | undefined;
  /**
   * «Leyendo» (P-70): `true` = solo series con fila en `progress` (se abrieron o se
   * leyeron); `false` = solo las que no se han empezado; ausente = da igual.
   */
  reading?: boolean | undefined;
  /** Con `true` se ven también las series NSFW (RF-35: por defecto no). */
  nsfwVisible?: boolean | undefined;
  order?: LibraryOrder | undefined;
  /** Cursor opaco de la página anterior. */
  cursor?: string | undefined;
  /** Entradas por página. Lo decide la pantalla; el núcleo no pone número por defecto. */
  limit: number;
}

/** Progreso en curso de una entrada (llega T25; aquí solo se lee). */
export interface LibraryProgress {
  chapterId: string;
  chapterTitle: string | null;
  pageIndex: number;
  pageTotal: number | null;
  updatedAt: number;
}

/** Fila de biblioteca: favorito + serie + progreso. Sin contadores (RF-42). */
export interface LibraryEntry {
  moduleId: string;
  seriesId: string;
  title: string;
  coverUrl: string | null;
  kind: MediaKind | null;
  nsfw: boolean;
  status: SeriesStatus | null;
  folderId: number | null;
  addedAt: number;
  progress: LibraryProgress | null;
}

/** Página de biblioteca con el cursor para continuar. */
export interface LibraryPage {
  items: LibraryEntry[];
  /** `null` cuando ya no hay más páginas. */
  nextCursor: string | null;
}

/** Consulta ya construida, para poder inspeccionarla (`EXPLAIN QUERY PLAN`). */
export interface BuiltQuery {
  sql: string;
  params: readonly SqlValue[];
}

/**
 * Cada orden define tres expresiones que se comparan de golpe (el SPEC de SQLite permite
 * valores de fila). La tercera, `(module_id, series_id)` de la clave primaria, hace que el
 * orden sea decisivo: sin empate posible, el cursor nunca salta ni repite una fila.
 */
const ORDENES: Record<
  LibraryOrder,
  { readonly exprs: readonly string[]; readonly dir: "ASC" | "DESC" }
> = {
  name: { exprs: ["s.title_norm", "f.module_id", "f.series_id"], dir: "ASC" },
  lastRead: { exprs: ["last_read", "f.module_id", "f.series_id"], dir: "DESC" },
  addedAt: { exprs: ["f.added_at", "f.module_id", "f.series_id"], dir: "DESC" },
};

/** Columnas del SELECT: las de dominio, más las que necesita el cursor. */
const SELECCION = `
SELECT s.module_id, s.series_id, s.title, s.title_norm, s.cover_url, s.kind, s.nsfw, s.status,
       f.folder_id, f.added_at,
       COALESCE(p.updated_at, f.added_at) AS last_read,
       p.chapter_id, p.chapter_title, p.page_index, p.page_total, p.updated_at AS progress_updated_at
FROM favorite AS f
JOIN series AS s ON s.module_id = f.module_id AND s.series_id = f.series_id
LEFT JOIN progress AS p ON p.module_id = f.module_id AND p.series_id = f.series_id`;

/** El cursor: el orden al que pertenece y las tres claves de su última fila. */
interface Cursor {
  order: LibraryOrder;
  key: [SqlValue, SqlValue, SqlValue];
}

interface LibraryRow {
  module_id: string;
  series_id: string;
  title: string;
  title_norm: string;
  cover_url: string | null;
  kind: string | null;
  nsfw: number;
  status: string | null;
  folder_id: number | null;
  added_at: number;
  last_read: number;
  chapter_id: string | null;
  chapter_title: string | null;
  page_index: number | null;
  page_total: number | null;
  progress_updated_at: number | null;
}

/** Construye la consulta de biblioteca (SQL y parámetros) a partir del filtro. */
export function buildLibraryQuery(filtro: LibraryFilter): BuiltQuery {
  const order: LibraryOrder = filtro.order ?? "name";
  const condicion = ORDENES[order];
  const donde: string[] = [];
  const params: SqlValue[] = [];

  if (filtro.nsfwVisible !== true) {
    donde.push("s.nsfw = 0");
  }

  if (filtro.search !== undefined && filtro.search !== "") {
    const normalizado = normalizeTitle(filtro.search);
    if (normalizado !== "") {
      donde.push("s.title_norm LIKE ? ESCAPE '\\'");
      params.push(`%${escapeLike(normalizado)}%`);
    }
  }

  if (filtro.kinds !== undefined && filtro.kinds.length > 0) {
    donde.push(`s.kind IN (${filtro.kinds.map(() => "?").join(", ")})`);
    params.push(...filtro.kinds);
  }

  if (filtro.moduleIds !== undefined && filtro.moduleIds.length > 0) {
    donde.push(`f.module_id IN (${filtro.moduleIds.map(() => "?").join(", ")})`);
    params.push(...filtro.moduleIds);
  }

  if (filtro.folderId === null) {
    donde.push("f.folder_id IS NULL");
  } else if (filtro.folderId !== undefined) {
    donde.push("f.folder_id = ?");
    params.push(filtro.folderId);
  }

  // «Leyendo» (P-70): una serie cuenta si tiene fila en `progress`, aunque el capítulo
  // actual esté terminado (la v1 no distingue «serie terminada»).
  if (filtro.reading === true) {
    donde.push("p.module_id IS NOT NULL");
  } else if (filtro.reading === false) {
    donde.push("p.module_id IS NULL");
  }

  if (filtro.cursor !== undefined && filtro.cursor !== "") {
    const cursor = parseCursor(filtro.cursor, order);
    const operador = condicion.dir === "ASC" ? ">" : "<";
    donde.push(`(${condicion.exprs.join(", ")}) ${operador} (?, ?, ?)`);
    params.push(cursor.key[0], cursor.key[1], cursor.key[2]);
  }

  const sql = `${SELECCION}${donde.length > 0 ? `\nWHERE ${donde.join("\n  AND ")}` : ""}
ORDER BY ${condicion.exprs.map((e) => `${e} ${condicion.dir}`).join(", ")}
LIMIT ?`;

  return { sql, params: [...params, filtro.limit + 1] };
}

/** Devuelve una página de biblioteca (SPEC §8.2: paginación por cursor). */
export async function browseLibrary(
  driver: SqlDriver,
  filtro: LibraryFilter,
): Promise<LibraryPage> {
  const order = filtro.order ?? "name";
  const consulta = buildLibraryQuery(filtro);
  const filas = await driver.all<LibraryRow>(consulta.sql, consulta.params);

  const hayMas = filas.length > filtro.limit;
  const visibles = hayMas ? filas.slice(0, filtro.limit) : filas;
  const ultima = visibles[visibles.length - 1];

  return {
    items: visibles.map(toEntry),
    nextCursor:
      hayMas && ultima !== undefined
        ? JSON.stringify({ order, key: claveDe(ultima, order) } satisfies Cursor)
        : null,
  };
}

/** Clave de cursor de una fila: las tres expresiones del orden. */
function claveDe(fila: LibraryRow, order: LibraryOrder): [SqlValue, SqlValue, SqlValue] {
  const primera =
    order === "name" ? fila.title_norm : order === "lastRead" ? fila.last_read : fila.added_at;
  return [primera, fila.module_id, fila.series_id];
}

/** Un cursor que no pertenece a este orden o no se entiende es un error de programación. */
function parseCursor(cursor: string, order: LibraryOrder): Cursor {
  let leido: unknown;
  try {
    leido = JSON.parse(cursor);
  } catch (error) {
    throw new ModuleError(
      "PARSE",
      `El cursor de la biblioteca no se entiende: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  if (
    leido === null ||
    typeof leido !== "object" ||
    !Array.isArray((leido as Cursor).key) ||
    (leido as Cursor).key.length !== 3 ||
    (leido as Cursor).order !== order
  ) {
    throw new ModuleError("PARSE", "El cursor de la biblioteca no corresponde a este orden");
  }

  return leido as Cursor;
}

function toEntry(fila: LibraryRow): LibraryEntry {
  return {
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    title: fila.title,
    coverUrl: fila.cover_url,
    kind: fila.kind as MediaKind | null,
    nsfw: fromSqlBoolean(fila.nsfw),
    status: fila.status as SeriesStatus | null,
    folderId: fila.folder_id,
    addedAt: fila.added_at,
    progress:
      fila.chapter_id === null || fila.progress_updated_at === null
        ? null
        : {
            chapterId: fila.chapter_id,
            chapterTitle: fila.chapter_title,
            pageIndex: fila.page_index ?? 0,
            pageTotal: fila.page_total,
            updatedAt: fila.progress_updated_at,
          },
  };
}
