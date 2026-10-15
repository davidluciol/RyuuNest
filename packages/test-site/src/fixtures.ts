/**
 * Conjunto único y coherente de datos de ejemplo (`DESIGN_RULES.md` D1–D5).
 *
 * Series inventadas (sin obras reales), con capítulos, releases y páginas. De este
 * conjunto se derivan las **dos arquitecturas** de `sites.ts` (HTML y JSON con
 * cursor), así que ambas coinciden. Nada de aquí depende de la plataforma.
 */
import type { ImageRef, MediaKind, SeriesStatus } from "@ryuunest/core";

/** Edición de un capítulo (grupo o release). */
export interface FixtureRelease {
  id: string;
  group: string;
  publishedAt: string;
}

/** Capítulo con al menos una edición. */
export interface FixtureChapter {
  id: string;
  title: string;
  number: number;
  releases: FixtureRelease[];
}

/** Serie de ejemplo, con lo necesario para listas y fichas. */
export interface FixtureSeries {
  id: string;
  title: string;
  kind: MediaKind;
  nsfw: boolean;
  status: SeriesStatus;
  description: string;
  altTitles: string[];
  genres: string[];
  badges: string[];
  hint: string;
  cover: ImageRef;
  chapters: FixtureChapter[];
}

/** Serie 1 · manhwa con un capítulo de dos releases y otro NSFW aparte. */
const dragonDeCeniza: FixtureSeries = {
  id: "dragon-de-ceniza",
  title: "El dragón de ceniza",
  kind: "manhwa",
  nsfw: false,
  status: "ongoing",
  description:
    "Una cartógrafa hereda un dragón de ceniza y un mapa que miente. Cada página " +
    "dibujada se convierte en terreno real.",
  altTitles: ["Ash Dragon", "Ceniza y cartografía"],
  genres: ["Fantasía", "Aventura"],
  badges: ["★ 8.4"],
  hint: "hace 2 h · Equipo Ryuu",
  cover: { url: "/img/dragon-de-ceniza.svg" },
  chapters: [
    {
      id: "ch-1",
      title: "Capítulo 1",
      number: 1,
      releases: [
        { id: "r-oficial", group: "Equipo Ryuu", publishedAt: "2026-09-01T10:00:00Z" },
        { id: "r-alt", group: "Escuadrón Noche", publishedAt: "2026-09-02T18:30:00Z" },
      ],
    },
    {
      id: "ch-2",
      title: "Capítulo 2",
      number: 2,
      releases: [{ id: "r-oficial", group: "Equipo Ryuu", publishedAt: "2026-09-08T10:00:00Z" }],
    },
    {
      id: "ch-3",
      title: "Capítulo 3",
      number: 3,
      releases: [{ id: "r-oficial", group: "Equipo Ryuu", publishedAt: "2026-09-15T10:00:00Z" }],
    },
  ],
};

/** Serie 2 · manga. */
const guardianDelNido: FixtureSeries = {
  id: "guardiana-del-nido",
  title: "La guardiana del nido",
  kind: "manga",
  nsfw: false,
  status: "ongoing",
  description: "Una arquera vigila el último nido de grifos desde una torre que se hunde.",
  altTitles: ["Nest Warden"],
  genres: ["Fantasía", "Drama"],
  badges: ["★ 7.9"],
  hint: "hace 6 h · Nido Editorial",
  cover: { url: "/img/guardiana-del-nido.svg" },
  chapters: [
    {
      id: "ch-1",
      title: "Capítulo 1",
      number: 1,
      releases: [{ id: "r-oficial", group: "Nido Editorial", publishedAt: "2026-08-20T09:00:00Z" }],
    },
    {
      id: "ch-2",
      title: "Capítulo 2",
      number: 2,
      releases: [{ id: "r-oficial", group: "Nido Editorial", publishedAt: "2026-08-27T09:00:00Z" }],
    },
  ],
};

/** Serie 3 · manhua. */
const cronicasDeMoonlit: FixtureSeries = {
  id: "cronicas-de-moonlit",
  title: "Crónicas de Moonlit",
  kind: "manhua",
  nsfw: false,
  status: "hiatus",
  description: "Crónicas de una ciudad que solo existe de noche y de sus relojeros.",
  altTitles: ["Moonlit Chronicles"],
  genres: ["Misterio", "Sobrenatural"],
  badges: ["En pausa"],
  hint: "hace 3 d · Estudio Linterna",
  cover: { url: "/img/cronicas-de-moonlit.svg" },
  chapters: [
    {
      id: "ch-1",
      title: "Capítulo 1",
      number: 1,
      releases: [
        { id: "r-oficial", group: "Estudio Linterna", publishedAt: "2026-07-11T12:00:00Z" },
      ],
    },
  ],
};

/** Serie 4 · cómic. */
const nocheDeAmbar: FixtureSeries = {
  id: "noche-de-ambar",
  title: "Noche de ámbar",
  kind: "comic",
  nsfw: false,
  status: "completed",
  description: "Un detective de seguros persigue un cuadro que roba recuerdos.",
  altTitles: ["Amber Night"],
  genres: ["Policiaco", "Intriga"],
  badges: ["Completa"],
  hint: "hace 1 sem · Taller Ámbar",
  cover: { url: "/img/noche-de-ambar.svg" },
  chapters: [
    {
      id: "ch-1",
      title: "Número 1",
      number: 1,
      releases: [{ id: "r-oficial", group: "Taller Ámbar", publishedAt: "2026-06-01T08:00:00Z" }],
    },
    {
      id: "ch-2",
      title: "Número 2",
      number: 2,
      releases: [{ id: "r-oficial", group: "Taller Ámbar", publishedAt: "2026-06-15T08:00:00Z" }],
    },
  ],
};

/** Serie 5 · manhwa marcada NSFW (para RF-35). */
const dracoDeJade: FixtureSeries = {
  id: "draco-de-jade",
  title: "Draco de jade",
  kind: "manhwa",
  nsfw: true,
  status: "ongoing",
  description: "Un aprendiz de tallador despierta a un draco tallado en jade.",
  altTitles: ["Jade Draco"],
  genres: ["Fantasía", "Adulto"],
  badges: ["+18"],
  hint: "hace 12 h · Sello Nocturno",
  cover: { url: "/img/draco-de-jade.svg" },
  chapters: [
    {
      id: "ch-1",
      title: "Capítulo 1",
      number: 1,
      releases: [{ id: "r-oficial", group: "Sello Nocturno", publishedAt: "2026-09-05T22:00:00Z" }],
    },
  ],
};

/** El conjunto de datos de ejemplo. */
export const FIXTURE_SERIES: readonly FixtureSeries[] = [
  dragonDeCeniza,
  guardianDelNido,
  cronicasDeMoonlit,
  nocheDeAmbar,
  dracoDeJade,
];

/** Valores por defecto que usan el arnés y las pruebas. */
export interface FixtureDefaults {
  seriesId: string;
  chapterId: string;
  releaseIds: readonly string[];
  searchQuery: string;
}

const defaultSeries = FIXTURE_SERIES[0];
const defaultChapter =
  defaultSeries?.chapters.find((chapter) => chapter.releases.length >= 2) ??
  defaultSeries?.chapters[0];

export const FIXTURE_DEFAULTS: FixtureDefaults = {
  seriesId: defaultSeries?.id ?? "",
  chapterId: defaultChapter?.id ?? "",
  releaseIds: (defaultChapter?.releases ?? []).map((release) => release.id),
  searchQuery: "dragon",
};

export function findSeries(seriesId: string): FixtureSeries | undefined {
  return FIXTURE_SERIES.find((series) => series.id === seriesId);
}

export function findChapter(seriesId: string, chapterId: string): FixtureChapter | undefined {
  return findSeries(seriesId)?.chapters.find((chapter) => chapter.id === chapterId);
}

/** Minúsculas y sin acentos, para comparar títulos y búsquedas. */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Series cuyo título contiene la consulta (sin acentos ni mayúsculas). */
export function searchFixtureSeries(query: string): FixtureSeries[] {
  const needle = normalizeText(query);
  return FIXTURE_SERIES.filter((series) => normalizeText(series.title).includes(needle));
}
