/**
 * Dos sitios falsos con **arquitecturas opuestas** (`plan.md` §8):
 *
 * - **HTML** (`HTML_SITE_BASE_URL`): listado con selectores CSS y paginación por
 *   número de página (`?page=`). Es la base del módulo declarativo (T16).
 * - **JSON** (`JSON_API_BASE_URL`): respuestas JSON y paginación por **cursor**
 *   (`?cursor=`), sin selectores. Solo un módulo script puede consumirla (T32).
 *
 * Ambos se derivan del mismo conjunto de fixtures, así que devuelven los mismos
 * datos. `createSiteHttp()` los sirve detrás del puerto `Http` del núcleo.
 */
import type { Http, HttpRequest, HttpResponse } from "@ryuunest/core";

import {
  FIXTURE_SERIES,
  searchFixtureSeries,
  type FixtureChapter,
  type FixtureSeries,
} from "./fixtures.js";

export type SiteName = "html" | "json-api";

/** Una ruta servida por un sitio falso. */
export interface TestRoute {
  path: string;
  /** Si se declara, cada par debe coincidir con la consulta de la petición. */
  query?: Record<string, string>;
  status?: number;
  contentType?: string;
  /** Cuerpo fijo. Se ignora si hay `handler`. */
  body?: string;
  /** Cuerpo calculado a partir de la consulta de la petición. */
  handler?: (query: Record<string, string>) => string;
}

/** Un sitio falso: origen, rutas y nombre de la arquitectura. */
export interface TestSite {
  name: SiteName;
  origin: string;
  baseUrl: string;
  routes: TestRoute[];
}

export const HTML_SITE_BASE_URL = "https://sitio-html.test";
export const JSON_API_BASE_URL = "https://api-json.test";

const HTML_CONTENT_TYPE = "text/html; charset=utf-8";
const JSON_CONTENT_TYPE = "application/json; charset=utf-8";
const LIST_PAGE_SIZE = 3;

/** Cabeceras que el sitio JSON exige al pedir sus imágenes. */
export const JSON_API_IMAGE_HEADERS: Readonly<Record<string, string>> = {
  Referer: `${JSON_API_BASE_URL}/lector`,
  "User-Agent": "RyuuNest/0.0 (test-site)",
};

/** Selectores del sitio HTML, documentados para los módulos declarativos. */
export const HTML_SELECTORS = {
  list: {
    items: "ul.serie-list > li.serie-card",
    link: "a.serie-link",
    title: "h3.serie-title",
    cover: "img.serie-cover",
    kind: "span.serie-kind",
    hint: "span.serie-hint",
    next: "nav.pager a.next",
  },
  details: {
    root: "article.serie-detalle",
    title: "h1.detalle-titulo",
    description: "p.detalle-descripcion",
    cover: "img.detalle-portada",
    genres: "ul.detalle-generos > li.genero",
    altTitles: "ul.detalle-titulos-alt > li.titulo-alt",
    status: "span.detalle-estado",
    extraKey: "dl.detalle-extra > dt.extra-clave",
    extraValue: "dl.detalle-extra > dd.extra-valor",
    chapters: "ul.capitulos > li.capitulo",
    chapterNumber: "span.capitulo-numero",
    chapterTitle: "span.capitulo-titulo",
    releases: "ul.releases > li.release",
    releaseGroup: "span.release-grupo",
  },
  pages: {
    root: "div.lector",
    images: "div.lector > img.pagina",
  },
} as const;

/* ------------------------------------------------------------------ */
/* Utilidades internas                                                 */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const value = Number(raw ?? fallback);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function readCursor(raw: string | undefined): number {
  const match = /^c(\d+)$/.exec(raw ?? "");
  return match === null ? 1 : readPositiveInt(match[1], 1);
}

function imageUrlsFor(
  origin: string,
  seriesId: string,
  chapter: FixtureChapter,
  releaseId: string,
): string[] {
  const count = 2 + (chapter.number % 3);
  return Array.from(
    { length: count },
    (_value, index) => `${origin}/img/${seriesId}-${chapter.id}-${releaseId}-${index + 1}.svg`,
  );
}

function statusLabel(status: FixtureSeries["status"]): string {
  const labels: Record<FixtureSeries["status"], string> = {
    ongoing: "En curso",
    completed: "Completa",
    hiatus: "En pausa",
    cancelled: "Cancelada",
    unknown: "Sin estado",
  };
  return labels[status];
}

/* ------------------------------------------------------------------ */
/* Arquitectura A · HTML con paginación numérica                       */
/* ------------------------------------------------------------------ */

function renderListPage(
  seriesList: readonly FixtureSeries[],
  origin: string,
  nextHref: string | undefined,
): string {
  const cards = seriesList
    .map((series) =>
      [
        '      <li class="serie-card">',
        `        <a class="serie-link" href="/serie/${series.id}">`,
        `          <img class="serie-cover" src="${origin}${series.cover.url}" alt="">`,
        `          <h3 class="serie-title">${escapeHtml(series.title)}</h3>`,
        "        </a>",
        `        <span class="serie-kind">${series.kind}</span>`,
        `        <span class="serie-hint">${escapeHtml(series.hint)}</span>`,
        "      </li>",
      ].join("\n"),
    )
    .join("\n");

  const pager =
    nextHref === undefined
      ? ""
      : `    <nav class="pager"><a class="next" href="${nextHref}">Siguiente</a></nav>`;

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Catálogo de ejemplo</title>
  </head>
  <body>
    <ul class="serie-list">
${cards}
    </ul>
${pager}
  </body>
</html>
`;
}

function htmlListBody(
  seriesList: readonly FixtureSeries[],
  origin: string,
  path: string,
  query: Record<string, string>,
): string {
  const page = readPositiveInt(query["page"], 1);
  const start = (page - 1) * LIST_PAGE_SIZE;
  const slice = seriesList.slice(start, start + LIST_PAGE_SIZE);
  const hasNext = start + LIST_PAGE_SIZE < seriesList.length;
  const nextHref = hasNext ? withQuery(path, { ...query, page: String(page + 1) }) : undefined;
  return renderListPage(slice, origin, nextHref);
}

function renderDetailPage(series: FixtureSeries, origin: string): string {
  const genres = series.genres
    .map((genre) => `        <li class="genero">${escapeHtml(genre)}</li>`)
    .join("\n");
  const altTitles = series.altTitles
    .map((altTitle) => `        <li class="titulo-alt">${escapeHtml(altTitle)}</li>`)
    .join("\n");
  const chapters = series.chapters
    .map((chapter) => {
      const releases = chapter.releases
        .map(
          (release) =>
            `            <li class="release" data-release-id="${release.id}" data-group="${escapeHtml(release.group)}" data-published-at="${release.publishedAt}">` +
            `<span class="release-grupo">${escapeHtml(release.group)}</span></li>`,
        )
        .join("\n");
      return [
        `      <li class="capitulo" data-chapter-id="${chapter.id}" data-numero="${chapter.number}">`,
        `        <span class="capitulo-numero">${chapter.number}</span>`,
        `        <span class="capitulo-titulo">${escapeHtml(chapter.title)}</span>`,
        '        <ul class="releases">',
        releases,
        "        </ul>",
        "      </li>",
      ].join("\n");
    })
    .join("\n");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(series.title)}</title>
  </head>
  <body>
    <article class="serie-detalle" data-serie-id="${series.id}">
      <img class="detalle-portada" src="${origin}${series.cover.url}" alt="">
      <h1 class="detalle-titulo">${escapeHtml(series.title)}</h1>
      <p class="detalle-descripcion">${escapeHtml(series.description)}</p>
      <ul class="detalle-generos">
${genres}
      </ul>
      <ul class="detalle-titulos-alt">
${altTitles}
      </ul>
      <span class="detalle-estado" data-estado="${series.status}">${escapeHtml(statusLabel(series.status))}</span>
      <dl class="detalle-extra">
        <dt class="extra-clave">Origen</dt>
        <dd class="extra-valor">${series.kind}</dd>
      </dl>
      <ul class="capitulos">
${chapters}
      </ul>
    </article>
  </body>
</html>
`;
}

function renderPagesPage(chapterId: string, releaseId: string, images: readonly string[]): string {
  const tags = images
    .map((url, index) => `      <img class="pagina" data-index="${index}" src="${url}" alt="">`)
    .join("\n");

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <title>Lector</title>
  </head>
  <body>
    <div class="lector" data-chapter-id="${chapterId}" data-release-id="${releaseId}">
${tags}
    </div>
  </body>
</html>
`;
}

/** Sitio falso A: HTML con selectores y paginación por número de página. */
export function createHtmlSite(): TestSite {
  const origin = HTML_SITE_BASE_URL;
  const routes: TestRoute[] = [
    {
      path: "/popular",
      contentType: HTML_CONTENT_TYPE,
      handler: (query) => htmlListBody(FIXTURE_SERIES, origin, "/popular", query),
    },
    {
      path: "/latest",
      contentType: HTML_CONTENT_TYPE,
      handler: (query) => htmlListBody([...FIXTURE_SERIES].reverse(), origin, "/latest", query),
    },
    {
      path: "/search",
      contentType: HTML_CONTENT_TYPE,
      handler: (query) =>
        htmlListBody(searchFixtureSeries(query["q"] ?? ""), origin, "/search", query),
    },
  ];

  for (const series of FIXTURE_SERIES) {
    routes.push({
      path: `/serie/${series.id}`,
      contentType: HTML_CONTENT_TYPE,
      handler: () => renderDetailPage(series, origin),
    });

    for (const chapter of series.chapters) {
      for (const release of chapter.releases) {
        routes.push({
          path: `/leer/${chapter.id}/${release.id}`,
          contentType: HTML_CONTENT_TYPE,
          handler: () =>
            renderPagesPage(
              chapter.id,
              release.id,
              imageUrlsFor(origin, series.id, chapter, release.id),
            ),
        });
      }
    }
  }

  return { name: "html", origin, baseUrl: origin, routes };
}

/* ------------------------------------------------------------------ */
/* Arquitectura B · JSON con paginación por cursor                     */
/* ------------------------------------------------------------------ */

function apiSummary(series: FixtureSeries, origin: string): Record<string, unknown> {
  return {
    id: series.id,
    title: series.title,
    cover: { url: `${origin}${series.cover.url}` },
    kind: series.kind,
    nsfw: series.nsfw,
    badges: series.badges,
    hint: series.hint,
  };
}

function jsonListBody(
  seriesList: readonly FixtureSeries[],
  origin: string,
  query: Record<string, string>,
): string {
  const page = readCursor(query["cursor"]);
  const start = (page - 1) * LIST_PAGE_SIZE;
  const slice = seriesList.slice(start, start + LIST_PAGE_SIZE);
  const hasNext = start + LIST_PAGE_SIZE < seriesList.length;
  return JSON.stringify(
    {
      items: slice.map((series) => apiSummary(series, origin)),
      next: hasNext ? `c${page + 1}` : null,
    },
    null,
    2,
  );
}

function jsonDetailBody(series: FixtureSeries, origin: string): string {
  return JSON.stringify(
    {
      ...apiSummary(series, origin),
      description: series.description,
      genres: series.genres,
      status: series.status,
      altTitles: series.altTitles,
      extra: { Origen: series.kind },
      chapters: series.chapters.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        number: chapter.number,
        releases: chapter.releases,
      })),
    },
    null,
    2,
  );
}

function jsonPagesBody(title: string, images: readonly string[]): string {
  return JSON.stringify(
    {
      title,
      images: images.map((url) => ({ url, headers: { ...JSON_API_IMAGE_HEADERS } })),
    },
    null,
    2,
  );
}

/** Sitio falso B: JSON con paginación por cursor y cabeceras de imagen. */
export function createJsonApiSite(): TestSite {
  const origin = JSON_API_BASE_URL;
  const routes: TestRoute[] = [
    {
      path: "/api/popular",
      contentType: JSON_CONTENT_TYPE,
      handler: (query) => jsonListBody(FIXTURE_SERIES, origin, query),
    },
    {
      path: "/api/latest",
      contentType: JSON_CONTENT_TYPE,
      handler: (query) => jsonListBody([...FIXTURE_SERIES].reverse(), origin, query),
    },
    {
      path: "/api/search",
      contentType: JSON_CONTENT_TYPE,
      handler: (query) => jsonListBody(searchFixtureSeries(query["q"] ?? ""), origin, query),
    },
  ];

  for (const series of FIXTURE_SERIES) {
    routes.push({
      path: `/api/series/${series.id}`,
      contentType: JSON_CONTENT_TYPE,
      handler: () => jsonDetailBody(series, origin),
    });

    for (const chapter of series.chapters) {
      for (const release of chapter.releases) {
        routes.push({
          path: `/api/pages/${chapter.id}/${release.id}`,
          contentType: JSON_CONTENT_TYPE,
          handler: () =>
            jsonPagesBody(chapter.title, imageUrlsFor(origin, series.id, chapter, release.id)),
        });
      }
    }
  }

  return { name: "json-api", origin, baseUrl: origin, routes };
}

/* ------------------------------------------------------------------ */
/* Servidor de prueba                                                  */
/* ------------------------------------------------------------------ */

interface ParsedUrl {
  origin: string;
  path: string;
  query: Record<string, string>;
}

function parseQuery(rawQuery: string | undefined): Record<string, string> {
  const query: Record<string, string> = {};
  if (rawQuery === undefined || rawQuery === "") {
    return query;
  }
  for (const pair of rawQuery.split("&")) {
    const separator = pair.indexOf("=");
    const key = separator === -1 ? pair : pair.slice(0, separator);
    const value = separator === -1 ? "" : pair.slice(separator + 1);
    query[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return query;
}

function parseUrl(url: string): ParsedUrl | undefined {
  const match = /^(https?):\/\/([^/?#\s]+)([^?#]*)(?:\?([^#]*))?/.exec(url);
  if (match === null) {
    return undefined;
  }
  const rawPath = match[3] ?? "";
  return {
    origin: `${match[1] ?? ""}://${match[2] ?? ""}`,
    path: rawPath === "" ? "/" : rawPath,
    query: parseQuery(match[4]),
  };
}

function matchesRoute(route: TestRoute, parsed: ParsedUrl): boolean {
  if (route.path !== parsed.path) {
    return false;
  }
  if (route.query === undefined) {
    return true;
  }
  return Object.entries(route.query).every(([key, value]) => parsed.query[key] === value);
}

/** Sirve un `TestSite` detrás del puerto `Http`. Responde 404 si no hay ruta. */
export class TestSiteHttp implements Http {
  constructor(private readonly site: TestSite) {}

  async request(url: string, _init?: HttpRequest): Promise<HttpResponse> {
    const parsed = parseUrl(url);
    const route =
      parsed === undefined
        ? undefined
        : this.site.routes.find((candidate) => matchesRoute(candidate, parsed));

    if (parsed === undefined || parsed.origin !== this.site.origin || route === undefined) {
      return { status: 404, headers: {}, text: async () => "" };
    }

    const body = route.handler !== undefined ? route.handler(parsed.query) : (route.body ?? "");
    return {
      status: route.status ?? 200,
      headers: { "content-type": route.contentType ?? "text/plain; charset=utf-8" },
      text: async () => body,
    };
  }
}

export function createSiteHttp(site: TestSite): TestSiteHttp {
  return new TestSiteHttp(site);
}
