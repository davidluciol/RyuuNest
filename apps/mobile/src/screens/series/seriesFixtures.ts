import type { ImageSourcePropType } from "react-native";
import type { SeriesDetails } from "@ryuunest/core";
import { findSeries } from "@ryuunest/test-site";

import dragonMarker from "../../../assets/placeholder/dragon.svg";
import type { SeriesProgress } from "./seriesLogic";

// La lógica pura (sin react-native) vive en `seriesLogic.ts` para compartirla
// con apps/web; aquí se re-exporta para no tocar los imports existentes.
export {
  chapterProgress,
  chapterState,
  preferredRelease,
  type ChapterState,
  type SeriesProgress,
} from "./seriesLogic";

export interface SeriesViewData {
  details: SeriesDetails;
  /** Portada local para la galería/web; los datos reales usan `details.cover`. */
  coverSource?: ImageSourcePropType;
  moduleName: string;
  progress: SeriesProgress | null;
  readChapterIds: ReadonlySet<string>;
  preferredReleaseId: string | null;
  /** Si la serie es favorita (persistido en `favorite`; ausente = no). */
  favorite?: boolean;
}

export function sampleSeriesView(seriesId = "dragon-de-ceniza"): SeriesViewData {
  const fixture = findSeries(seriesId) ?? findSeries("dragon-de-ceniza");
  if (fixture === undefined) throw new Error("No hay fixture de serie");
  const details: SeriesDetails = {
    id: fixture.id,
    title: fixture.title,
    cover: fixture.cover,
    kind: fixture.kind,
    nsfw: fixture.nsfw,
    badges: fixture.badges,
    hint: fixture.hint,
    description: fixture.description,
    genres: fixture.genres,
    status: fixture.status,
    altTitles: fixture.altTitles,
    extra: {},
    chapters: fixture.chapters,
  };
  return {
    details,
    coverSource: dragonMarker,
    moduleName: "Módulo de ejemplo A",
    progress: { chapterId: "ch-2", pageIndex: 4, pageTotal: 10 },
    readChapterIds: new Set(["ch-1"]),
    preferredReleaseId: null,
  };
}
