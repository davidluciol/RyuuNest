/**
 * Capítulos leídos (SPEC §8.1 `chapter_read`) — T26 · RF-32.
 *
 * Se marca y se desmarca por `(module_id, series_id, chapter_id)`: a mano desde la fila de
 * capítulo, o **solo** al terminar el capítulo (lo avisa `ProgressStore` cuando guarda la
 * última página, si se le inyecta este almacén).
 *
 * La consulta devuelve **el conjunto de leídos**, sin contadores ni totales: el contador de
 * no leídos es v2 (`RF-42`, `DESIGN_RULES.md` §4) y necesitaría conocer el total de
 * capítulos y refrescarlo en segundo plano.
 */
import type { Clock } from "../ports/clock.js";
import type { SqlDriver } from "../storage/SqlDriver.js";

/** Un capítulo, dentro de una serie de un módulo. */
export interface ChapterRef {
  moduleId: string;
  seriesId: string;
  chapterId: string;
}

interface ChapterReadRow {
  chapter_id: string;
}

export class ChapterReadStore {
  readonly #driver: SqlDriver;
  readonly #clock: Clock;

  constructor(options: { driver: SqlDriver; clock: Clock }) {
    this.#driver = options.driver;
    this.#clock = options.clock;
  }

  /** Marca el capítulo como leído (o refresca su `read_at` si ya lo estaba). */
  async markRead(chapter: ChapterRef): Promise<void> {
    await this.#driver.run(
      `INSERT INTO chapter_read (module_id, series_id, chapter_id, read_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT (module_id, series_id, chapter_id) DO UPDATE SET read_at = excluded.read_at`,
      [chapter.moduleId, chapter.seriesId, chapter.chapterId, this.#clock.now()],
    );
  }

  /** Desmarca el capítulo (leer de nuevo). No falla si no estaba marcado. */
  async unmarkRead(chapter: ChapterRef): Promise<void> {
    await this.#driver.run(
      "DELETE FROM chapter_read WHERE module_id = ? AND series_id = ? AND chapter_id = ?",
      [chapter.moduleId, chapter.seriesId, chapter.chapterId],
    );
  }

  /** ¿Está leído ese capítulo? */
  async isRead(moduleId: string, seriesId: string, chapterId: string): Promise<boolean> {
    const fila = await this.#driver.get<ChapterReadRow>(
      "SELECT chapter_id FROM chapter_read WHERE module_id = ? AND series_id = ? AND chapter_id = ?",
      [moduleId, seriesId, chapterId],
    );
    return fila !== undefined;
  }

  /** Los capítulos leídos de una serie: el conjunto completo, sin contar nada. */
  async readIn(moduleId: string, seriesId: string): Promise<Set<string>> {
    const filas = await this.#driver.all<ChapterReadRow>(
      "SELECT chapter_id FROM chapter_read WHERE module_id = ? AND series_id = ?",
      [moduleId, seriesId],
    );
    return new Set(filas.map((fila) => fila.chapter_id));
  }
}
