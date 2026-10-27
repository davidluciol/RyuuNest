import {
  ModuleError,
  ModuleHost,
  createModuleApi,
  type DeclarativeConfig,
  type ModuleApiHandle,
  type ModuleManifest,
  type SeriesSummary,
} from "@ryuunest/core";
import {
  EXAMPLE_DECLARATIVE,
  HTML_SITE_BASE_URL,
  TestSiteHttp,
  createHtmlSite,
} from "@ryuunest/test-site";

import {
  SAMPLE_DISCOVER_MODULES,
  type DiscoverEntry,
  type DiscoverError,
  type DiscoverModule,
  type DiscoverPage,
} from "./discoverFixtures";

/**
 * F15 — capa de datos de Descubrir.
 *
 * Los módulos de ejemplo se montan con el runtime real del núcleo (T20) sobre
 * el sitio falso de `test-site` (T10), así la pantalla ejercita el contrato
 * (SPEC §6.2/§6.3) igual que en el dispositivo. Cuando la instalación de
 * módulos tenga su UI (F16), esta capa leerá `ModuleRegistry` en vez de la
 * lista de muestra, sin cambiar la pantalla.
 */

const SITE_DOMAIN = "sitio-html.test";

/** B recorta el declarativo sin `popular`: la fila no debe pedirse (RF-9). */
const { popular: _popularDeB, ...EXAMPLE_WITHOUT_POPULAR } = EXAMPLE_DECLARATIVE;

const SAMPLE_CONFIGS: Record<string, DeclarativeConfig> = {
  "m-ejemplo-a": EXAMPLE_DECLARATIVE,
  "m-ejemplo-b": EXAMPLE_WITHOUT_POPULAR,
};

export function getDiscoverModules(): DiscoverModule[] {
  return SAMPLE_DISCOVER_MODULES.map((module) => ({ ...module }));
}

function sampleManifest(id: string): ModuleManifest {
  const source = SAMPLE_DISCOVER_MODULES.find((module) => module.id === id);
  if (source === undefined) {
    throw new ModuleError("NOT_FOUND", `El módulo de ejemplo ${id} no existe`);
  }
  const capabilities: ModuleManifest["capabilities"] = ["search"];
  if (source.hasPopular) capabilities.unshift("popular");
  if (source.hasLatest) capabilities.push("latest");
  return {
    id: source.id,
    name: source.name,
    version: "1.0.0",
    apiVersion: 1,
    runtime: "declarative",
    kinds: ["manga", "manhua", "manhwa", "comic"],
    lang: "es",
    nsfw: source.nsfw,
    baseUrl: HTML_SITE_BASE_URL,
    capabilities,
    permissions: { domains: [SITE_DOMAIN] },
    entry: "index.json",
  };
}

const mounted = new Map<string, Promise<ModuleApiHandle>>();

/** Monta (una vez) la `ModuleApi` del módulo de ejemplo por el runtime real. */
function mountModule(id: string): Promise<ModuleApiHandle> {
  let api = mounted.get(id);
  if (api === undefined) {
    const host = new ModuleHost({
      http: new TestSiteHttp(createHtmlSite()),
      clock: { now: () => Date.now() },
      permissions: { domains: [SITE_DOMAIN] },
      minDelayMs: 0,
    });
    const manifest = sampleManifest(id);
    api = createModuleApi({
      manifest,
      entry: JSON.stringify(SAMPLE_CONFIGS[id]),
      host,
    });
    mounted.set(id, api);
  }
  return api;
}

function toEntry(moduleId: string, series: SeriesSummary): DiscoverEntry {
  return {
    seriesId: series.id,
    moduleId,
    title: series.title,
    kind: series.kind ?? null,
    nsfw: series.nsfw ?? false,
    hint: series.hint ?? null,
  };
}

/** Datos cargados de una pasada: filas de portada y página del catálogo. */
export interface DiscoverLoadResult {
  latest: DiscoverEntry[];
  popular: DiscoverEntry[];
  catalog: DiscoverPage;
}

export interface DiscoverLoadOptions {
  moduleId: string;
  /** Consulta entregada; vacía = explorar el catálogo sin filtrar. */
  query: string;
  /** Página del catálogo, base 1 (RF-10). */
  page: number;
}

/**
 * Carga latest + popular (según lo que ofrezca el módulo) y la página pedida
 * del catálogo. Los fallos del módulo salen como `ModuleError` (SPEC §6.4).
 */
export async function loadDiscoverData(options: DiscoverLoadOptions): Promise<DiscoverLoadResult> {
  const { moduleId, query, page } = options;
  const source = SAMPLE_DISCOVER_MODULES.find((module) => module.id === moduleId);
  if (source === undefined) {
    throw new ModuleError("NOT_FOUND", `El módulo de ejemplo ${moduleId} no existe`);
  }
  const { api } = await mountModule(moduleId);

  const [latest, popular, catalogPage] = await Promise.all([
    source.hasLatest && api.latest ? api.latest(1).then((p) => p.items) : Promise.resolve([]),
    source.hasPopular && api.popular ? api.popular(1).then((p) => p.items) : Promise.resolve([]),
    api.search(query, page),
  ]);

  return {
    latest: latest.map((series) => toEntry(moduleId, series)),
    popular: popular.map((series) => toEntry(moduleId, series)),
    catalog: {
      page,
      entries: catalogPage.items.map((series) => toEntry(moduleId, series)),
      hasNext: catalogPage.hasNext,
    },
  };
}

/** Convierte el fallo del módulo en el detalle técnico de RF-11. */
export function toDiscoverError(error: unknown, moduleName: string): DiscoverError {
  if (error instanceof ModuleError) {
    return {
      moduleName,
      cause: error.message,
      code: error.code,
      ...(error.details?.url !== undefined ? { url: error.details.url } : {}),
      ...(error.details?.selector !== undefined ? { selector: error.details.selector } : {}),
    };
  }
  return {
    moduleName,
    cause: error instanceof Error ? error.message : String(error),
    code: "INTERNAL",
  };
}
