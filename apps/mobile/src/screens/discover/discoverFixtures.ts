import type { MediaKind } from "@ryuunest/core";

/**
 * F15 — datos y lógica pura de la pantalla Descubrir (RF-9 a RF-11, RF-35).
 *
 * La pantalla no toca el núcleo ni la red: recibe `DiscoverView` y devuelve
 * eventos. Aquí vive lo comprobable sin montar la app: qué se ve con el filtro
 * NSFW apagado (RF-35), qué módulo queda seleccionado al entrar (RF-9, se
 * recuerda el último) y los datos de ejemplo coherentes con el conjunto único
 * de fixtures (`DESIGN_RULES.md` D1–D5): las mismas series inventadas que usan
 * Inicio, Biblioteca y `test-site`.
 */

/** Módulo elegible en el selector de Descubrir. */
export interface DiscoverModule {
  /** id del módulo (clave del contrato, SPEC §6.1). */
  id: string;
  /** Nombre visible (viene del manifiesto; no es texto de la app). */
  name: string;
  /** El módulo completo es NSFW (RF-35: oculto con el filtro apagado). */
  nsfw: boolean;
  /** El módulo ofrece `popular` (RF-9: la fila solo se muestra si existe). */
  hasPopular: boolean;
  /** El módulo ofrece `latest` (RF-9). */
  hasLatest: boolean;
}

/** Serie devuelta por un módulo (de `SeriesSummary`, SPEC §6.2). */
export interface DiscoverEntry {
  seriesId: string;
  moduleId: string;
  title: string;
  /** Tipo declarado por el módulo; `null` si no lo declara. */
  kind: MediaKind | null;
  nsfw: boolean;
  /** Texto secundario del módulo (p. ej. «hace 2 h»); `null` si no trae. */
  hint: string | null;
}

/** Página del catálogo (búsqueda con paginación, RF-10). `page` empieza en 1. */
export interface DiscoverPage {
  page: number;
  entries: DiscoverEntry[];
  hasNext: boolean;
}

/** Error de módulo para el estado de error (RF-11: causa, código y detalle). */
export interface DiscoverError {
  /** Nombre del módulo que falló. */
  moduleName: string;
  /** Causa legible (message del `ModuleError`). */
  cause: string;
  /** Código del contrato (SPEC §6.4). */
  code: string;
  url?: string;
  selector?: string;
}

/** Datos de la pantalla una vez montado el módulo seleccionado. */
export interface DiscoverReady {
  /** Módulos visibles ya filtrados por RF-35. */
  modules: readonly DiscoverModule[];
  selectedModuleId: string;
  /** Consulta entregada (vacía = catálogo sin filtrar). */
  query: string;
  latest: readonly DiscoverEntry[];
  popular: readonly DiscoverEntry[];
  catalog: DiscoverPage;
}

/** Estado de la pantalla, como lo ve la ruta. */
export type DiscoverView =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "error"; error: DiscoverError }
  | { status: "ready"; ready: DiscoverReady };

/** Página vacía: primera, sin entradas ni siguiente. */
export const EMPTY_DISCOVER_PAGE: DiscoverPage = { page: 1, entries: [], hasNext: false };

/**
 * Con el filtro NSFW apagado, un módulo NSFW no aparece en el selector (RF-35).
 */
export function visibleDiscoverModules(
  modules: readonly DiscoverModule[],
  nsfwVisible: boolean,
): DiscoverModule[] {
  return nsfwVisible ? [...modules] : modules.filter((module) => !module.nsfw);
}

/** Lo mismo para las filas de series que devuelve un módulo. */
export function visibleDiscoverEntries(
  entries: readonly DiscoverEntry[],
  nsfwVisible: boolean,
): DiscoverEntry[] {
  return nsfwVisible ? [...entries] : entries.filter((entry) => !entry.nsfw);
}

/**
 * Módulo seleccionado al entrar (RF-9): se recuerda el último; si ya no está
 * (desinstalado u oculto por RF-35), se usa el primero visible. `null` = nada
 * que seleccionar.
 */
export function resolveSelectedModuleId(
  visibleModules: readonly DiscoverModule[],
  rememberedId: string | null,
): string | null {
  if (rememberedId !== null && visibleModules.some((module) => module.id === rememberedId)) {
    return rememberedId;
  }
  return visibleModules.length > 0 ? visibleModules[0].id : null;
}

// — Datos de ejemplo (galería y prueba de la pantalla en web; coherentes con
//   el conjunto único, D1–D5). «B» es NSFW para poder probar RF-35.

const moduleEntry = (
  seriesId: string,
  title: string,
  kind: MediaKind | null,
  hint: string | null = null,
): DiscoverEntry => ({ seriesId, moduleId: "m-ejemplo-a", title, kind, nsfw: false, hint });

export const SAMPLE_DISCOVER_MODULES: readonly DiscoverModule[] = [
  { id: "m-ejemplo-a", name: "Módulo de ejemplo A", nsfw: false, hasPopular: true, hasLatest: true },
  { id: "m-ejemplo-b", name: "Módulo de ejemplo B", nsfw: true, hasPopular: false, hasLatest: true },
];

/**
 * Las filas reproducen el conjunto de `test-site` (`SeriesSummary` de SPEC §6.2
 * con su `hint`), y el catálogo añade series de la familia ya usada en
 * Biblioteca (F14). «Draco de jade» es NSFW: con el filtro apagado no se ve.
 */
export const SAMPLE_DISCOVER_LATEST: readonly DiscoverEntry[] = [
  moduleEntry("dragon-de-ceniza", "El dragón de ceniza", "manhwa", "hace 2 h · Equipo Ryuu"),
  moduleEntry("guardiana-del-nido", "La guardiana del nido", "manga", "hace 6 h · Nido Editorial"),
  moduleEntry("cronicas-de-moonlit", "Crónicas de Moonlit", "manhua", "hace 3 d · Estudio Linterna"),
  moduleEntry("noche-de-ambar", "Noche de ámbar", "comic", "hace 1 sem · Taller Ámbar"),
];

export const SAMPLE_DISCOVER_POPULAR: readonly DiscoverEntry[] = [
  moduleEntry("dragon-de-ceniza", "El dragón de ceniza", "manhwa", "★ 8.4"),
  moduleEntry("la-forja-perdida", "La forja perdida", "manga", "★ 8.1"),
  moduleEntry("sombras-de-arcano", "Sombras de Arcano", "manhwa", "★ 7.9"),
  moduleEntry("guardiana-del-nido", "La guardiana del nido", "manga", "★ 7.6"),
];

export const SAMPLE_DISCOVER_CATALOG: DiscoverPage = {
  page: 1,
  hasNext: true,
  entries: [
    moduleEntry("dragon-de-ceniza", "El dragón de ceniza", "manhwa", "hace 2 h · Equipo Ryuu"),
    moduleEntry("guardiana-del-nido", "La guardiana del nido", "manga", "hace 6 h · Nido Editorial"),
    moduleEntry("cronicas-de-moonlit", "Crónicas de Moonlit", "manhua", "hace 3 d · Estudio Linterna"),
    moduleEntry("noche-de-ambar", "Noche de ámbar", "comic", "hace 1 sem · Taller Ámbar"),
    {
      seriesId: "draco-de-jade",
      moduleId: "m-ejemplo-a",
      title: "Draco de jade",
      kind: "manhwa",
      nsfw: true,
      hint: "hace 4 d · Sellos Unidos",
    },
    moduleEntry("montana-de-hielo", "Montaña de hielo", "manhwa", "hace 5 d · Estudio Linterna"),
  ],
};
