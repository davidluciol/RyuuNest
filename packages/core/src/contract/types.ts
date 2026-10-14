/**
 * Tipos de datos y del contrato de módulos (SPEC §6.1–6.3 y §6.5).
 *
 * Son la API pública que implementa cada módulo (declarativo o script) y la forma
 * en que la app consume los resultados. Sin dependencias de plataforma.
 */

/** Tipos de obra soportados (D-13). */
export type MediaKind = "manga" | "manhua" | "manhwa" | "comic";

/** Estado de publicación de una serie. */
export type SeriesStatus = "ongoing" | "completed" | "hiatus" | "cancelled" | "unknown";

/** Página de resultados paginados. */
export interface Page<T> {
  items: T[];
  hasNext: boolean;
}

/** Referencia a una imagen, con cabeceras opcionales para su descarga. */
export interface ImageRef {
  url: string;
  headers?: Record<string, string>;
}

/** Resumen de serie para listas y búsquedas (SPEC §6.2). */
export interface SeriesSummary {
  /**
   * Identificador estable y relativo al sitio (por ejemplo una ruta), nunca una
   * URL absoluta: los dominios cambian. La clave real es `(moduleId, id)`.
   */
  id: string;
  title: string;
  cover?: ImageRef;
  kind?: MediaKind;
  nsfw?: boolean;
  /** Etiquetas cortas, por ejemplo "Seinen" o "★ 8.1". */
  badges?: string[];
  /** Texto secundario, por ejemplo "hace 2 h · Grupo X". */
  hint?: string;
}

/** Edición concreta de un capítulo (grupo o release), SPEC §6.2. */
export interface Release {
  id: string;
  group?: string;
  /** Fecha de publicación en ISO 8601. */
  publishedAt?: string;
}

/** Capítulo con al menos una edición. */
export interface Chapter {
  id: string;
  title: string;
  number?: number;
  /** Al menos una edición. */
  releases: Release[];
}

/** Detalle completo de una serie (SPEC §6.2). */
export interface SeriesDetails extends SeriesSummary {
  description?: string;
  genres: string[];
  status: SeriesStatus;
  altTitles: string[];
  extra: Record<string, string>;
  /** Capítulos, más nuevo primero por defecto. */
  chapters: Chapter[];
}

/** Páginas de un capítulo en una edición concreta. */
export interface ChapterPages {
  title?: string;
  images: ImageRef[];
}

/** Manifest de un módulo (SPEC §6.1). */
export interface ModuleManifest {
  /** `[a-z0-9-]`, único dentro del repo. */
  id: string;
  name: string;
  /** Versión semver del módulo. */
  version: string;
  /** Versión del contrato que implementa. */
  apiVersion: 1;
  runtime: "declarative" | "script";
  kinds: MediaKind[];
  /** Idioma BCP 47, por ejemplo "es" o "en". */
  lang: string;
  /** El módulo completo es NSFW. */
  nsfw: boolean;
  baseUrl: string;
  capabilities: Array<"popular" | "latest" | "search">;
  /** Dominios a los que el módulo puede llamar. */
  permissions: { domains: string[] };
  /** Archivo de entrada dentro del paquete. */
  entry: string;
  minAppVersion?: string;
  author?: string;
  homepage?: string;
  license?: string;
}

/** Interfaz que implementa un módulo (SPEC §6.3). */
export interface ModuleApi {
  popular?(page: number): Promise<Page<SeriesSummary>>;
  latest?(page: number): Promise<Page<SeriesSummary>>;
  search(query: string, page: number): Promise<Page<SeriesSummary>>;
  details(seriesId: string): Promise<SeriesDetails>;
  pages(chapterId: string, releaseId: string): Promise<ChapterPages>;
}

/**
 * Inicio de petición del host.
 *
 * ⚠️ Provisional: el SPEC §6.5 solo nombra el tipo; su forma completa se cierra en
 * T08 (`ModuleHost`).
 */
export interface HostRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Respuesta del host.
 *
 * ⚠️ Provisional: se cierra en T08 (`ModuleHost`).
 */
export interface HostResponse {
  status: number;
  headers: Record<string, string>;
  text(): Promise<string>;
}

/**
 * Elemento de un documento HTML parseado (selectores CSS tipo jQuery).
 *
 * ⚠️ Provisional: se cierra en T08 (`ModuleHost`).
 */
export interface HtmlElement {
  attr(name: string): string | undefined;
  text(): string;
  select(selector: string): HtmlElement[];
}

/**
 * Documento HTML con selectores CSS.
 *
 * ⚠️ Provisional: se cierra en T08 (`ModuleHost`).
 */
export interface HtmlDocument {
  select(selector: string): HtmlElement[];
  find(selector: string): HtmlElement[];
}

/**
 * API del host para módulos script (SPEC §6.5). El host aplica por defecto
 * permiso por dominio, tiempo límite, límite de concurrencia y pausa mínima.
 */
export interface Host {
  fetch(url: string, init?: HostRequestInit): Promise<HostResponse>;
  html(text: string): HtmlDocument;
  log(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown): void;
  settings: { get(key: string): string | undefined; set(key: string, value: string): void };
}
