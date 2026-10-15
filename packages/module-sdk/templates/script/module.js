/**
 * Módulo de ejemplo de RyuuNest — runtime `script` (SPEC §6.5).
 *
 * Solo usa `host.*` (los permisos, el tiempo límite y la concurrencia los aplica el
 * host): no hace red por su cuenta ni toca APIs de plataforma. Trae los selectores
 * del sitio falso de pruebas, así que `ryuunest-module test` funciona tal cual.
 */
const BASE_URL = "{{baseUrl}}";

const SELECTORS = {
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
    cover: "img.detalle-portada",
    description: "p.detalle-descripcion",
    genres: "ul.detalle-generos > li.genero",
    altTitles: "ul.detalle-titulos-alt > li.titulo-alt",
    status: "span.detalle-estado",
    chapters: "ul.capitulos > li.capitulo",
    chapterTitle: "span.capitulo-titulo",
    releases: "ul.releases > li.release",
    releaseGroup: "span.release-grupo",
  },
  pages: "div.lector > img.pagina",
};

function textOf(elements) {
  const first = elements[0];
  return first === undefined ? "" : first.text().trim();
}

function attrOf(elements, name) {
  const first = elements[0];
  return first === undefined ? "" : first.attr(name) || "";
}

async function getDocument(host, path) {
  const response = await host.fetch(BASE_URL + path);
  if (response.status !== 200) {
    throw new Error(`El sitio respondió ${response.status} a ${path}`);
  }
  return host.html(await response.text());
}

async function listPage(host, path) {
  const doc = await getDocument(host, path);
  const items = doc.select(SELECTORS.list.items).map((card) => {
    const cover = attrOf(card.select(SELECTORS.list.cover), "src");
    return {
      id: attrOf(card.select(SELECTORS.list.link), "href").replace(/^\/serie\//, ""),
      title: textOf(card.select(SELECTORS.list.title)),
      cover: cover === "" ? undefined : { url: cover },
      kind: textOf(card.select(SELECTORS.list.kind)) || undefined,
      hint: textOf(card.select(SELECTORS.list.hint)) || undefined,
    };
  });

  return { items, hasNext: doc.select(SELECTORS.list.next).length > 0 };
}

async function detailsOf(host, seriesId) {
  const doc = await getDocument(host, `/serie/${seriesId}`);
  const root = doc.select(SELECTORS.details.root)[0];
  if (root === undefined) {
    throw new Error(`No se encontró la serie ${seriesId}`);
  }

  const cover = attrOf(root.select(SELECTORS.details.cover), "src");
  const chapters = root.select(SELECTORS.details.chapters).map((chapter) => ({
    id: chapter.attr("data-chapter-id") || "",
    title: textOf(chapter.select(SELECTORS.details.chapterTitle)),
    number: Number(chapter.attr("data-numero") || "0"),
    releases: chapter.select(SELECTORS.details.releases).map((release) => {
      const publishedAt = release.attr("data-published-at") || "";
      return {
        id: release.attr("data-release-id") || "",
        group: textOf(release.select(SELECTORS.details.releaseGroup)) || undefined,
        publishedAt: publishedAt === "" ? undefined : publishedAt,
      };
    }),
  }));

  return {
    id: root.attr("data-serie-id") || seriesId,
    title: textOf(root.select(SELECTORS.details.title)),
    cover: cover === "" ? undefined : { url: cover },
    description: textOf(root.select(SELECTORS.details.description)) || undefined,
    genres: root
      .select(SELECTORS.details.genres)
      .map((element) => element.text().trim())
      .filter(Boolean),
    altTitles: root.select(SELECTORS.details.altTitles).map((element) => element.text().trim()),
    status: attrOf(root.select(SELECTORS.details.status), "data-estado") || "unknown",
    extra: {},
    chapters,
  };
}

async function pagesOf(host, chapterId, releaseId) {
  const doc = await getDocument(host, `/leer/${chapterId}/${releaseId}`);
  return {
    images: doc.select(SELECTORS.pages).map((image) => ({ url: image.attr("src") || "" })),
  };
}

/** Fábrica del módulo (SPEC §6.5). El host aplica permisos y límites. */
export default function create(host) {
  return {
    popular: (page) => listPage(host, `/popular?page=${page}`),
    latest: (page) => listPage(host, `/latest?page=${page}`),
    search: (query, page) => listPage(host, `/search?q=${encodeURIComponent(query)}&page=${page}`),
    details: (seriesId) => detailsOf(host, seriesId),
    pages: (chapterId, releaseId) => pagesOf(host, chapterId, releaseId),
  };
}
