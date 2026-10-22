/**
 * Progreso de lectura (SPEC §8.1 `progress`, §3.6) — T25 · RF-20, RF-31, RF-41.
 *
 * **Un registro por serie** (clave `module_id, series_id`): dónde se quedó el lector
 * —capítulo, versión de publicación y página— y el total de páginas del capítulo, que es lo
 * que alimenta la barra de progreso (`page_index / page_total`, RF-41).
 *
 * Una sola sentencia `INSERT … ON CONFLICT` por escritura: la fila nunca pasa por un estado
 * intermedio, así que dos guardados simultáneos de la misma serie no la dejan mezclada. El
 * retardo corto (debounce) y el guardado «al salir» son de la interfaz (RF-20).
 */
import { ModuleError } from "../contract/errors.js";
import type { Clock } from "../ports/clock.js";
import type { SqlDriver } from "../storage/SqlDriver.js";

/**
 * Quien marca un capítulo como leído al terminarlo (T26 · RF-32). Se inyecta: el progreso
 * solo avisa, no conoce la tabla `chapter_read`. Sin marcador, el núcleo sigue siendo
 * headless (el guardado no toca `chapter_read`).
 */
export interface ChapterReadMarker {
  markRead(chapter: { moduleId: string; seriesId: string; chapterId: string }): Promise<void>;
}

/** Dónde se quedó la lectura de una serie. `null` = el módulo no lo dio. */
export interface ReadingProgress {
  moduleId: string;
  seriesId: string;
  /** Capítulo en curso. */
  chapterId: string;
  /** Versión de publicación (grupo) leída; `null` si el módulo no la usa. */
  releaseId: string | null;
  /** Título del capítulo, si se conoce (lo usa Inicio para «Continuar»). */
  chapterTitle: string | null;
  /** Página actual, base 0. */
  pageIndex: number;
  /** Páginas del capítulo (RF-41); `null` si el módulo no lo sabe. */
  pageTotal: number | null;
  /** Milisegundos de la última escritura (fusión del respaldo, SPEC §8.1). */
  updatedAt: number;
}

/** Lo que la interfaz guarda al cambiar de página o al salir (RF-20). */
export interface SaveProgressInput {
  moduleId: string;
  seriesId: string;
  chapterId: string;
  releaseId?: string | null;
  chapterTitle?: string | null;
  pageIndex: number;
  pageTotal?: number | null;
}

interface ProgressRow {
  module_id: string;
  series_id: string;
  chapter_id: string;
  release_id: string | null;
  chapter_title: string | null;
  page_index: number;
  page_total: number | null;
  updated_at: number;
}

/** Página base 0, entera y no negativa. */
function validarPagina(pageIndex: number): void {
  if (!Number.isInteger(pageIndex) || pageIndex < 0) {
    throw new ModuleError("INTERNAL", `Índice de página inválido: ${String(pageIndex)}`);
  }
}

/** Total de páginas: se puede no saber, pero si se sabe es un entero positivo. */
function validarTotal(pageTotal: number | null | undefined): void {
  if (pageTotal === undefined || pageTotal === null) {
    return;
  }
  if (!Number.isInteger(pageTotal) || pageTotal < 1) {
    throw new ModuleError("INTERNAL", `Total de páginas inválido: ${String(pageTotal)}`);
  }
}

function toRecord(fila: ProgressRow): ReadingProgress {
  return {
    moduleId: fila.module_id,
    seriesId: fila.series_id,
    chapterId: fila.chapter_id,
    releaseId: fila.release_id,
    chapterTitle: fila.chapter_title,
    pageIndex: fila.page_index,
    pageTotal: fila.page_total,
    updatedAt: fila.updated_at,
  };
}

/** ¿El lector ya está en la última página del capítulo? (página base 0, RF-32). */
function capituloTerminado(pageIndex: number, pageTotal: number | null | undefined): boolean {
  return pageTotal !== undefined && pageTotal !== null && pageIndex >= pageTotal - 1;
}

export class ProgressStore {
  readonly #driver: SqlDriver;
  readonly #clock: Clock;
  readonly #chapterRead: ChapterReadMarker | undefined;

  constructor(options: { driver: SqlDriver; clock: Clock; chapterRead?: ChapterReadMarker }) {
    this.#driver = options.driver;
    this.#clock = options.clock;
    this.#chapterRead = options.chapterRead;
  }

  /** Progreso guardado de la serie, o `undefined` si no se ha leído todavía. */
  async get(moduleId: string, seriesId: string): Promise<ReadingProgress | undefined> {
    const fila = await this.#driver.get<ProgressRow>(
      "SELECT * FROM progress WHERE module_id = ? AND series_id = ?",
      [moduleId, seriesId],
    );
    return fila === undefined ? undefined : toRecord(fila);
  }

  /** Guarda dónde se quedó el lector (RF-20): una escritura, atómica. */
  async save(input: SaveProgressInput): Promise<void> {
    validarPagina(input.pageIndex);
    validarTotal(input.pageTotal);

    await this.#driver.run(
      `INSERT INTO progress
         (module_id, series_id, chapter_id, release_id, chapter_title, page_index, page_total, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (module_id, series_id) DO UPDATE SET
         chapter_id = excluded.chapter_id,
         release_id = excluded.release_id,
         chapter_title = excluded.chapter_title,
         page_index = excluded.page_index,
         page_total = excluded.page_total,
         updated_at = excluded.updated_at`,
      [
        input.moduleId,
        input.seriesId,
        input.chapterId,
        input.releaseId ?? null,
        input.chapterTitle ?? null,
        input.pageIndex,
        input.pageTotal ?? null,
        this.#clock.now(),
      ],
    );

    // Terminar el capítulo lo marca solo (RF-32). Solo si hay marcador inyectado.
    if (this.#chapterRead !== undefined && capituloTerminado(input.pageIndex, input.pageTotal)) {
      await this.#chapterRead.markRead({
        moduleId: input.moduleId,
        seriesId: input.seriesId,
        chapterId: input.chapterId,
      });
    }
  }
}
