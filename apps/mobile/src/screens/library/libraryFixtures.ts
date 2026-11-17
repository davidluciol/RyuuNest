import type { ImageSourcePropType } from "react-native";

import { normalizeTitle, type MediaKind } from "@ryuunest/core";

import { t } from "../../i18n";

/**
 * F14a/F14b — datos de ejemplo coherentes para la pantalla Biblioteca
 * (`DESIGN_RULES.md` D1–D5): series inventadas, sin obras reales, portadas
 * sin texto, cifras que cuadran con Inicio (48 obras, 3 carpetas).
 *
 * Cifras coherentes (D1): 24 + 14 + 10 = 48 obras en 3 carpetas.
 * Algunas series tienen progreso (aparecen en «Leyendo»), otras no.
 * Una serie es NSFW (para probar RF-35).
 */

/** Serie de la cuadrícula de Biblioteca. */
export interface LibrarySeries {
  /** ID de la serie (clave junto al módulo). */
  seriesId: string;
  /** Módulo/fuente de la serie. */
  moduleId: string;
  /** Título de la serie. */
  title: string;
  /** Tipo de obra; `null` si el módulo no lo declara. */
  kind: MediaKind | null;
  /** Fuente de la portada (asset local). */
  cover?: ImageSourcePropType;
  /** NSFW (RF-35: oculto por defecto). */
  nsfw: boolean;
  /** Estado de la serie. */
  status: "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";
  /** Carpeta a la que pertenece; `null` = sin carpeta (D-12). */
  folderId: string | null;
  /** Fecha de adición a favoritos (timestamp ms). */
  addedAt: number;
  /** Último movimiento (progreso o, sin él, alta); ausente = `addedAt`. */
  lastReadAt?: number;
  /** Progreso de lectura; `null` = sin progreso. */
  progress: LibraryProgress | null;
  /** Géneros de la serie (F53). Ausentes = sin etiquetas. */
  tags?: string[];
}

/** Progreso de lectura de una serie (RF-31, RF-41). */
export interface LibraryProgress {
  /** Capítulo en curso. */
  chapterId: string;
  /** Título del capítulo. */
  chapterTitle: string;
  /** Página actual (base 0). */
  pageIndex: number;
  /** Total de páginas del capítulo. */
  pageTotal: number;
}

/**
 * Id de «Gemas» (F52): no es una carpeta en la base sino la vista de todas las series; elegirla
 * equivale a no filtrar por carpeta.
 */
export const GEMS_FOLDER_ID = "gems";

/** Carpeta de favoritos. */
export interface LibraryFolder {
  /** ID de la carpeta. */
  id: string;
  /** Nombre de la carpeta. */
  name: string;
  /** Número de obras en la carpeta. */
  count: number;
  /** F52: `gems` = vista de todo (sin fila); `favorites` = carpeta del sistema. Ausente = del usuario. */
  kind?: "gems" | "favorites";
  /** Etiquetas de la carpeta inteligente (F53): muestra también las series que las tengan. */
  tags?: string[];
}

/** Datos completos de la pantalla Biblioteca. */
export interface LibraryData {
  /** Todas las series favoritas. */
  series: LibrarySeries[];
  /** Carpetas de favoritos. */
  folders: LibraryFolder[];
  /** Módulos/fuentes disponibles (para el filtro de fuente). */
  sources: LibrarySource[];
  /** Etiquetas de las series guardadas, para elegirlas al crear una carpeta (F53). */
  tags: string[];
}

/** Fuente (módulo) disponible para filtrar. */
export interface LibrarySource {
  /** ID del módulo. */
  id: string;
  /** Nombre visible del módulo. */
  name: string;
}

/** Datos vacíos: sin favoritos. */
export const EMPTY_LIBRARY_DATA: LibraryData = {
  series: [],
  folders: [],
  sources: [],
  tags: [],
};

// Fecha base para los fixtures (2026-10-01).
const BASE_DATE = Date.UTC(2026, 9, 1, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

/**
 * Conjunto de ejemplo con contenido: 12 series visibles (de 48 totales,
 * según las cifras de Inicio), 3 carpetas coherentes (24+14+10=48),
 * 2 fuentes, algunas con progreso y una NSFW.
 */
const RAW_SAMPLE_LIBRARY_DATA: Omit<LibraryData, "tags"> = {
  sources: [
    { id: "m-ejemplo-a", name: "Módulo de ejemplo A" },
    { id: "m-ejemplo-b", name: "Módulo de ejemplo B" },
  ],
  folders: [
    { id: GEMS_FOLDER_ID, name: t("library.folder.gems"), count: 48, kind: "gems" },
    { id: "epicos", name: t("library.folder.favorites"), count: 24, kind: "favorites" },
    { id: "nocturna", name: "Lectura Nocturna", count: 14 },
    { id: "completados", name: "Completados", count: 10 },
  ],
  series: [
    {
      seriesId: "dragon-de-ceniza",
      moduleId: "m-ejemplo-a",
      title: "El dragón de ceniza",
      kind: "manhwa",
      nsfw: false,
      status: "ongoing",
      folderId: "epicos",
      addedAt: BASE_DATE,
      progress: {
        chapterId: "ch-41",
        chapterTitle: "Capítulo 41",
        pageIndex: 11,
        pageTotal: 38,
      },
    },
    {
      seriesId: "sombras-de-arcano",
      moduleId: "m-ejemplo-a",
      title: "Sombras de Arcano",
      kind: "manhwa",
      nsfw: false,
      status: "ongoing",
      folderId: "nocturna",
      addedAt: BASE_DATE - DAY * 2,
      progress: {
        chapterId: "ch-24",
        chapterTitle: "Capítulo 24",
        pageIndex: 18,
        pageTotal: 23,
      },
    },
    {
      seriesId: "la-forja-perdida",
      moduleId: "m-ejemplo-b",
      title: "La forja perdida",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
      folderId: "epicos",
      addedAt: BASE_DATE - DAY * 5,
      progress: {
        chapterId: "ch-52",
        chapterTitle: "Capítulo 52",
        pageIndex: 3,
        pageTotal: 30,
      },
    },
    {
      seriesId: "guardiana-del-nido",
      moduleId: "m-ejemplo-b",
      title: "La guardiana del nido",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
      folderId: "epicos",
      addedAt: BASE_DATE - DAY * 7,
      progress: null,
    },
    {
      seriesId: "cronicas-de-moonlit",
      moduleId: "m-ejemplo-a",
      title: "Crónicas de Moonlit",
      kind: "manhua",
      nsfw: false,
      status: "hiatus",
      folderId: "nocturna",
      addedAt: BASE_DATE - DAY * 10,
      progress: {
        chapterId: "ch-12",
        chapterTitle: "Capítulo 12",
        pageIndex: 7,
        pageTotal: 20,
      },
    },
    {
      seriesId: "noche-de-ambar",
      moduleId: "m-ejemplo-b",
      title: "Noche de ámbar",
      kind: "comic",
      nsfw: false,
      status: "completed",
      folderId: "completados",
      addedAt: BASE_DATE - DAY * 30,
      progress: null,
    },
    {
      seriesId: "el-eco-de-los-valles",
      moduleId: "m-ejemplo-a",
      title: "El eco de los valles",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
      folderId: "epicos",
      addedAt: BASE_DATE - DAY * 1,
      progress: {
        chapterId: "ch-42",
        chapterTitle: "Capítulo 42",
        pageIndex: 25,
        pageTotal: 42,
      },
    },
    {
      seriesId: "las-cronicas-del-reloj",
      moduleId: "m-ejemplo-b",
      title: "Las crónicas del reloj",
      kind: "manga",
      nsfw: false,
      status: "ongoing",
      folderId: null,
      addedAt: BASE_DATE - DAY * 3,
      progress: null,
    },
    {
      seriesId: "montana-de-hielo",
      moduleId: "m-ejemplo-a",
      title: "Montaña de hielo",
      kind: "manhwa",
      nsfw: false,
      status: "ongoing",
      folderId: "nocturna",
      addedAt: BASE_DATE - DAY * 4,
      progress: null,
    },
    {
      seriesId: "el-ultimo-susurro",
      moduleId: "m-ejemplo-b",
      title: "El último susurro",
      kind: "comic",
      nsfw: false,
      status: "completed",
      folderId: "completados",
      addedAt: BASE_DATE - DAY * 60,
      progress: null,
    },
    {
      seriesId: "ciudad-sin-nombre",
      moduleId: "m-ejemplo-a",
      title: "Ciudad sin nombre",
      kind: "manhua",
      nsfw: false,
      status: "ongoing",
      folderId: "epicos",
      addedAt: BASE_DATE - DAY * 6,
      progress: null,
    },
    {
      seriesId: "draco-de-jade",
      moduleId: "m-ejemplo-a",
      title: "Draco de jade",
      kind: "manhwa",
      nsfw: true,
      status: "ongoing",
      folderId: "nocturna",
      addedAt: BASE_DATE - DAY * 8,
      progress: null,
    },
  ],
};

/** Géneros de ejemplo por serie (inventados, F53): dan etiquetas que elegir en la carpeta nueva. */
const SAMPLE_TAGS: Readonly<Record<string, readonly string[]>> = {
  "dragon-de-ceniza": ["Acción", "Fantasía"],
  "sombras-de-arcano": ["Acción", "Aventura"],
  "la-forja-perdida": ["Fantasía", "Seinen"],
  "guardiana-del-nido": ["Aventura"],
  "cronicas-de-moonlit": ["Fantasía", "Isekai"],
  "noche-de-ambar": ["Misterio", "Seinen"],
  "el-eco-de-los-valles": ["Aventura", "Fantasía"],
  "las-cronicas-del-reloj": ["Misterio"],
  "montana-de-hielo": ["Aventura", "Shonen"],
  "el-ultimo-susurro": ["Seinen", "Terror"],
  "ciudad-sin-nombre": ["Acción", "Misterio"],
  "draco-de-jade": ["Fantasía"],
};

/** Etiquetas distintas de un conjunto de series, por orden alfabético. */
function distinctTags(series: readonly LibrarySeries[]): string[] {
  const vistas = new Map<string, string>();
  for (const tag of series.flatMap((s) => s.tags ?? [])) {
    const clave = normalizeTitle(tag);
    if (!vistas.has(clave)) vistas.set(clave, tag);
  }
  return [...vistas.values()].sort((a, b) => a.localeCompare(b, "es"));
}

const SAMPLE_SERIES: LibrarySeries[] = RAW_SAMPLE_LIBRARY_DATA.series.map((s) => ({
  ...s,
  tags: [...(SAMPLE_TAGS[s.seriesId] ?? [])],
}));

/** Conjunto de ejemplo completo: las series llevan sus géneros y `tags` los reúne. */
export const SAMPLE_LIBRARY_DATA: LibraryData = {
  ...RAW_SAMPLE_LIBRARY_DATA,
  series: SAMPLE_SERIES,
  tags: distinctTags(SAMPLE_SERIES),
};

/** Por qué se rechaza el nombre de una carpeta (igual que `FolderNameError` del núcleo). */
export type FolderNameProblem = "EMPTY" | "DUPLICATE";

/** Nombre vacío o repetido (sin distinguir mayúsculas, acentos ni espacios de los bordes). */
export function validateFolderName(
  name: string,
  existing: readonly string[],
): FolderNameProblem | null {
  const clave = normalizeTitle(name);
  if (clave === "") return "EMPTY";
  return existing.some((otro) => normalizeTitle(otro) === clave) ? "DUPLICATE" : null;
}

/**
 * ¿Pertenece la serie a la carpeta? «Gemas» contiene todo; las demás, lo puesto a mano más lo
 * que tenga alguna de sus etiquetas (carpeta inteligente, F53).
 */
export function seriesInFolder(series: LibrarySeries, folder: LibraryFolder): boolean {
  if (folder.kind === "gems") return true;
  if (series.folderId === folder.id) return true;
  const claves = new Set((folder.tags ?? []).map(normalizeTitle));
  return (series.tags ?? []).some((tag) => claves.has(normalizeTitle(tag)));
}

/** Número de series de la carpeta (las NSFW solo si se piden, RF-35). */
export function folderCount(
  series: readonly LibrarySeries[],
  folder: LibraryFolder,
  nsfwVisible: boolean,
): number {
  return series.filter((s) => (nsfwVisible || !s.nsfw) && seriesInFolder(s, folder)).length;
}

/**
 * Alta de una carpeta en los datos de ejemplo (web de Expo, sin base real): el mismo contrato
 * que `Folders.create` del núcleo, para que la pantalla se verifique igual.
 */
export function addSampleFolder(
  data: LibraryData,
  name: string,
  tags: readonly string[],
  move?: SeriesKey,
): { ok: true; data: LibraryData } | { ok: false; reason: FolderNameProblem } {
  const problem = validateFolderName(
    name,
    data.folders.map((f) => f.name),
  );
  if (problem !== null) return { ok: false, reason: problem };
  const folder: LibraryFolder = {
    id: `nueva-${data.folders.length}`,
    name: name.trim(),
    count: 0,
    tags: [...tags],
  };
  const created: LibraryData = { ...data, folders: [...data.folders, folder] };
  // «Mover y crear» (F54): la serie pasa a la carpeta nueva y su recuento se calcula con ella.
  const result = move === undefined ? created : moveSampleSeries(created, move, folder.id);
  const index = result.folders.length - 1;
  const counted = { ...folder, count: folderCount(result.series, folder, true) };
  return { ok: true, data: { ...result, folders: result.folders.map((f, i) => (i === index ? counted : f)) } };
}

/** Clave de una serie guardada. */
export interface SeriesKey {
  moduleId: string;
  seriesId: string;
}

const sameSeries = (s: LibrarySeries, key: SeriesKey): boolean =>
  s.moduleId === key.moduleId && s.seriesId === key.seriesId;

/** Suma `delta` al recuento de una carpeta (los de ejemplo son cifras fijas, no se recalculan). */
function bump(folders: readonly LibraryFolder[], id: string | null, delta: number): LibraryFolder[] {
  return folders.map((f) => (f.id === id ? { ...f, count: Math.max(0, f.count + delta) } : f));
}

/** F54 (web sin base): mueve la serie a otra carpeta; una sola carpeta (D-12). */
export function moveSampleSeries(data: LibraryData, key: SeriesKey, folderId: string): LibraryData {
  const current = data.series.find((s) => sameSeries(s, key));
  if (current === undefined || current.folderId === folderId) return data;
  return {
    ...data,
    series: data.series.map((s) => (sameSeries(s, key) ? { ...s, folderId } : s)),
    folders: bump(bump(data.folders, current.folderId, -1), folderId, 1),
  };
}

/** F54 (web sin base): quita la serie de Tesoros; su progreso no es de esta lista (RF-30). */
export function removeSampleSeries(data: LibraryData, key: SeriesKey): LibraryData {
  const current = data.series.find((s) => sameSeries(s, key));
  if (current === undefined) return data;
  return {
    ...data,
    series: data.series.filter((s) => !sameSeries(s, key)),
    folders: bump(bump(data.folders, current.folderId, -1), GEMS_FOLDER_ID, -1),
  };
}

/** Filtros activos de la pantalla Biblioteca. */
export interface LibraryFilters {
  /** Búsqueda por título. */
  search: string;
  /** Chip activo: «all» | «reading» | «folders». */
  chip: "all" | "reading" | "folders";
  /** Tipos seleccionados (vacío = todos). */
  kinds: MediaKind[];
  /** Fuentes seleccionadas (vacío = todas). */
  moduleIds: string[];
  /** Categorías (etiquetas) marcadas: sale la serie con alguna de ellas (F55); vacío = todas. */
  tags: string[];
  /** Carpeta seleccionada; `null` = sin carpeta; `undefined` = cualquiera. */
  folderId?: string | null;
  /** Mostrar contenido NSFW (RF-34: apagado por defecto). */
  nsfwVisible: boolean;
  /** Orden (RF-28). */
  order: "name" | "lastRead" | "addedAt";
}

/** Filtros por defecto: Todo, sin búsqueda, NSFW oculto, orden por nombre. */
export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  search: "",
  chip: "all",
  kinds: [],
  moduleIds: [],
  tags: [],
  folderId: undefined,
  nsfwVisible: false,
  order: "name",
};

/** ¿Hay algún filtro (no el texto) que pueda dejar la lista sin series? «Gemas» no filtra (F56). */
export function hasActiveFilters(filters: LibraryFilters): boolean {
  return (
    filters.tags.length > 0 ||
    filters.kinds.length > 0 ||
    filters.moduleIds.length > 0 ||
    (filters.folderId !== undefined && filters.folderId !== GEMS_FOLDER_ID) ||
    filters.chip !== "all"
  );
}

/** Quita texto y filtros; el orden y el NSFW son preferencias y se respetan. */
export function clearedFilters(filters: LibraryFilters): LibraryFilters {
  return { ...DEFAULT_LIBRARY_FILTERS, order: filters.order, nsfwVisible: filters.nsfwVisible };
}

/**
 * F34 — filas de la cuadrícula de Biblioteca cuando la pantalla se muestra dentro de otro
 * contenedor con scroll (galería): se dibuja sin `FlatList` para no anidar listas virtualizadas.
 * Conserva el orden y no muta la entrada.
 */
export function libraryGridRows<T>(items: readonly T[], columns: number): T[][] {
  const rows: T[][] = [];
  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }
  return rows;
}

/**
 * Aplica los filtros a la lista de series (lógica de presentación; el
 * núcleo hace la consulta real con SQL en T23).
 */
export function filterLibrarySeries(
  series: readonly LibrarySeries[],
  filters: LibraryFilters,
  folders: readonly LibraryFolder[] = [],
): LibrarySeries[] {
  let result = [...series];

  // NSFW oculto por defecto (RF-35).
  if (!filters.nsfwVisible) {
    result = result.filter((s) => !s.nsfw);
  }

  // Búsqueda por título (F55): todas las palabras, en cualquier orden, sin tildes ni mayúsculas.
  const words = normalizeTitle(filters.search).split(" ").filter((w) => w !== "");
  if (words.length > 0) {
    result = result.filter((s) => {
      const title = normalizeTitle(s.title);
      return words.every((word) => title.includes(word));
    });
  }

  // Categorías (F55): alguna de las marcadas.
  if (filters.tags.length > 0) {
    const wanted = new Set(filters.tags.map(normalizeTitle));
    result = result.filter((s) => (s.tags ?? []).some((tag) => wanted.has(normalizeTitle(tag))));
  }

  // Filtro por chip.
  if (filters.chip === "reading") {
    result = result.filter((s) => s.progress !== null);
  } else if (filters.chip === "folders") {
    result = result.filter((s) => s.folderId !== null);
  }

  // Filtro por tipos.
  if (filters.kinds.length > 0) {
    result = result.filter((s) => s.kind !== null && filters.kinds.includes(s.kind));
  }

  // Filtro por fuentes.
  if (filters.moduleIds.length > 0) {
    result = result.filter((s) => filters.moduleIds.includes(s.moduleId));
  }

  // Filtro por carpeta.
  if (filters.folderId === null) {
    result = result.filter((s) => s.folderId === null);
  } else if (filters.folderId !== undefined && filters.folderId !== GEMS_FOLDER_ID) {
    const folder = folders.find((f) => f.id === filters.folderId);
    result = result.filter((s) =>
      folder === undefined ? s.folderId === filters.folderId : seriesInFolder(s, folder),
    );
  }

  // Orden (RF-28).
  result.sort((a, b) => {
    switch (filters.order) {
      case "name":
        return a.title.localeCompare(b.title, "es");
      case "lastRead":
        return (b.lastReadAt ?? b.addedAt) - (a.lastReadAt ?? a.addedAt);
      case "addedAt":
        return b.addedAt - a.addedAt;
    }
  });

  return result;
}
