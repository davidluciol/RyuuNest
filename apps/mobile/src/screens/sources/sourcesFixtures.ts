import type { MediaKind } from "@ryuunest/core";

import type { SourceModule, SourcesData } from "./sourcesData";

/**
 * F16 — lógica pura y datos de ejemplo de la pantalla Fuentes (RF-1 a RF-8,
 * RF-35). La pantalla no toca el núcleo: recibe `SourcesData` y devuelve
 * eventos. Aquí vive lo comprobable sin montar la app: contadores de los chips
 * por tipo, resumen «instalados · disponibles», filtro NSFW y orden.
 */

/** Chip de tipo de la pantalla: «Todos» o uno de los 4 tipos (P-27). */
export type SourceKindFilter = "all" | MediaKind;

export const SOURCE_KIND_FILTERS: readonly SourceKindFilter[] = [
  "all",
  "manga",
  "manhua",
  "manhwa",
  "comic",
];

/** Estado vacío (RF-1): sin repos ni módulos. */
export const EMPTY_SOURCES_DATA: SourcesData = { repos: [], modules: [] };

/** Contador de cada chip; un módulo de varios tipos cuenta en cada uno. */
export function kindFilterCounts(
  modules: readonly SourceModule[],
): Record<SourceKindFilter, number> {
  const counts: Record<SourceKindFilter, number> = {
    all: modules.length,
    manga: 0,
    manhua: 0,
    manhwa: 0,
    comic: 0,
  };
  for (const module of modules) {
    for (const kind of new Set(module.kinds)) counts[kind] += 1;
  }
  return counts;
}

/**
 * Módulos visibles: con el filtro NSFW apagado se ocultan los NSFW (RF-35),
 * se filtra por tipo y los instalados van primero (orden estable).
 */
export function filterSourceModules(
  modules: readonly SourceModule[],
  filter: SourceKindFilter,
  nsfwVisible: boolean,
): SourceModule[] {
  const visible = modules.filter(
    (module) =>
      (nsfwVisible || !module.nsfw) && (filter === "all" || module.kinds.includes(filter)),
  );
  return [
    ...visible.filter((module) => module.status === "installed"),
    ...visible.filter((module) => module.status !== "installed"),
  ];
}

/** «N instalados · M disponibles» de la cabecera. */
export function sourcesSummary(modules: readonly SourceModule[]): {
  installed: number;
  available: number;
} {
  const installed = modules.filter((module) => module.status === "installed").length;
  return { installed, available: modules.length - installed };
}

// — Datos de ejemplo (galería y Playwright en web; D1–D5: series y nombres
//   inventados, sin sitios reales). Reproducen el diseño: 6 módulos (3 manga,
//   2 manhwa, 1 cómic), 2 instalados.

const SAMPLE_REPO_ID = "https://repo.ejemplo.org/indice.json";

const sampleModule = (
  overrides: Partial<SourceModule> & Pick<SourceModule, "id" | "name" | "kinds">,
): SourceModule => ({
  status: "available",
  version: "1.0.0",
  runtime: "declarative",
  lang: "es",
  nsfw: false,
  domains: ["sitio-html.test"],
  repoId: SAMPLE_REPO_ID,
  enabled: false,
  orphan: false,
  ...overrides,
});

export const SAMPLE_SOURCES_DATA: SourcesData = {
  repos: [
    {
      id: SAMPLE_REPO_ID,
      name: "Repositorio Comunitario A",
      url: SAMPLE_REPO_ID,
      moduleCount: 6,
    },
  ],
  modules: [
    sampleModule({
      id: "portal-aurora",
      name: "Portal Aurora",
      kinds: ["manga"],
      status: "installed",
      enabled: true,
      version: "1.2.0",
      updateTo: "1.3.0",
    }),
    sampleModule({
      id: "portal-brasa",
      name: "Portal Brasa",
      kinds: ["manhwa"],
      status: "installed",
      enabled: false,
      version: "2.0.1",
      lastError: "El selector «.lista .item» ya no existe en la página",
    }),
    sampleModule({
      id: "portal-cenit",
      name: "Portal Cénit",
      kinds: ["manga"],
      runtime: "script",
      domains: ["cenit.test", "cdn.cenit.test"],
    }),
    sampleModule({ id: "portal-duna", name: "Portal Duna", kinds: ["manhwa"] }),
    sampleModule({ id: "portal-ember", name: "Portal Ember", kinds: ["manga"], lang: "en" }),
    sampleModule({ id: "portal-fresno", name: "Portal Fresno", kinds: ["comic"] }),
  ],
};
