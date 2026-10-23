import type { ImageSourcePropType } from "react-native";

import type { MediaKind } from "@ryuunest/core";

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
  /** Tipo de obra. */
  kind: MediaKind;
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
  /** Progreso de lectura; `null` = sin progreso. */
  progress: LibraryProgress | null;
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

/** Carpeta de favoritos. */
export interface LibraryFolder {
  /** ID de la carpeta. */
  id: string;
  /** Nombre de la carpeta. */
  name: string;
  /** Número de obras en la carpeta. */
  count: number;
}

/** Datos completos de la pantalla Biblioteca. */
export interface LibraryData {
  /** Todas las series favoritas. */
  series: LibrarySeries[];
  /** Carpetas de favoritos. */
  folders: LibraryFolder[];
  /** Módulos/fuentes disponibles (para el filtro de fuente). */
  sources: LibrarySource[];
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
};

// Fecha base para los fixtures (2026-10-01).
const BASE_DATE = Date.UTC(2026, 9, 1, 12, 0, 0);
const DAY = 24 * 60 * 60 * 1000;

/**
 * Conjunto de ejemplo con contenido: 12 series visibles (de 48 totales,
 * según las cifras de Inicio), 3 carpetas coherentes (24+14+10=48),
 * 2 fuentes, algunas con progreso y una NSFW.
 */
export const SAMPLE_LIBRARY_DATA: LibraryData = {
  sources: [
    { id: "m-ejemplo-a", name: "Módulo de ejemplo A" },
    { id: "m-ejemplo-b", name: "Módulo de ejemplo B" },
  ],
  folders: [
    { id: "epicos", name: "Favoritos Épicos", count: 24 },
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
  folderId: undefined,
  nsfwVisible: false,
  order: "name",
};

/**
 * Aplica los filtros a la lista de series (lógica de presentación; el
 * núcleo hace la consulta real con SQL en T23).
 */
export function filterLibrarySeries(
  series: readonly LibrarySeries[],
  filters: LibraryFilters,
): LibrarySeries[] {
  let result = [...series];

  // NSFW oculto por defecto (RF-35).
  if (!filters.nsfwVisible) {
    result = result.filter((s) => !s.nsfw);
  }

  // Búsqueda por título (normalizada, sin acentos ni mayúsculas).
  if (filters.search.trim() !== "") {
    const needle = filters.search
      .normalize("NFD")
      .replace(/\p{Mn}+/gu, "")
      .toLowerCase()
      .trim();
    result = result.filter((s) =>
      s.title
        .normalize("NFD")
        .replace(/\p{Mn}+/gu, "")
        .toLowerCase()
        .includes(needle),
    );
  }

  // Filtro por chip.
  if (filters.chip === "reading") {
    result = result.filter((s) => s.progress !== null);
  } else if (filters.chip === "folders") {
    result = result.filter((s) => s.folderId !== null);
  }

  // Filtro por tipos.
  if (filters.kinds.length > 0) {
    result = result.filter((s) => filters.kinds.includes(s.kind));
  }

  // Filtro por fuentes.
  if (filters.moduleIds.length > 0) {
    result = result.filter((s) => filters.moduleIds.includes(s.moduleId));
  }

  // Filtro por carpeta.
  if (filters.folderId === null) {
    result = result.filter((s) => s.folderId === null);
  } else if (filters.folderId !== undefined) {
    result = result.filter((s) => s.folderId === filters.folderId);
  }

  // Orden (RF-28).
  result.sort((a, b) => {
    switch (filters.order) {
      case "name":
        return a.title.localeCompare(b.title, "es");
      case "lastRead":
        return (b.progress?.pageIndex ?? 0) - (a.progress?.pageIndex ?? 0);
      case "addedAt":
        return b.addedAt - a.addedAt;
    }
  });

  return result;
}
