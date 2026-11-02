import type {
  ChapterPages,
  ModuleManifest,
  Page,
  SeriesDetails,
  SeriesSummary,
} from "../../src/contract/types";

/**
 * Fixtures de regresión de la validación de forma del contrato (T37, R4 del ADR-0003).
 *
 * La **forma** de cada objeto es la que produce el código publicado de cada módulo en
 * `RyuuNest-Models` (zonatmo 0.2.0, m440 0.1.0, yupmanga 0.1.0), leída de su código
 * (`bin/{home,search,details,pages}.js` y `bin/utils/{url,normalize,text}.js`):
 * cabeceras de imagen `Referer`/`User-Agent` (RF-24), `related` fuera del contrato en
 * zonatmo y yupmanga, ids opacos con `?` y `=` en yupmanga, una sola release por
 * capítulo en m440 y yupmanga, y `compact()` que elimina las claves vacías (por eso
 * hay resúmenes sin `cover` ni `kind`).
 *
 * Los **valores** son inventados (sin datos ni obras de sitios reales, AGENTS.md §7);
 * lo que debe conservarse exacto es la forma, porque es lo que la validación de
 * `guardApi` promete tolerar. Si alguien endurece la validación de forma con la que
 * un módulo publicado deja de pasar, `publishedModules.test.ts` falla.
 */

/** Cabeceras que los tres módulos añaden a cada imagen (`imageRef` de su `utils/url.js`). */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

/** Salidas de un módulo publicado, con la forma exacta que produce su código. */
export interface PublishedModuleOutputs {
  /** Id y versión del módulo publicado (procedencia de la forma). */
  id: string;
  version: string;
  /** Manifest público del módulo (solo cambian ids, dominios y `baseUrl`). */
  manifest: ModuleManifest;
  /** `popular(1)`: los tres módulos publicados lo implementan. */
  popular: Page<SeriesSummary>;
  /** `latest(1)`. */
  latest: Page<SeriesSummary>;
  /** `search("ejemplo", 1)`. */
  search: Page<SeriesSummary>;
  /** `details(seriesId)`; puede traer campos extra (`related`). */
  details: SeriesDetails & { related?: SeriesSummary[] };
  /** `pages(chapterId, releaseId)`. */
  chapterPages: ChapterPages;
}

function image(url: string, referer: string) {
  return { url, headers: { Referer: referer, "User-Agent": USER_AGENT } };
}

/** Manifest común: solo cambian id, nombre, versión, dominios, kinds y baseUrl. */
function publishedManifest(
  id: string,
  name: string,
  version: string,
  baseUrl: string,
  domains: string[],
  kinds: ModuleManifest["kinds"],
): ModuleManifest {
  return {
    id,
    name,
    version,
    apiVersion: 1,
    runtime: "script",
    kinds,
    lang: "es",
    nsfw: true,
    baseUrl,
    capabilities: ["popular", "latest", "search"],
    permissions: { domains },
    entry: "module.js",
  };
}

export const zonatmo: PublishedModuleOutputs = {
  id: "zonatmo",
  version: "0.2.0",
  manifest: publishedManifest(
    "zonatmo",
    "ZonaTMO",
    "0.2.0",
    "https://zonatmo.org",
    ["zonatmo.org", "storage.zonatmo.org", "storage2.zonatmo.org"],
    ["manga", "manhwa", "manhua", "comic"],
  ),
  // `listPage`: rejilla paginada, `hasNext` según el selector de «siguiente».
  popular: {
    items: [
      {
        id: "/library/el-guardian-del-valle",
        title: "El guardián del valle",
        cover: image("https://storage.zonatmo.org/covers/guardian.webp", "https://zonatmo.org/"),
        kind: "manga",
        badges: ["★ 9.8", "+18", "Seinen"],
        hint: "En emisión · 128 capítulos",
      },
      {
        // `compact()` elimina portada y kind cuando el sitio no los trae.
        id: "/library/la-heredera-de-brumas",
        title: "La heredera de brumas",
        badges: ["★ 8.9"],
        hint: "En emisión · 76 capítulos",
      },
    ],
    hasNext: true,
  },
  latest: {
    items: [
      {
        id: "/library/eco-de-acero",
        title: "Eco de acero",
        cover: image("https://storage.zonatmo.org/covers/eco.webp", "https://zonatmo.org/"),
        kind: "manhwa",
        hint: "hace 2 h · 129 caps",
      },
    ],
    hasNext: true,
  },
  search: {
    items: [
      {
        id: "/library/el-guardian-del-valle",
        title: "El guardián del valle",
        cover: image("https://storage.zonatmo.org/covers/guardian.webp", "https://zonatmo.org/"),
        kind: "manga",
        badges: ["★ 9.8", "Seinen"],
      },
    ],
    hasNext: false,
  },
  // `details`: capítulos con varias releases (grupos) y carrusel `related` (campo extra).
  details: {
    id: "/library/el-guardian-del-valle",
    title: "El guardián del valle",
    cover: image("https://storage.zonatmo.org/covers/guardian.webp", "https://zonatmo.org/"),
    description: "Sinopsis de ejemplo para la fixture de zonatmo.",
    genres: ["Acción", "Fantasía", "Seinen"],
    status: "ongoing",
    altTitles: ["Guardian of the Valley"],
    extra: {
      Puntuación: "9.8",
      Capítulos: "128",
      Visitas: "1.234.567",
      Demografía: "Seinen",
      Autor: "Autora de ejemplo",
    },
    chapters: [
      {
        // El `id` del capítulo es su título (chaptersOf).
        id: "Capítulo 128",
        title: "Capítulo 128",
        number: 128,
        releases: [
          {
            id: "/view/elts/128/suite",
            group: "Grupo ejemplo A",
            publishedAt: "2026-05-27",
          },
          { id: "/view/elts/128/alt", group: "Grupo ejemplo B" },
        ],
      },
      {
        id: "Capítulo 127",
        title: "Capítulo 127",
        number: 127,
        releases: [{ id: "/view/elts/127/suite", group: "Grupo ejemplo A" }],
      },
    ],
    related: [
      {
        id: "/library/la-heredera-de-brumas",
        title: "La heredera de brumas",
        cover: image("https://storage.zonatmo.org/covers/brumas.webp", "https://zonatmo.org/"),
        kind: "manhwa",
        badges: ["★ 8.9"],
      },
    ],
  },
  chapterPages: {
    title: "Capítulo 128",
    images: [
      image("https://storage.zonatmo.org/pages/128/001.webp", "https://zonatmo.org/"),
      image("https://storage.zonatmo.org/pages/128/002.webp", "https://zonatmo.org/"),
      image("https://storage.zonatmo.org/pages/128/003.webp", "https://zonatmo.org/"),
    ],
  },
};

export const m440: PublishedModuleOutputs = {
  id: "m440",
  version: "0.1.0",
  manifest: publishedManifest(
    "m440",
    "M440",
    "0.1.0",
    "https://m440.in",
    ["m440.in", "s1.m440.in", "s2.m440.in"],
    ["manga", "manhwa"],
  ),
  // Home de una sola página: `hasNext` siempre false y la página 2 vacía.
  popular: {
    items: [
      {
        id: "/manga/eco-de-acero",
        title: "Eco de acero",
        cover: image("https://s1.m440.in/covers/eco.jpg", "https://m440.in/"),
        badges: ["★ 4.5"],
        hint: "Cap. 76",
      },
    ],
    hasNext: false,
  },
  latest: {
    items: [
      {
        id: "/manga/la-tejedora",
        title: "La tejedora",
        cover: image("https://s1.m440.in/covers/tejedora.jpg", "https://m440.in/"),
        badges: ["Drama"],
        hint: "01/11/2026 · Cap. 12",
      },
    ],
    hasNext: false,
  },
  search: {
    items: [
      {
        id: "/manga/eco-de-acero",
        title: "Eco de acero",
        cover: image("https://s1.m440.in/covers/eco.jpg", "https://m440.in/"),
        badges: ["Ongoing", "Acción", "Aventura"],
      },
    ],
    hasNext: false,
  },
  // `details`: capítulos descifrados del payload, una sola release por capítulo.
  details: {
    id: "/manga/eco-de-acero",
    title: "Eco de acero",
    cover: image("https://s1.m440.in/covers/eco.jpg", "https://m440.in/"),
    description: "Sinopsis de ejemplo para la fixture de m440.",
    genres: ["Acción", "Aventura"],
    status: "ongoing",
    altTitles: ["Steel Echo"],
    extra: { Tipo: "Manhwa", Publicación: "2025", Estado: "En curso" },
    chapters: [
      {
        // El id del capítulo y el de su única release coinciden (chaptersOf).
        id: "/manga/eco-de-acero/cap-76",
        title: "Capítulo 76",
        number: 76,
        releases: [
          {
            id: "/manga/eco-de-acero/cap-76",
            group: "TraductorDeEjemplo",
            publishedAt: "2026-10-30",
          },
        ],
      },
      {
        id: "/manga/eco-de-acero/cap-75",
        title: "Capítulo 75",
        number: 75,
        releases: [{ id: "/manga/eco-de-acero/cap-75", publishedAt: "2026-10-23" }],
      },
    ],
  },
  chapterPages: {
    title: "Capítulo 76",
    images: [
      image("https://s2.m440.in/eco/76/001.webp", "https://m440.in/"),
      image("https://s2.m440.in/eco/76/002.webp", "https://m440.in/"),
    ],
  },
};

export const yupmanga: PublishedModuleOutputs = {
  id: "yupmanga",
  version: "0.1.0",
  manifest: publishedManifest(
    "yupmanga",
    "YupManga",
    "0.1.0",
    "https://www.yupmanga.com",
    ["www.yupmanga.com"],
    ["manga", "manhwa", "manhua", "comic"],
  ),
  // Rejilla de una sola página (`singlePage`): `hasNext` siempre false.
  popular: {
    items: [
      {
        // Ids opacos con `?` y `=` (seriesIdOf/relativePath los conserva tal cual).
        id: "/series.php?id=482",
        title: "Cenizas del mirlo",
        cover: image("https://www.yupmanga.com/covers/482.jpg", "https://www.yupmanga.com/"),
        kind: "manhwa",
        badges: ["Activo"],
      },
    ],
    hasNext: false,
  },
  latest: {
    items: [
      {
        id: "/series.php?id=517",
        title: "El jardín de los vientos",
        cover: image("https://www.yupmanga.com/covers/517.jpg", "https://www.yupmanga.com/"),
        kind: "manga",
        badges: ["Activo"],
      },
    ],
    hasNext: false,
  },
  search: {
    items: [
      {
        id: "/series.php?id=482",
        title: "Cenizas del mirlo",
        cover: image("https://www.yupmanga.com/covers/482.jpg", "https://www.yupmanga.com/"),
        kind: "manhwa",
        badges: ["Activo"],
      },
    ],
    hasNext: false,
  },
  // `details`: altTitles siempre vacío, releases con solo el id y `related` (campo extra).
  details: {
    id: "/series.php?id=482",
    title: "Cenizas del mirlo",
    cover: image("https://www.yupmanga.com/covers/482.jpg", "https://www.yupmanga.com/"),
    description: "Sinopsis de ejemplo para la fixture de yupmanga.",
    genres: ["Drama", "Romance"],
    status: "ongoing",
    altTitles: [],
    extra: { Autor: "Autor de ejemplo", Capítulos: "64" },
    chapters: [
      {
        id: "Capítulo 64",
        title: "Capítulo 64",
        number: 64,
        releases: [{ id: "/series.php?id=482&chapter=64.5" }],
      },
      {
        id: "Capítulo 63",
        title: "Capítulo 63",
        number: 63,
        releases: [{ id: "/series.php?id=482&chapter=63.2" }],
      },
    ],
    related: [
      {
        id: "/series.php?id=517",
        title: "El jardín de los vientos",
        cover: image("https://www.yupmanga.com/covers/517.jpg", "https://www.yupmanga.com/"),
        kind: "manga",
        badges: ["Activo"],
      },
    ],
  },
  chapterPages: {
    title: "Capítulo 64",
    images: [
      // El lector pasa por el proxy del sitio; el Referer es la página del capítulo.
      image(
        "https://www.yupmanga.com/image-proxy-v2.php?k=ejemplo-001",
        "https://www.yupmanga.com/series.php?id=482",
      ),
      image(
        "https://www.yupmanga.com/image-proxy-v2.php?k=ejemplo-002",
        "https://www.yupmanga.com/series.php?id=482",
      ),
    ],
  },
};

/** Los tres módulos publicados, en el orden del `index.json` de RyuuNest-Models. */
export const publishedModules: PublishedModuleOutputs[] = [zonatmo, yupmanga, m440];
