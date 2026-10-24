/**
 * Arnés de contrato (T10): ejecuta cualquier `ModuleApi` contra las fixtures y
 * comprueba los cinco métodos del contrato (SPEC §6.3).
 *
 * Lo usan las pruebas de contrato del núcleo (T17, T19) y el comando `test` del
 * CLI del SDK (T11). Cada fallo lanza `ContractError` con un mensaje concreto, así
 * que un módulo roto se detecta con una causa legible.
 */
import type { ImageRef, ModuleApi, Page, SeriesDetails, SeriesSummary } from "@ryuunest/core";

import { FIXTURE_DEFAULTS } from "./fixtures.js";

/** Fallo de contrato: el módulo no cumple lo que promete el SPEC §6.3. */
export class ContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContractError";
  }
}

export interface ContractHarnessOptions {
  /** Capacidades declaradas por el módulo que exigen método (SPEC §6.1). */
  capabilities?: ReadonlyArray<"popular" | "latest" | "search">;
  seriesId?: string;
  chapterId?: string;
  releaseIds?: readonly string[];
  searchQuery?: string;
  /** Si se indica, cada imagen debe llevar estas cabeceras (RF-24). */
  expectImageHeaders?: Readonly<Record<string, string>>;
  /**
   * El sitio no informa de si hay más páginas y el módulo estima `hasNext` (true mientras
   * la página traiga series). Se sigue exigiendo que la página 1 traiga series, pero la
   * página 2 puede venir vacía o seguir marcando `hasNext`.
   */
  estimatedHasNext?: boolean;
}

/** Qué se comprobó y con qué datos. */
export interface ContractReport {
  /** Métodos ejercitados, en orden. */
  methods: string[];
  seriesId: string;
  chapterId: string;
  releaseIds: string[];
  /** Número de imágenes devueltas por `pages()`, un valor por release. */
  imageCounts: number[];
}

/** Métodos que todo módulo debe implementar (SPEC §6.3). */
const REQUIRED_METHODS = ["search", "details", "pages"] as const;

export async function runContract(
  api: unknown,
  options: ContractHarnessOptions = {},
): Promise<ContractReport> {
  if (api === null || typeof api !== "object") {
    throw new ContractError(
      "El módulo no es un objeto: se esperaba una implementación de ModuleApi",
    );
  }

  const methods = api as Record<string, unknown>;
  const required = new Set<string>([...REQUIRED_METHODS, ...(options.capabilities ?? [])]);
  const missing = [...required].filter((name) => typeof methods[name] !== "function");
  if (missing.length > 0) {
    throw new ContractError(
      `El módulo no implementa ${missing.map((name) => `${name}()`).join(", ")}`,
    );
  }

  const moduleApi = api as ModuleApi;
  const seriesId = options.seriesId ?? FIXTURE_DEFAULTS.seriesId;
  const chapterId = options.chapterId ?? FIXTURE_DEFAULTS.chapterId;
  const releaseIds = options.releaseIds ?? FIXTURE_DEFAULTS.releaseIds;
  const searchQuery = options.searchQuery ?? FIXTURE_DEFAULTS.searchQuery;
  const exercised: string[] = [];

  const estimated = options.estimatedHasNext === true;

  const popular = moduleApi.popular;
  if (popular !== undefined) {
    await checkListing("popular", popular, estimated);
    exercised.push("popular");
  }

  const latest = moduleApi.latest;
  if (latest !== undefined) {
    await checkListing("latest", latest, estimated);
    exercised.push("latest");
  }

  await checkListing("search", (page) => moduleApi.search(searchQuery, page), estimated);
  exercised.push("search");

  const details = await moduleApi.details(seriesId);
  assertDetails(seriesId, details);
  exercised.push("details");

  const imageCounts: number[] = [];
  for (const releaseId of releaseIds) {
    const chapterPages = await moduleApi.pages(chapterId, releaseId);
    const images: unknown = chapterPages?.images;
    assertImages(chapterId, releaseId, images);
    if (options.expectImageHeaders !== undefined) {
      assertImageHeaders(chapterId, releaseId, images, options.expectImageHeaders);
    }
    imageCounts.push(images.length);
  }
  exercised.push("pages");

  return { methods: exercised, seriesId, chapterId, releaseIds: [...releaseIds], imageCounts };
}

async function checkListing(
  name: string,
  run: (page: number) => Promise<Page<SeriesSummary>>,
  estimatedHasNext: boolean,
): Promise<void> {
  const first = await run(1);
  assertPage(name, first);
  if (first.items.length === 0) {
    throw new ContractError(`${name}(1) no devolvió ninguna serie`);
  }
  if (!first.hasNext) {
    return;
  }

  const second = await run(2);
  assertPage(name, second);
  if (estimatedHasNext) {
    return;
  }
  if (second.items.length === 0) {
    throw new ContractError(`${name}(2) no devolvió ninguna serie`);
  }
  if (second.hasNext) {
    throw new ContractError(`${name}(2) debería ser la última página (hasNext === false)`);
  }
}

function assertPage(name: string, page: Page<SeriesSummary> | undefined): void {
  if (page === null || page === undefined || typeof page !== "object") {
    throw new ContractError(`${name}() no devolvió una Page`);
  }
  if (!Array.isArray(page.items)) {
    throw new ContractError(`${name}().items debe ser una lista`);
  }
  if (typeof page.hasNext !== "boolean") {
    throw new ContractError(`${name}().hasNext debe ser un booleano`);
  }

  page.items.forEach((item, index) => {
    if (typeof item?.id !== "string" || item.id === "") {
      throw new ContractError(`${name}().items[${index}].id está vacío`);
    }
    if (typeof item.title !== "string" || item.title === "") {
      throw new ContractError(`${name}().items[${index}].title está vacío`);
    }
    if (item.cover !== undefined && (typeof item.cover.url !== "string" || item.cover.url === "")) {
      throw new ContractError(`${name}().items[${index}].cover.url está vacío`);
    }
  });
}

function assertDetails(expectedId: string, details: SeriesDetails | undefined): void {
  if (details === null || details === undefined || typeof details !== "object") {
    throw new ContractError(`details("${expectedId}") no devolvió una serie`);
  }
  if (details.id !== expectedId) {
    throw new ContractError(`details("${expectedId}") devolvió el id "${String(details.id)}"`);
  }
  if (typeof details.title !== "string" || details.title === "") {
    throw new ContractError(`details("${expectedId}").title está vacío`);
  }
  if (!Array.isArray(details.genres)) {
    throw new ContractError(`details("${expectedId}").genres debe ser una lista`);
  }
  if (!Array.isArray(details.altTitles)) {
    throw new ContractError(`details("${expectedId}").altTitles debe ser una lista`);
  }
  if (typeof details.status !== "string") {
    throw new ContractError(`details("${expectedId}").status debe ser una cadena`);
  }
  if (details.extra === null || typeof details.extra !== "object" || Array.isArray(details.extra)) {
    throw new ContractError(`details("${expectedId}").extra debe ser un objeto`);
  }
  if (!Array.isArray(details.chapters) || details.chapters.length === 0) {
    throw new ContractError(`details("${expectedId}") no trajo capítulos`);
  }

  details.chapters.forEach((chapter, index) => {
    if (typeof chapter?.id !== "string" || chapter.id === "") {
      throw new ContractError(`details("${expectedId}").chapters[${index}].id está vacío`);
    }
    if (typeof chapter.title !== "string" || chapter.title === "") {
      throw new ContractError(`details("${expectedId}").chapters[${index}].title está vacío`);
    }
    if (!Array.isArray(chapter.releases) || chapter.releases.length === 0) {
      throw new ContractError(
        `details("${expectedId}").chapters[${index}] no tiene ninguna release`,
      );
    }
    chapter.releases.forEach((release, releaseIndex) => {
      if (typeof release?.id !== "string" || release.id === "") {
        throw new ContractError(
          `details("${expectedId}").chapters[${index}].releases[${releaseIndex}].id está vacío`,
        );
      }
    });
  });

  if (!details.chapters.some((chapter) => chapter.releases.length >= 2)) {
    throw new ContractError(
      `details("${expectedId}") debe traer al menos un capítulo con dos releases`,
    );
  }
}

function assertImages(
  chapterId: string,
  releaseId: string,
  images: unknown,
): asserts images is ImageRef[] {
  if (!Array.isArray(images) || images.length === 0) {
    throw new ContractError(`pages("${chapterId}", "${releaseId}") no devolvió imágenes`);
  }
  images.forEach((image, index) => {
    const url = (image as { url?: unknown }).url;
    if (typeof url !== "string" || url === "") {
      throw new ContractError(
        `pages("${chapterId}", "${releaseId}").images[${index}].url está vacío`,
      );
    }
  });
}

function assertImageHeaders(
  chapterId: string,
  releaseId: string,
  images: readonly ImageRef[],
  expected: Readonly<Record<string, string>>,
): void {
  images.forEach((image, index) => {
    for (const [key, value] of Object.entries(expected)) {
      if (image.headers?.[key] !== value) {
        throw new ContractError(
          `pages("${chapterId}", "${releaseId}").images[${index}] no lleva la cabecera ${key}: ${value}`,
        );
      }
    }
  });
}
