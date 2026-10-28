import {
  ChapterReadStore,
  ProgressStore,
  ReaderState,
  SeriesPrefs,
  type Clock,
  type MediaKind,
  type ReaderChapter,
  type ReaderMode,
  type ReaderSnapshot,
  type SqlDriver,
} from "@ryuunest/core";

/**
 * F18 — controlador del lector: envuelve `ReaderState` (T27) con lo que le toca a la interfaz
 * según su documentación: guardar el progreso **con retraso corto y al salir** (RF-20), reabrir
 * en la página exacta, recordar el modo por serie (RF-18) y avisar a la pantalla de cada cambio.
 *
 * `ReaderState` solo conoce el total de páginas de un capítulo si se lo dan al construirlo, y
 * ese dato llega de `pages()` (no de `details()`); por eso `open` recibe el total ya conocido y
 * arma el estado con él.
 */

/** Retraso del guardado tras un cambio de página (RF-20: «retraso corto»). */
export const PROGRESS_SAVE_DELAY_MS = 800;

/** Capítulo a abrir, con el total de páginas que acaba de devolver el módulo. */
export interface ReaderOpenTarget {
  chapterId: string;
  releaseId?: string | null;
  /** `null` si el módulo no lo sabe: entonces no se puede marcar «terminado». */
  pageTotal: number | null;
}

export interface ReaderControllerOptions {
  driver: SqlDriver;
  clock: Clock;
  moduleId: string;
  seriesId: string;
  /** Tipo de obra, para el modo por defecto (RF-18). */
  kind: MediaKind | null;
  /** Modo cuando ni la preferencia ni el tipo deciden (ajuste global, F20); no se guarda. */
  defaultMode?: ReaderMode;
  /** Capítulos de la serie **en orden de lectura** (del primero al último). */
  chapters: readonly ReaderChapter[];
  /** Un guardado diferido que falla no lanza: se avisa aquí y el progreso sigue pendiente. */
  onSaveError?: (error: unknown) => void;
}

type Listener = (snapshot: ReaderSnapshot) => void;

export class ReaderController {
  readonly #options: ReaderControllerOptions;
  readonly #progress: ProgressStore;
  readonly #prefs: SeriesPrefs;
  readonly #listeners = new Set<Listener>();

  #state: ReaderState;
  #timer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: ReaderControllerOptions) {
    this.#options = options;
    const { driver, clock } = options;
    this.#progress = new ProgressStore({
      driver,
      clock,
      chapterRead: new ChapterReadStore({ driver, clock }),
    });
    this.#prefs = new SeriesPrefs({ driver, clock });
    this.#state = this.#buildState(options.chapters);
  }

  get snapshot(): ReaderSnapshot {
    return this.#state.snapshot;
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Abre el capítulo. Si es el que quedó a medias, reabre en la página guardada; si no (o si
   * ya estaba terminado), empieza en la página 0.
   */
  async open(target: ReaderOpenTarget): Promise<void> {
    await this.#flushNow();
    const { moduleId, seriesId } = this.#options;
    this.#state = this.#buildState(
      this.#options.chapters.map((chapter) =>
        chapter.chapterId === target.chapterId
          ? { ...chapter, releaseId: target.releaseId ?? chapter.releaseId ?? null, pageTotal: target.pageTotal }
          : chapter,
      ),
    );
    await this.#state.openSeries(moduleId, seriesId);

    const saved = await this.#progress.get(moduleId, seriesId);
    const unfinished =
      saved !== undefined &&
      saved.chapterId === target.chapterId &&
      (target.pageTotal === null || saved.pageIndex < target.pageTotal - 1);
    if (unfinished) {
      await this.#state.resume();
    } else {
      await this.#state.openChapter(target.chapterId);
    }
    this.#afterChange();
  }

  async next(): Promise<void> {
    await this.#state.next();
    this.#afterChange();
  }

  async previous(): Promise<void> {
    await this.#state.previous();
    this.#afterChange();
  }

  async goToPage(index: number): Promise<void> {
    await this.#state.goToPage(index);
    this.#afterChange();
  }

  async setMode(mode: ReaderMode): Promise<void> {
    await this.#state.setMode(mode);
    this.#notify();
  }

  /** Al salir del lector: guarda lo pendiente y deja de tener temporizador. */
  async close(): Promise<void> {
    await this.#flushNow();
    this.#notify();
  }

  #buildState(chapters: readonly ReaderChapter[]): ReaderState {
    return new ReaderState({
      progress: this.#progress,
      prefs: this.#prefs,
      chapters,
      kind: this.#options.kind,
      defaultMode: this.#options.defaultMode ?? null,
    });
  }

  #afterChange(): void {
    this.#clearTimer();
    if (this.#state.snapshot.dirty) {
      this.#timer = setTimeout(() => {
        this.#timer = null;
        this.#state.flush().catch((error: unknown) => this.#options.onSaveError?.(error));
      }, PROGRESS_SAVE_DELAY_MS);
    }
    this.#notify();
  }

  async #flushNow(): Promise<void> {
    this.#clearTimer();
    await this.#state.flush();
  }

  #clearTimer(): void {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }

  #notify(): void {
    const snapshot = this.#state.snapshot;
    for (const listener of this.#listeners) listener(snapshot);
  }
}
