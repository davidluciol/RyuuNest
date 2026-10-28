import type { ImageSourcePropType } from "react-native";
import {
  ChapterReadStore,
  ModuleError,
  ProgressStore,
  type ImageRef,
  type SqlDriver,
} from "@ryuunest/core";

import dragonMarker from "../../../assets/placeholder/dragon.svg";
import page1 from "../../../assets/placeholder/page-1.svg";
import page2 from "../../../assets/placeholder/page-2.svg";
import page3 from "../../../assets/placeholder/page-3.svg";
import { openAppDatabase } from "../../data/appDatabase";
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
  asset?: ImageSourcePropType;
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
  // Se arranca ya: la primera escritura del sembrado ocurre antes de que nadie más escriba.
  const seeded = deps.seed?.(driver) ?? Promise.resolve();

  return {
    driver,

    async loadSeries(moduleId, seriesId) {
      await seeded;
      const { handle, manifest } = await mounter.mount(moduleId);
      const details = await handle.api.details(seriesId);
      const [saved, read] = await Promise.all([
        progress.get(moduleId, seriesId),
        chaptersRead.readIn(moduleId, seriesId),
      ]);
      return {
        details,
        ...(deps.coverSource === undefined ? {} : { coverSource: deps.coverSource }),
        moduleName: manifest.name,
        progress:
          saved === undefined
            ? null
            : { chapterId: saved.chapterId, pageIndex: saved.pageIndex, pageTotal: saved.pageTotal ?? 0 },
        readChapterIds: read,
        preferredReleaseId: null,
      };
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

const SAMPLE_PAGE_ASSETS: readonly ImageSourcePropType[] = [page1, page2, page3];

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

export function createSampleReadingSource(): ReadingSource {
  return createReadingSource({
    driver: createSessionSqlDriver(),
    mounter: createSampleMounter(),
    coverSource: dragonMarker,
    decorateImage: (image, index) => ({
      ...image,
      asset: SAMPLE_PAGE_ASSETS[index % SAMPLE_PAGE_ASSETS.length] as ImageSourcePropType,
    }),
    seed: seedSample,
  });
}

// — Selección por plataforma —

let resolved: Promise<ReadingSource> | undefined;

/**
 * La fuente de la plataforma, compartida por la ficha y el lector: en el dispositivo, los
 * módulos instalados sobre `ryuunest.db`; en web (sin SQLite, F14c) los de ejemplo con su
 * sesión en memoria. Se crea una vez para que el progreso sobreviva a cambiar de pantalla.
 */
export function resolveReadingSource(): Promise<ReadingSource> {
  resolved ??= openAppDatabase().then((driver) =>
    driver === null
      ? createSampleReadingSource()
      : createReadingSource({
          driver,
          mounter: createInstalledMounter({ driver, http: createFetchHttp() }),
        }),
  );
  return resolved;
}
