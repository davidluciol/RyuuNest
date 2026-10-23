import type { ImageSourcePropType } from "react-native";

import type { MediaKind } from "@ryuunest/core";

/**
 * F13 — datos de ejemplo coherentes para la pantalla Inicio
 * (`DESIGN_RULES.md` D1–D5): series inventadas, sin obras reales, portadas
 * sin texto, cifras que cuadran entre pantallas. Mismo conjunto que usa la
 * galería y `test-site`.
 */

/** Datos de progreso de lectura para Inicio (RF-33, RF-41). */
export interface HomeProgress {
  /** ID de la serie (clave junto al módulo). */
  seriesId: string;
  /** Título de la serie. */
  title: string;
  /** Tipo de obra. */
  kind: MediaKind;
  /** Fuente de la portada (asset local). */
  cover?: ImageSourcePropType;
  /** Capítulo en curso (p. ej. «Cap. 41»). */
  chapterLabel: string;
  /** Número de capítulo (para «Continuar cap. N»). */
  chapterNumber: number;
  /** Página actual (base 0). */
  pageIndex: number;
  /** Total de páginas del capítulo. */
  pageTotal: number;
  /** Metadatos superiores (fuente · estado). */
  meta: string;
}

/** Datos de una carpeta de favoritos para Inicio. */
export interface HomeFolder {
  /** ID de la carpeta. */
  id: string;
  /** Nombre de la carpeta. */
  name: string;
  /** Descripción/subtítulo. */
  description: string;
  /** Número de obras en la carpeta. */
  count: number;
}

/**
 * Conjunto de datos de ejemplo para Inicio. Cifras coherentes: 3 carpetas,
 * 48 obras en total (D1). El progreso muestra la misma serie en "Continuar"
 * y en el primer puesto de "Recientes".
 */
export interface HomeData {
  /** Serie con progreso más reciente (hero "Continuar"). */
  continueReading: HomeProgress | null;
  /** Fila de lecturas recientes (máx. 6 para el carrusel). */
  recent: HomeProgress[];
  /** Carpetas de favoritos (máx. 4 para la cuadrícula 2×2, V6). */
  folders: HomeFolder[];
}

/**
 * Datos de ejemplo vacíos: sin progreso ni favoritos. La pantalla muestra
 * el estado vacío (EmptyState) que lleva a añadir un repositorio.
 */
export const EMPTY_HOME_DATA: HomeData = {
  continueReading: null,
  recent: [],
  folders: [],
};

/**
 * Datos de ejemplo con contenido: una serie en curso (hero), 4 recientes
 * y 3 carpetas. Cifras coherentes (D1): 24 + 14 + 10 = 48 obras.
 */
export const SAMPLE_HOME_DATA: HomeData = {
  continueReading: {
    seriesId: "dragon-de-ceniza",
    title: "El dragón de ceniza",
    kind: "manhwa",
    chapterLabel: "Cap. 41",
    chapterNumber: 41,
    pageIndex: 11,
    pageTotal: 38,
    meta: "Crónicas de Alden · En emisión",
  },
  recent: [
    {
      seriesId: "sombras-de-arcano",
      title: "Sombras de Arcano",
      kind: "manhwa",
      chapterLabel: "Cap. 24",
      chapterNumber: 24,
      pageIndex: 18,
      pageTotal: 23,
      meta: "Sello Nocturno · En emisión",
    },
    {
      seriesId: "la-forja-perdida",
      title: "La forja perdida",
      kind: "manga",
      chapterLabel: "Cap. 52",
      chapterNumber: 52,
      pageIndex: 3,
      pageTotal: 30,
      meta: "Nido Editorial · En emisión",
    },
    {
      seriesId: "guardian-del-nido",
      title: "Guardián del nido",
      kind: "manga",
      chapterLabel: "Cap. 182",
      chapterNumber: 182,
      pageIndex: 0,
      pageTotal: 45,
      meta: "Nido Editorial · En emisión",
    },
    {
      seriesId: "cronicas-de-moonlit",
      title: "Crónicas de Moonlit",
      kind: "manhua",
      chapterLabel: "Cap. 12",
      chapterNumber: 12,
      pageIndex: 7,
      pageTotal: 20,
      meta: "Estudio Linterna · En pausa",
    },
  ],
  folders: [
    {
      id: "epicos",
      name: "Favoritos Épicos",
      description: "Fantasía y Aventuras",
      count: 24,
    },
    {
      id: "nocturna",
      name: "Lectura Nocturna",
      description: "Atmósfera y Misterio",
      count: 14,
    },
    {
      id: "completados",
      name: "Completados",
      description: "Historias finalizadas",
      count: 10,
    },
  ],
};
