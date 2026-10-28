/**
 * Máquina de estados del lector (headless) — T27 · SPEC §9, §3.4 y §3.6 · RF-18, RF-20,
 * RF-21, RF-32.
 *
 * Estado del lector **en el núcleo, sin UI**: modos de lectura (vertical continuo o
 * paginado), navegación anterior/siguiente, salto entre capítulos, límites de capítulo y
 * disparo del guardado de progreso (con `page_total`) y de «capítulo terminado».
 *
 * # Políticas de memoria (SPEC §9) — el render es Parte 2
 *
 * El estado no decodifica, descarga ni libera nada: **declara la ventana de páginas** que
 * el render debe mantener en memoria (`snapshot.window`). El render (F18) es quien
 * decodifica al tamaño de pantalla, precarga y libera:
 *
 * - **Paginado** (`paged-ltr` / `paged-rtl`): la página actual y una ventana pequeña hacia
 *   delante (`PAGED_PRELOAD_AHEAD`); las anteriores se liberan.
 * - **Vertical** (continuo, lista virtualizada): solo las páginas cercanas al área visible,
 *   `VERTICAL_BEHIND` por detrás y `VERTICAL_AHEAD` por delante de la página visible.
 *
 * Qué zona de toque es «siguiente» según la dirección de paginado (D→I o I→D) es decisión
 * de la interfaz; aquí solo importa el modo. Los topes se afinan con la medición de la
 * Fase 0 (P-45) en la MiBox 4.
 *
 * # Guardado del progreso (RF-20, T25)
 *
 * - Cada cambio de página deja el estado **pendiente** (`snapshot.dirty`); la interfaz
 *   guarda con **retraso corto** y «al salir» llamando a `flush()`.
 * - Llegar a la **última página** guarda de inmediato (una escritura atómica, T25): es
 *   «terminar el capítulo» (RF-32), así que marca el capítulo como leído (T26) y ofrece el
 *   siguiente (RF-21).
 *
 * # Páginas
 *
 * `page_index` es **base 0** (P-61): un capítulo de `page_total` páginas ocupa
 * `0 … page_total - 1` y el estado se mantiene dentro de `[0, page_total]`. Sin
 * `page_total` no se puede saber cuál es la última página: se avanza sin tope superior y
 * nunca se marca «terminado».
 */
import { ModuleError } from "../contract/errors.js";
import type { MediaKind } from "../contract/types.js";
import type { ReaderMode, SeriesPrefs } from "../library/SeriesPrefs.js";
import type { ProgressStore } from "../progress/ProgressStore.js";

/** Los tres modos del contrato (RF-18). */
const MODOS: readonly ReaderMode[] = ["vertical", "paged-ltr", "paged-rtl"];

/** Páginas por delante de la actual que se precargan en modo paginado (SPEC §9). */
export const PAGED_PRELOAD_AHEAD = 2;
/** Páginas por detrás de la visible que se mantienen en modo vertical (SPEC §9). */
export const VERTICAL_BEHIND = 2;
/** Páginas por delante de la visible que se mantienen en modo vertical (SPEC §9). */
export const VERTICAL_AHEAD = 4;

/**
 * Un capítulo tal como lo necesita el lector: `Chapter` del contrato más las páginas de la
 * edición elegida (`ChapterPages.images.length`).
 */
export interface ReaderChapter {
  chapterId: string;
  /** Edición (release/grupo) que se está leyendo. */
  releaseId?: string | null;
  title?: string | null;
  /** Número de páginas; `null` o ausente si el módulo no lo sabe. */
  pageTotal?: number | null;
}

/** Ventana de páginas a mantener en memoria; índices inclusivos (SPEC §9). */
export interface PageWindow {
  from: number;
  to: number;
}

/** Estado inmutable del lector en un instante. */
export interface ReaderSnapshot {
  moduleId: string | null;
  seriesId: string | null;
  /** Modo efectivo: preferencia de la serie (T24), del tipo de obra, o `null` (decide F20). */
  mode: ReaderMode | null;
  /** Capítulo abierto, o `null` si la serie está abierta pero aún no hay capítulo. */
  chapter: ReaderChapter | null;
  /** Página actual, base 0. */
  pageIndex: number;
  /** Páginas del capítulo; `null` si se desconoce. */
  pageTotal: number | null;
  /** «Capítulo terminado»: la página actual es la última (RF-21, RF-32). */
  finished: boolean;
  /** Capítulo siguiente en orden de lectura, si lo hay (tarjeta de fin, RF-21). */
  nextChapter: ReaderChapter | null;
  /** Capítulo anterior en orden de lectura, si lo hay. */
  previousChapter: ReaderChapter | null;
  /** Ventana de páginas a mantener decodificadas (SPEC §9); `null` sin capítulo o sin modo. */
  window: PageWindow | null;
  /** Hay progreso sin guardar: la UI guarda con retraso corto o al salir (RF-20). */
  dirty: boolean;
}

function pageTotalOf(chapter: ReaderChapter | null): number | null {
  if (chapter === null || chapter.pageTotal === undefined || chapter.pageTotal === null) {
    return null;
  }
  return chapter.pageTotal;
}

/** Un capítulo con `page_total` debe ser entero positivo (o no saberlo). */
function validarCapitulo(chapter: ReaderChapter): void {
  const total = chapter.pageTotal;
  if (total !== undefined && total !== null && (!Number.isInteger(total) || total < 1)) {
    throw new ModuleError("INTERNAL", `Total de páginas inválido: ${String(total)}`);
  }
}

/** Ajusta una página a los límites del capítulo: ni negativa ni mayor que `page_total`. */
function ajustarPagina(index: number, pageTotal: number | null): number {
  const ultima = pageTotal === null ? Number.MAX_SAFE_INTEGER : pageTotal - 1;
  return Math.min(Math.max(index, 0), ultima);
}

/** Ventana de páginas a mantener en memoria, según el modo (SPEC §9). */
function ventana(
  mode: ReaderMode | null,
  pageIndex: number,
  pageTotal: number | null,
): PageWindow | null {
  if (mode === null) {
    return null;
  }
  const ultima = pageTotal === null ? Number.POSITIVE_INFINITY : pageTotal - 1;
  if (mode === "vertical") {
    return {
      from: Math.max(0, pageIndex - VERTICAL_BEHIND),
      to: Math.min(ultima, pageIndex + VERTICAL_AHEAD),
    };
  }
  return { from: pageIndex, to: Math.min(ultima, pageIndex + PAGED_PRELOAD_AHEAD) };
}

export class ReaderState {
  readonly #progress: ProgressStore;
  readonly #prefs: SeriesPrefs;
  readonly #chapters: readonly ReaderChapter[];
  readonly #kind: MediaKind | null;
  readonly #defaultMode: ReaderMode | null;

  #moduleId: string | null = null;
  #seriesId: string | null = null;
  #mode: ReaderMode | null = null;
  #chapter: ReaderChapter | null = null;
  #pageIndex = 0;
  #dirty = false;

  constructor(options: {
    progress: ProgressStore;
    prefs: SeriesPrefs;
    /**
     * Capítulos de la serie **en orden de lectura** (del primero al último). La lista del
     * contrato llega «más nuevo primero» (`SeriesDetails.chapters`); la interfaz la invierte.
     */
    chapters: readonly ReaderChapter[];
    /** Tipo de obra, para el modo por defecto (RF-18); `null` si no se conoce. */
    kind?: MediaKind | null;
    /**
     * Modo cuando ni la preferencia de la serie ni el tipo de obra deciden (el ajuste global de
     * lector, F20). No se guarda como preferencia de la serie. Sin él, el modo queda `null`.
     */
    defaultMode?: ReaderMode | null;
  }) {
    this.#progress = options.progress;
    this.#prefs = options.prefs;
    this.#chapters = options.chapters;
    this.#kind = options.kind ?? null;
    this.#defaultMode = options.defaultMode ?? null;
  }

  /** Estado actual, inmutable. */
  get snapshot(): ReaderSnapshot {
    const chapter = this.#chapter;
    const pageTotal = pageTotalOf(chapter);
    const indice = this.#chapters.findIndex((c) => c.chapterId === chapter?.chapterId);
    return {
      moduleId: this.#moduleId,
      seriesId: this.#seriesId,
      mode: this.#mode,
      chapter: chapter === null ? null : { ...chapter },
      pageIndex: this.#pageIndex,
      pageTotal,
      finished: this.#enUltimaPagina(),
      nextChapter: indice === -1 ? null : (this.#chapters[indice + 1] ?? null),
      previousChapter: indice === -1 ? null : (this.#chapters[indice - 1] ?? null),
      window: chapter === null ? null : ventana(this.#mode, this.#pageIndex, pageTotal),
      dirty: this.#dirty,
    };
  }

  /**
   * Abre (o reinicia) la sesión de lectura de una serie: fija el modo efectivo —
   * preferencia guardada (T24), si no el del tipo de obra, si no `null`— y olvuda el
   * capítulo. Después se llama a `resume()` o a `openChapter()`.
   */
  async openSeries(moduleId: string, seriesId: string): Promise<ReaderSnapshot> {
    this.#moduleId = moduleId;
    this.#seriesId = seriesId;
    this.#mode = (await this.#prefs.modeFor(moduleId, seriesId, this.#kind)) ?? this.#defaultMode;
    this.#chapter = null;
    this.#pageIndex = 0;
    this.#dirty = false;
    return this.snapshot;
  }

  /**
   * Reanuda donde se quedó la serie (RF-20): capítulo y página guardados, ajustados a los
   * límites del capítulo. Devuelve `null` si no hay progreso o el capítulo ya no existe.
   */
  async resume(): Promise<ReaderSnapshot | null> {
    const { moduleId, seriesId } = this.#contexto();
    const guardado = await this.#progress.get(moduleId, seriesId);
    if (guardado === undefined) {
      return null;
    }
    const chapter = this.#chapters.find((c) => c.chapterId === guardado.chapterId);
    if (chapter === undefined) {
      return null;
    }
    const pageIndex = ajustarPagina(guardado.pageIndex, pageTotalOf(chapter));
    this.#chapter = chapter;
    this.#pageIndex = pageIndex;
    if (this.#enUltimaPagina()) {
      // Caer en la última página termina el capítulo: se guarda ya (RF-32).
      await this.#guardar();
    } else {
      // El estado solo discrepa del guardado si se ajustó el límite del capítulo.
      this.#dirty = pageIndex !== guardado.pageIndex;
    }
    return this.snapshot;
  }

  /** Abre un capítulo concreto (salto desde la lista): empieza en su página 0. */
  async openChapter(chapterId: string): Promise<ReaderSnapshot> {
    this.#contexto();
    const chapter = this.#chapters.find((c) => c.chapterId === chapterId);
    if (chapter === undefined) {
      throw new ModuleError("NOT_FOUND", `No existe el capítulo ${chapterId} en la serie`);
    }
    await this.#abrir(chapter, 0);
    return this.snapshot;
  }

  /** Abre el capítulo siguiente (tarjeta de fin, RF-21); `null` si no hay más. */
  async openNextChapter(): Promise<ReaderSnapshot | null> {
    const siguiente = this.#adyacente(1);
    if (siguiente === null) {
      return null;
    }
    await this.#abrir(siguiente, 0);
    return this.snapshot;
  }

  /** Abre el capítulo anterior; `null` si no hay más. */
  async openPreviousChapter(): Promise<ReaderSnapshot | null> {
    const anterior = this.#adyacente(-1);
    if (anterior === null) {
      return null;
    }
    await this.#abrir(anterior, 0);
    return this.snapshot;
  }

  /**
   * Avanza. En la última página no pasa de página: termina el capítulo (RF-21) y guarda de
   * inmediato, lo que marca el capítulo como leído (RF-32).
   */
  async next(): Promise<ReaderSnapshot> {
    this.#capituloAbierto();
    if (this.#enUltimaPagina()) {
      return this.snapshot;
    }
    this.#pageIndex += 1;
    await this.#alCambiarPagina();
    return this.snapshot;
  }

  /** Retrocede una página (desde la última, vuelve a ella); en la primera no se mueve. */
  async previous(): Promise<ReaderSnapshot> {
    this.#capituloAbierto();
    if (this.#pageIndex > 0) {
      this.#pageIndex -= 1;
      this.#dirty = true;
    }
    return this.snapshot;
  }

  /** Salta a una página, ajustada a los límites del capítulo. */
  async goToPage(index: number): Promise<ReaderSnapshot> {
    this.#capituloAbierto();
    if (!Number.isInteger(index)) {
      throw new ModuleError("INTERNAL", `Índice de página inválido: ${String(index)}`);
    }
    this.#pageIndex = ajustarPagina(index, pageTotalOf(this.#chapter));
    await this.#alCambiarPagina();
    return this.snapshot;
  }

  /** Cambia el modo de lectura y lo recuerda en la preferencia de la serie (T24, RF-18). */
  async setMode(mode: ReaderMode): Promise<ReaderSnapshot> {
    const { moduleId, seriesId } = this.#contexto();
    if (!MODOS.includes(mode)) {
      throw new ModuleError("INTERNAL", `Modo de lectura desconocido: ${String(mode)}`);
    }
    this.#mode = mode;
    await this.#prefs.setReaderMode(moduleId, seriesId, mode);
    return this.snapshot;
  }

  /** Guarda el progreso pendiente (RF-20). La interfaz la llama con retraso corto y al salir. */
  async flush(): Promise<void> {
    if (!this.#dirty) {
      return;
    }
    await this.#guardar();
  }

  /** Fija capítulo y página; si cae en la última, guarda de inmediato (RF-32). */
  async #abrir(chapter: ReaderChapter, pageIndex: number): Promise<void> {
    validarCapitulo(chapter);
    this.#chapter = chapter;
    this.#pageIndex = pageIndex;
    await this.#alCambiarPagina();
  }

  /** Tras mover la página: en la última se guarda ya; si no, queda pendiente. */
  async #alCambiarPagina(): Promise<void> {
    if (this.#enUltimaPagina()) {
      await this.#guardar();
    } else {
      this.#dirty = true;
    }
  }

  /** Una escritura atómica del progreso con `page_total` (T25, RF-20). */
  async #guardar(): Promise<void> {
    const { moduleId, seriesId } = this.#contexto();
    const chapter = this.#capituloAbierto().chapter;
    await this.#progress.save({
      moduleId,
      seriesId,
      chapterId: chapter.chapterId,
      releaseId: chapter.releaseId ?? null,
      chapterTitle: chapter.title ?? null,
      pageIndex: this.#pageIndex,
      pageTotal: pageTotalOf(chapter),
    });
    this.#dirty = false;
  }

  /** Capítulo a `delta` posiciones en la lista (0 = el actual); `null` si no hay. */
  #adyacente(delta: 1 | -1): ReaderChapter | null {
    const indice = this.#chapters.findIndex((c) => c.chapterId === this.#chapter?.chapterId);
    if (indice === -1) {
      return null;
    }
    return this.#chapters[indice + delta] ?? null;
  }

  /** ¿La página actual es la última del capítulo? (base 0, P-61) */
  #enUltimaPagina(): boolean {
    const total = pageTotalOf(this.#chapter);
    return total !== null && this.#pageIndex >= total - 1;
  }

  #contexto(): { moduleId: string; seriesId: string } {
    if (this.#moduleId === null || this.#seriesId === null) {
      throw new ModuleError("INTERNAL", "No hay ninguna serie abierta en el lector");
    }
    return { moduleId: this.#moduleId, seriesId: this.#seriesId };
  }

  #capituloAbierto(): { moduleId: string; seriesId: string; chapter: ReaderChapter } {
    const { moduleId, seriesId } = this.#contexto();
    if (this.#chapter === null) {
      throw new ModuleError("INTERNAL", "No hay ningún capítulo abierto en el lector");
    }
    return { moduleId, seriesId, chapter: this.#chapter };
  }
}
