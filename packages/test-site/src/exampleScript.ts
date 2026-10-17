/**
 * Módulo **script** de ejemplo (SPEC §6.5) contra los sitios falsos de este paquete.
 *
 * Demuestra las dos caras del nivel «script»:
 *
 * - **HTML**: `host.fetch()` + `host.html()` con selectores CSS.
 * - **JSON**: `host.fetch()` + `JSON.parse`, con paginación por **cursor** (sin selectores).
 *
 * El módulo solo usa la API del `Host` (permisos de dominio, tiempo límite y concurrencia
 * los aplica el host) y declara en su configuración las cabeceras que el sitio exige al
 * pedir las imágenes (RF-24): si no las define, las imágenes van sin `headers`.
 *
 * Se publica como **fábrica TypeScript** (no como `.js` en `fixtures/`), igual que el
 * módulo declarativo de ejemplo (P-51): el núcleo, que no tiene tipos de Node, no lee
 * ficheros. Los errores del módulo los mapea el runtime (T20); aquí se lanzan errores
 * normales con un mensaje concreto.
 */
import type {
  Chapter,
  Host,
  HtmlDocument,
  HtmlElement,
  ImageRef,
  MediaKind,
  ModuleApi,
  Page,
  Release,
  ScriptFactory,
  SeriesDetails,
  SeriesStatus,
  SeriesSummary,
} from "@ryuunest/core";

import {
  HTML_SELECTORS,
  HTML_SITE_BASE_URL,
  JSON_API_BASE_URL,
  JSON_API_IMAGE_HEADERS,
} from "./sites.js";

/** Nombre del archivo de entrada del módulo de ejemplo (`manifest.entry`). */
export const EXAMPLE_SCRIPT_ENTRY = "index.js";

/** Sitio al que apunta el módulo de ejemplo. */
export interface ExampleScriptSite {
  baseUrl: string;
  /** `html`: selectores con `host.html()`; `json`: respuestas JSON con paginación por cursor. */
  architecture: "html" | "json";
  /**
   * Cabeceras que el sitio exige al pedir las imágenes (RF-24). Si no se indican, las
   * imágenes se devuelven sin `headers`.
   */
  imageHeaders?: Readonly<Record<string, string>>;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

type Scope = HtmlDocument | HtmlElement;

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function textIn(scope: Scope, selector: string): string {
  const text = scope.select(selector)[0]?.text().trim() ?? "";
  if (text === "") {
    throw new Error(`La página no trae texto en «${selector}»`);
  }
  return text;
}

function textList(scope: Scope, selector: string): string[] {
  return scope.select(selector).map((element) => element.text().trim());
}

function attrIn(scope: Scope, selector: string, name: string): string {
  return attrOf(scope.select(selector)[0], name, `«${selector}»`);
}

function attrOf(element: HtmlElement | undefined, name: string, where = ""): string {
  const value = element?.attr(name) ?? "";
  if (value === "") {
    throw new Error(`La página no trae el atributo «${name}»${where === "" ? "" : ` de ${where}`}`);
  }
  return value;
}

/** Último segmento de una ruta (`/serie/dragon-de-ceniza` → `dragon-de-ceniza`, P-50). */
function lastSegment(href: string): string {
  const path = href.split(/[?#]/u)[0] ?? "";
  const segment = path
    .split("/")
    .filter((part) => part !== "")
    .pop();
  if (segment === undefined) {
    throw new Error(`No se pudo leer el id de «${href}»`);
  }
  return segment;
}

function withQuery(path: string, params: Record<string, string>): string {
  const entries = Object.entries(params).filter(([, value]) => value !== "");
  if (entries.length === 0) {
    return path;
  }
  const query = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `${path}?${query}`;
}

function toImageRefs(
  urls: readonly string[],
  headers: Readonly<Record<string, string>> | undefined,
): ImageRef[] {
  return urls.map((url) => (headers === undefined ? { url } : { url, headers: { ...headers } }));
}

async function readText(host: Host, url: string): Promise<string> {
  const response = await host.fetch(url);
  if (response.status >= 400) {
    throw new Error(`El sitio respondió ${response.status} a ${url}`);
  }
  return response.text();
}

async function readJson(host: Host, url: string): Promise<unknown> {
  const text = await readText(host, url);
  try {
    return JSON.parse(text) as unknown;
  } catch (error) {
    throw new Error(`Respuesta JSON inválida en ${url}: ${describe(error)}`);
  }
}

/* ------------------------------------------------------------------ */
/* Arquitectura HTML (selectores + paginación numérica)                */
/* ------------------------------------------------------------------ */

function createHtmlApi(host: Host, site: ExampleScriptSite): ModuleApi {
  const base = site.baseUrl;

  const summary = (card: HtmlElement): SeriesSummary => ({
    id: lastSegment(attrIn(card, HTML_SELECTORS.list.link, "href")),
    title: textIn(card, HTML_SELECTORS.list.title),
    cover: { url: attrIn(card, HTML_SELECTORS.list.cover, "src") },
    kind: textIn(card, HTML_SELECTORS.list.kind) as MediaKind,
    hint: textIn(card, HTML_SELECTORS.list.hint),
  });

  const listing = async (url: string): Promise<Page<SeriesSummary>> => {
    const document = host.html(await readText(host, url));
    return {
      items: document.select(HTML_SELECTORS.list.items).map(summary),
      hasNext: document.select(HTML_SELECTORS.list.next).length > 0,
    };
  };

  const release = (element: HtmlElement): Release => {
    const publishedAt = element.attr("data-published-at");
    return {
      id: attrOf(element, "data-release-id"),
      group: textIn(element, HTML_SELECTORS.details.releaseGroup),
      ...(publishedAt === undefined ? {} : { publishedAt }),
    };
  };

  const chapter = (element: HtmlElement): Chapter => {
    const number = Number(attrOf(element, "data-numero"));
    return {
      id: attrOf(element, "data-chapter-id"),
      title: textIn(element, HTML_SELECTORS.details.chapterTitle),
      ...(Number.isFinite(number) ? { number } : {}),
      releases: element.select(HTML_SELECTORS.details.releases).map(release),
    };
  };

  /** Pares clave/valor de la lista de datos extra (`<dl>`). */
  const readExtra = (document: HtmlDocument): Record<string, string> => {
    const keys = textList(document, HTML_SELECTORS.details.extraKey);
    const values = textList(document, HTML_SELECTORS.details.extraValue);
    const extra: Record<string, string> = {};
    keys.forEach((key, index) => {
      const value = values[index];
      if (value !== undefined) {
        extra[key] = value;
      }
    });
    return extra;
  };

  return {
    popular: (page) => listing(withQuery(`${base}/popular`, { page: String(page) })),
    latest: (page) => listing(withQuery(`${base}/latest`, { page: String(page) })),
    search: (query, page) => listing(withQuery(`${base}/search`, { q: query, page: String(page) })),
    details: async (seriesId) => {
      const url = `${base}/serie/${encodeURIComponent(seriesId)}`;
      const document = host.html(await readText(host, url));
      return {
        id: seriesId,
        title: textIn(document, HTML_SELECTORS.details.title),
        cover: { url: attrIn(document, HTML_SELECTORS.details.cover, "src") },
        description: textIn(document, HTML_SELECTORS.details.description),
        genres: textList(document, HTML_SELECTORS.details.genres),
        altTitles: textList(document, HTML_SELECTORS.details.altTitles),
        status: attrIn(document, HTML_SELECTORS.details.status, "data-estado") as SeriesStatus,
        extra: readExtra(document),
        chapters: document.select(HTML_SELECTORS.details.chapters).map(chapter),
      };
    },
    pages: async (chapterId, releaseId) => {
      const url = `${base}/leer/${encodeURIComponent(chapterId)}/${encodeURIComponent(releaseId)}`;
      const document = host.html(await readText(host, url));
      const urls = document
        .select(HTML_SELECTORS.pages.images)
        .map((image) => attrOf(image, "src"));
      if (urls.length === 0) {
        throw new Error(`No se encontró ninguna imagen en ${url}`);
      }
      return { images: toImageRefs(urls, site.imageHeaders) };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Arquitectura JSON (sin selectores + paginación por cursor)          */
/* ------------------------------------------------------------------ */

function createJsonApi(host: Host, site: ExampleScriptSite): ModuleApi {
  const base = site.baseUrl;

  const listing = async (
    path: string,
    page: number,
    params: Record<string, string> = {},
  ): Promise<Page<SeriesSummary>> => {
    const url = withQuery(`${base}${path}`, {
      ...params,
      cursor: page <= 1 ? "" : `c${page}`,
    });
    const payload = (await readJson(host, url)) as {
      items?: SeriesSummary[];
      next?: string | null;
    };
    return { items: payload.items ?? [], hasNext: (payload.next ?? null) !== null };
  };

  return {
    popular: (page) => listing("/api/popular", page),
    latest: (page) => listing("/api/latest", page),
    search: (query, page) => listing("/api/search", page, { q: query }),
    details: async (seriesId) => {
      const url = `${base}/api/series/${encodeURIComponent(seriesId)}`;
      return (await readJson(host, url)) as SeriesDetails;
    },
    pages: async (chapterId, releaseId) => {
      const url = `${base}/api/pages/${encodeURIComponent(chapterId)}/${encodeURIComponent(releaseId)}`;
      const payload = (await readJson(host, url)) as { images?: ImageRef[] };
      const urls = (payload.images ?? []).map((image) => image.url);
      if (urls.length === 0) {
        throw new Error(`No se encontró ninguna imagen en ${url}`);
      }
      return { images: toImageRefs(urls, site.imageHeaders) };
    },
  };
}

/* ------------------------------------------------------------------ */
/* Fábrica                                                             */
/* ------------------------------------------------------------------ */

/** Construye la fábrica `create(host)` de un módulo script de ejemplo para `site`. */
export function createExampleScript(site: ExampleScriptSite): ScriptFactory {
  return (host: Host): ModuleApi =>
    site.architecture === "html" ? createHtmlApi(host, site) : createJsonApi(host, site);
}

/** Módulo de ejemplo sobre el sitio **HTML** (selectores y paginación por número). */
export const EXAMPLE_SCRIPT_HTML: ScriptFactory = createExampleScript({
  baseUrl: HTML_SITE_BASE_URL,
  architecture: "html",
});

/** Módulo de ejemplo sobre el sitio **JSON** (cursor) que exige cabeceras en las imágenes. */
export const EXAMPLE_SCRIPT_JSON: ScriptFactory = createExampleScript({
  baseUrl: JSON_API_BASE_URL,
  architecture: "json",
  imageHeaders: JSON_API_IMAGE_HEADERS,
});
