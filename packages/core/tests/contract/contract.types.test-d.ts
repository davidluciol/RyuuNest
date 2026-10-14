// Comprobaciones de tipos del contrato (SPEC §6). No se ejecuta: lo verifica `tsc`
// a través de `tsconfig.test.json`. Si un `@ts-expect-error` deja de fallar,
// el `typecheck` falla.
import type {
  Chapter,
  ChapterPages,
  Host,
  ImageRef,
  MediaKind,
  ModuleApi,
  ModuleManifest,
  Page,
  Release,
  SeriesDetails,
  SeriesSummary,
} from "../../src/contract/types";

// MediaKind admite los cuatro tipos de obra, incluido manhwa (D-13).
export const kinds: MediaKind[] = ["manga", "manhua", "manhwa", "comic"];

// @ts-expect-error "webtoon" no es un MediaKind del contrato
export const invalidKind: MediaKind = "webtoon";

export const page: Page<SeriesSummary> = { items: [], hasNext: false };
export const image: ImageRef = { url: "https://ejemplo.com/1.jpg" };
export const release: Release = { id: "r1" };
export const chapter: Chapter = { id: "c1", title: "Capítulo 1", releases: [release] };
export const summary: SeriesSummary = { id: "s1", title: "Serie" };
export const details: SeriesDetails = {
  ...summary,
  genres: [],
  status: "ongoing",
  altTitles: [],
  extra: {},
  chapters: [chapter],
};
export const chapterPages: ChapterPages = { images: [image] };

export const manifest: ModuleManifest = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "script",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  baseUrl: "https://ejemplo.com",
  capabilities: ["popular"],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.js",
};

// @ts-expect-error apiVersion solo admite el literal 1
export const invalidManifest: ModuleManifest = { ...manifest, apiVersion: 2 };

export const api: ModuleApi = {
  search: async () => page,
  details: async () => details,
  pages: async () => chapterPages,
};

export declare const host: Host;
