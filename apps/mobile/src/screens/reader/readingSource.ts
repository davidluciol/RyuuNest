import type { ImageSourcePropType } from "react-native";
import {
  ChapterReadStore,
  Favorites,
  ModuleError,
  createFunctionScriptLoader,
  ProgressStore,
  SeriesPrefs,
  SeriesStore,
  type ImageRef,
  type Release,
  type SeriesDetails,
  type SqlDriver,
} from "@ryuunest/core";

import dragonMarker from "../../../assets/placeholder/dragon.svg";
import page1 from "../../../assets/placeholder/page-1.svg";
import page2 from "../../../assets/placeholder/page-2.svg";
import page3 from "../../../assets/placeholder/page-3.svg";
import { openAppDatabase } from "../../data/appDatabase";
import { isNativePlatform } from "../../data/backupFilesPort";
import { createFetchHttp } from "../../data/fetchHttp";
import { createInstalledMounter, type ModuleMounter } from "../../data/moduleMounter";
import { createSessionSqlDriver } from "../../data/sessionSqlDriver";
import { createSampleMounter } from "../discover/discoverData";
import type { SeriesViewData } from "../series/seriesFixtures";

/**
 * F18/F19 — capa de datos de la ficha y del lector. Una sola implementación sobre dos
 * entradas: el **montador** de módulos (instalados en el dispositivo; los de ejemplo sobre
 * `test-site` en web) y el **driver** (SQLite en el dispositivo; en memoria en web, P-79). La
 * pantalla no pregunta la plataforma: habla con `ReadingSource`.
 */

/** Una imagen de página: lo que dio el módulo y, solo en la web de ejemplo, su sustituto local. */
export interface ReaderImage extends ImageRef {
  /** Recurso empaquetado que reemplaza a `url` (marcadores de la web, sin red). */
  asset?: number;
}

export interface ReaderPages {
  title: string | null;
  images: ReaderImage[];
}

export interface ReadingSource {
  /** Base donde viven el progreso, los leídos y las preferencias de serie. */
  readonly driver: SqlDriver;
  /** Ficha de la serie con el progreso y los capítulos leídos (F17). */
  loadSeries(moduleId: string, seriesId: string): Promise<SeriesViewData>;
  /**
   * Corazón (F95): pasa la serie a «Favoritos» o, si ya estaba, a «Gemas» y devuelve el estado nuevo. Al marcar guarda antes la
   * serie en `series`: la biblioteca une `favorite` con `series` (P-126).
   */
  toggleFavorite(moduleId: string, seriesId: string, details: SeriesDetails): Promise<boolean>;
  /** Recuerda la release elegida (por su grupo; sin grupo, por su id) para toda la serie (F17). */
  setPreferredRelease(moduleId: string, seriesId: string, release: Release): Promise<void>;
  /** Páginas de un capítulo en una edición, con las cabeceras del módulo (RF-24). */
  loadPages(moduleId: string, chapterId: string, releaseId: string): Promise<ReaderPages>;
}

export interface ReadingSourceDeps {
  driver: SqlDriver;
  mounter: ModuleMounter;
  /** Portada local para la ficha de ejemplo; los datos reales usan `details.cover`. */
  coverSource?: ImageSourcePropType;
  /** Sustituye la imagen que dio el módulo (solo la web de ejemplo). */
  decorateImage?: (image: ImageRef, index: number) => ReaderImage;
  /** Datos que deben existir antes de la primera lectura (solo la web de ejemplo). */
  seed?: (driver: SqlDriver) => Promise<void>;
}

export function createReadingSource(deps: ReadingSourceDeps): ReadingSource {
  const { driver, mounter } = deps;
  const clock = { now: () => Date.now() };
  const progress = new ProgressStore({ driver, clock });
  const chaptersRead = new ChapterReadStore({ driver, clock });
  const favorites = new Favorites({ driver, clock });
  const seriesStore = new SeriesStore({ driver, clock });
  const prefs = new SeriesPrefs({ driver, clock });
  // Se arranca ya: la primera escritura del sembrado ocurre antes de que nadie más escriba.
  const seeded = deps.seed?.(driver) ?? Promise.resolve();

  return {
    driver,

    async loadSeries(moduleId, seriesId) {
      await seeded;
      const { handle, manifest } = await mounter.mount(moduleId);
      const details = await handle.api.details(seriesId);
      // Inicio («Continuar», Recientes) muestra el nombre y la portada de lo leído aunque no sea favorito.
      await seriesStore.saveFromDetails(moduleId, { ...details, id: seriesId });
      const [saved, read, favorite, pref] = await Promise.all([
        progress.get(moduleId, seriesId),
        chaptersRead.readIn(moduleId, seriesId),
        favorites.isHearted(moduleId, seriesId),
        prefs.get(moduleId, seriesId),
      ]);
      return {
        details,
        ...(deps.coverSource === undefined ? {} : { coverSource: deps.coverSource }),
        moduleName: manifest.name,
        progress:
          saved === undefined
            ? null
            : {
                chapterId: saved.chapterId,
                pageIndex: saved.pageIndex,
                pageTotal: saved.pageTotal ?? 0,
              },
        readChapterIds: read,
        preferredReleaseId: pref?.preferredGroup ?? null,
        favorite,
      };
    },

    async toggleFavorite(moduleId, seriesId, details) {
      if (!(await favorites.isHearted(moduleId, seriesId))) {
        await seriesStore.saveFromDetails(moduleId, { ...details, id: seriesId });
      }
      return favorites.toggleHeart(moduleId, seriesId);
    },

    async setPreferredRelease(moduleId, seriesId, release) {
      await prefs.setPreferredGroup(moduleId, seriesId, release.group ?? release.id);
    },

    async loadPages(moduleId, chapterId, releaseId) {
      const { handle } = await mounter.mount(moduleId);
      const pages = await handle.api.pages(chapterId, releaseId);
      if (pages.images.length === 0) {
        throw new ModuleError("PARSE", `El capítulo ${chapterId} no trae ninguna imagen`);
      }
      return {
        title: pages.title ?? null,
        images: pages.images.map((image, index) =>
          deps.decorateImage ? deps.decorateImage(image, index) : { ...image },
        ),
      };
    },
  };
}

// — Web: módulos de ejemplo sobre `test-site` con progreso en la sesión —

const SAMPLE_PAGE_ASSETS: readonly number[] = [page1, page2, page3];

/**
 * Datos de ejemplo coherentes (D1): `dragon-de-ceniza` lleva el capítulo 1 leído y el 2 a la
 * mitad (página 3 de 4, que son las que sirve el sitio falso).
 */
async function seedSample(driver: SqlDriver): Promise<void> {
  const clock = { now: () => Date.now() };
  await new ProgressStore({ driver, clock }).save({
    moduleId: "m-ejemplo-a",
    seriesId: "dragon-de-ceniza",
    chapterId: "ch-2",
    releaseId: "r-oficial",
    pageIndex: 2,
    pageTotal: 4,
  });
  await new ChapterReadStore({ driver, clock }).markRead({
    moduleId: "m-ejemplo-a",
    seriesId: "dragon-de-ceniza",
    chapterId: "ch-1",
  });
}

/**
 * Web: módulos de ejemplo sobre `test-site`. Sin `driver` (sin base de datos: pruebas) usa una
 * sesión en memoria con el progreso de ejemplo; con `driver` (la base real de la web, F49b) el
 * progreso es el que haya guardado quien usa la página.
 */
export function createSampleReadingSource(driver?: SqlDriver): ReadingSource {
  return createReadingSource({
    driver: driver ?? createSessionSqlDriver(),
    mounter: createSampleMounter(),
    coverSource: dragonMarker,
    decorateImage: (image, index) => ({
      ...image,
      asset: SAMPLE_PAGE_ASSETS[index % SAMPLE_PAGE_ASSETS.length] as number,
    }),
    ...(driver === undefined ? { seed: seedSample } : {}),
  });
}

// — Selección por plataforma —

let resolved: Promise<ReadingSource> | undefined;

/**
 * La fuente de la plataforma, compartida por la ficha y el lector: en el dispositivo, los
 * módulos instalados sobre `ryuunest.db`; en web los de ejemplo, con la base real (F49b) o, sin ella, con su
 * sesión en memoria. Se crea una vez para que el progreso sobreviva a cambiar de pantalla.
 */
export function resolveReadingSource(): Promise<ReadingSource> {
  resolved ??= openAppDatabase().then((driver) =>
    driver === null
      ? createSampleReadingSource()
      : !isNativePlatform()
        ? createSampleReadingSource(driver)
        : createReadingSource({
            driver,
            mounter: createInstalledMounter({
              driver,
              http: createFetchHttp(),
              loader: createFunctionScriptLoader(),
            }),
          }),
  );
  return resolved;
}
