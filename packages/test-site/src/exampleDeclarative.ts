/**
 * Módulo declarativo de ejemplo, apuntando al **sitio falso HTML** de este paquete
 * (SPEC §6.6). Es la configuración con la que el núcleo prueba el runtime declarativo
 * (T17) y con la que el CLI del SDK puede probar la plantilla.
 *
 * Se publica como constante TypeScript (no como `.json`) para que el núcleo, que no
 * tiene tipos de Node, pueda consumirla sin leer ficheros; el formato sigue siendo el
 * mismo `index.json` que genera la plantilla (`packages/module-sdk/templates`).
 */
import type { DeclarativeConfig, DeclarativeFieldSpec } from "@ryuunest/core";

import { HTML_SELECTORS } from "./sites.js";

const listFields: Record<string, DeclarativeFieldSpec> = {
  id: { selector: HTML_SELECTORS.list.link, attr: "href", transform: ["path"] },
  title: { selector: HTML_SELECTORS.list.title, transform: ["trim"] },
  cover: { selector: HTML_SELECTORS.list.cover, attr: "src", transform: ["absoluteUrl"] },
  kind: { selector: HTML_SELECTORS.list.kind, transform: ["trim"] },
  hint: { selector: HTML_SELECTORS.list.hint, transform: ["trim"] },
};

export const EXAMPLE_DECLARATIVE: Required<DeclarativeConfig> = {
  popular: {
    url: "{baseUrl}/popular?page={page}",
    list: HTML_SELECTORS.list.items,
    fields: listFields,
    hasNext: { selector: HTML_SELECTORS.list.next, exists: true },
  },
  latest: {
    url: "{baseUrl}/latest?page={page}",
    list: HTML_SELECTORS.list.items,
    fields: listFields,
    hasNext: { selector: HTML_SELECTORS.list.next, exists: true },
  },
  search: {
    url: "{baseUrl}/search?q={query}&page={page}",
    list: HTML_SELECTORS.list.items,
    fields: listFields,
    hasNext: { selector: HTML_SELECTORS.list.next, exists: true },
  },
  details: {
    url: "{baseUrl}/serie/{id}",
    fields: {
      title: { selector: HTML_SELECTORS.details.title, transform: ["trim"] },
      cover: { selector: HTML_SELECTORS.details.cover, attr: "src", transform: ["absoluteUrl"] },
      description: { selector: HTML_SELECTORS.details.description, transform: ["trim"] },
      genres: { selector: HTML_SELECTORS.details.genres, all: true, transform: ["trim"] },
      altTitles: {
        selector: HTML_SELECTORS.details.altTitles,
        all: true,
        transform: ["trim"],
      },
      status: { selector: HTML_SELECTORS.details.status, attr: "data-estado" },
    },
    chapters: {
      list: HTML_SELECTORS.details.chapters,
      fields: {
        id: { attr: "data-chapter-id" },
        title: { selector: HTML_SELECTORS.details.chapterTitle, transform: ["trim"] },
        number: { attr: "data-numero", transform: ["number"] },
      },
      releases: {
        list: HTML_SELECTORS.details.releases,
        fields: {
          id: { attr: "data-release-id" },
          group: { selector: HTML_SELECTORS.details.releaseGroup, transform: ["trim"] },
          publishedAt: { attr: "data-published-at" },
        },
      },
    },
  },
  pages: {
    url: "{baseUrl}/leer/{chapterId}/{releaseId}",
    images: {
      selector: HTML_SELECTORS.pages.images,
      attr: "src",
      transform: ["absoluteUrl"],
    },
  },
};
