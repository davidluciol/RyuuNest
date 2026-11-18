import {
  ModuleError,
  ModuleHost,
  ModuleRegistry,
  SqliteStorage,
  createFunctionScriptLoader,
  createModuleApi,
  type DeclarativeConfig,
  type Http,
  type ModuleApiHandle,
  type ModuleManifest,
  type SearchFilterValues,
  type ScriptLoader,
  type SeriesSummary,
  type SqlDriver,
} from "@ryuunest/core";
import {
  EXAMPLE_DECLARATIVE,
  HTML_SITE_BASE_URL,
  TestSiteHttp,
  createHtmlSite,
} from "@ryuunest/test-site";

import { openAppDatabase } from "../../data/appDatabase";
import { isNativePlatform } from "../../data/backupFilesPort";
import { createFetchHttp } from "../../data/fetchHttp";
import { createInstalledMounter, type ModuleMounter } from "../../data/moduleMounter";
import {
  SAMPLE_DISCOVER_MODULES,
  type DiscoverEntry,
  type DiscoverError,
  type DiscoverModule,
  type DiscoverPage,
  type DiscoverFilter,
  type DiscoverFilterValues,
  type DiscoverSection,
  countActiveFilters,
} from "./discoverFixtures";

/**
 * F15/F15b — capa de datos de Descubrir, con dos fuentes detrás de la misma
 * interfaz:
 *
 * - **Dispositivo (F15b):** los módulos instalados de `ModuleRegistry` (T14),
 *   montados con el runtime real del núcleo (T20) sobre la `Http` de la
 *   plataforma; el último módulo elegido persiste en la tabla `setting`
 *   (SPEC §8.1), así RF-9 sobrevive a los arranques.
 * - **Web (F15, Playwright):** los dos módulos de ejemplo, con el mismo
 *   runtime sobre el sitio falso de `test-site` (T10); el recuerdo es solo de
 *   sesión porque no hay SQLite en la web (F14c, P-79).
 *
 * Fuera de F15b a propósito: los módulos **script** no se listen todavía —
 * su carga en el dispositivo necesita el `ScriptLoader` de plataforma que el
 * puerto prevé (D-5) y que la app aún no tiene. Se sumará con la tarea que
 * lo implemente, junto a la navegación a la ficha (F17).
 */

/** Ajuste (tabla `setting`, SPEC §8.1) que guarda el último módulo elegido. */
const LAST_MODULE_SETTING = ["discover", "lastModule"].join(".");

/** Lo que la pantalla necesita saber de su fuente de datos. */
export interface DiscoverDataSource {
  /** Módulos elegibles por Descubrir (activos y montables hoy). */
  listModules(): Promise<DiscoverModule[]>;
  /** Filas del módulo (según lo que ofrezca) y página pedida del catálogo. */
  load(options: DiscoverLoadOptions): Promise<DiscoverLoadResult>;
  /** Último módulo elegido (RF-9), o `null` si no hay recuerdo. */
  recallLastModule(): Promise<string | null>;
  /** Guarda el módulo elegido como el último. */
  rememberLastModule(id: string): Promise<void>;
}

/** Datos cargados de una pasada: filas de portada y página del catálogo. */
export interface DiscoverLoadResult {
  latest: DiscoverEntry[];
  popular: DiscoverEntry[];
  /** Secciones de `home()` (F59); vacío si el módulo no la declara: entonces valen latest/popular. */
  sections: DiscoverSection[];
  /** Grupos `tags` de `filters()` (F50); vacío si el módulo no los declara. */
  filters: DiscoverFilter[];
  catalog: DiscoverPage;
}

export interface DiscoverLoadOptions {
  moduleId: string;
  /** Consulta entregada; vacía = explorar el catálogo sin filtrar. */
  query: string;
  /** Página del catálogo, base 1 (RF-10). */
  page: number;
  /** F59: sección de `home()` abierta con «Ver más»; el catálogo sale de `list(sectionId, page)`. */
  sectionId?: string | undefined;
  /** F50: etiquetas aplicadas; `search` las recibe, también sin texto. */
  filters?: DiscoverFilterValues | undefined;
}

// — Compartido: mapeo de `SeriesSummary` y carga sobre una API montada —

function toEntry(moduleId: string, series: SeriesSummary): DiscoverEntry {
  return {
    seriesId: series.id,
    moduleId,
    title: series.title,
    kind: series.kind ?? null,
    nsfw: series.nsfw ?? false,
    hint: series.hint ?? null,
    ...(series.cover === undefined
      ? {}
      : {
          cover: {
            uri: series.cover.url,
            ...(series.cover.headers === undefined ? {} : { headers: series.cover.headers }),
          },
        }),
  };
}

export async function loadFromApi(
  handle: ModuleApiHandle,
  flags: { hasLatest: boolean; hasPopular: boolean; hasHome: boolean; hasFilters?: boolean },
  moduleId: string,
  query: string,
  page: number,
  sectionId?: string,
  selected: DiscoverFilterValues = {},
): Promise<DiscoverLoadResult> {
  const { api } = handle;
  const inSection = sectionId !== undefined && api.list !== undefined;
  // F59: con `home()` sus secciones sustituyen a latest/popular; dentro de una
  // sección (`list`) o con consulta solo se ve el catálogo, sin filas.
  const filtering = countActiveFilters(selected) > 0;
  const useHome =
    flags.hasHome && api.home !== undefined && !inSection && query.trim() === "" && !filtering;
  const rows = !inSection;
  // Los grupos se leen antes de buscar: de ellos depende cómo viaja cada selección.
  const filterGroups: DiscoverFilter[] =
    !inSection && flags.hasFilters === true && api.filters
      ? (await api.filters()).flatMap((group) =>
          group.options !== undefined &&
          group.options.length > 0 &&
          (group.type === "tags" || group.type === "multi" || group.type === "select")
            ? [
                {
                  id: group.id,
                  label: group.label,
                  multi: group.type !== "select",
                  options: group.options,
                },
              ]
            : [],
        )
      : [];
  // `select` viaja como texto (así lo leen los módulos publicados); `tags`/`multi`, como lista.
  const searchFilters: SearchFilterValues = {};
  for (const group of filterGroups) {
    const chosen = selected[group.id];
    if (chosen !== undefined && chosen.length > 0) {
      searchFilters[group.id] = group.multi ? chosen : (chosen[0] ?? "");
    }
  }
  const [latest, popular, home, catalogPage] = await Promise.all([
    rows && !useHome && flags.hasLatest && api.latest ? api.latest(1).then((p) => p.items) : Promise.resolve([]),
    rows && !useHome && flags.hasPopular && api.popular ? api.popular(1).then((p) => p.items) : Promise.resolve([]),
    useHome && api.home ? api.home().then((h) => h.sections) : Promise.resolve([]),
    inSection && api.list
      ? api.list(sectionId, page)
      : filtering
        ? api.search(query, page, searchFilters)
        : api.search(query, page),
  ]);

  return {
    latest: latest.map((series) => toEntry(moduleId, series)),
    popular: popular.map((series) => toEntry(moduleId, series)),
    sections: home.map((section) => ({
      id: section.id,
      title: section.title,
      hasMore: section.hasNext,
      entries: section.items.map((series) => toEntry(moduleId, series)),
    })),
    filters: filterGroups,
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

// — Fuente de la web: módulos de ejemplo sobre `test-site` (F15) —

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

const mountedSamples = new Map<string, Promise<ModuleApiHandle>>();

/** Monta (una vez) la `ModuleApi` del módulo de ejemplo por el runtime real. */
function mountSample(id: string): Promise<ModuleApiHandle> {
  let api = mountedSamples.get(id);
  if (api === undefined) {
    const host = new ModuleHost({
      http: new TestSiteHttp(createHtmlSite()),
      clock: { now: () => Date.now() },
      permissions: { domains: [SITE_DOMAIN] },
      minDelayMs: 0,
    });
    api = createModuleApi({
      manifest: sampleManifest(id),
      entry: JSON.stringify(SAMPLE_CONFIGS[id]),
      host,
    });
    mountedSamples.set(id, api);
  }
  return api;
}

/** Los módulos de ejemplo montados por el runtime real, para la ficha y el lector de la web. */
export function createSampleMounter(): ModuleMounter {
  return {
    async mount(moduleId) {
      return { handle: await mountSample(moduleId), manifest: sampleManifest(moduleId) };
    },
  };
}

/**
 * Carga latest + popular (según lo que ofrezca el módulo) y la página pedida
 * del catálogo. Los fallos del módulo salen como `ModuleError` (SPEC §6.4).
 */
export async function loadDiscoverData(options: DiscoverLoadOptions): Promise<DiscoverLoadResult> {
  const { moduleId, query, page, sectionId, filters } = options;
  const source = SAMPLE_DISCOVER_MODULES.find((module) => module.id === moduleId);
  if (source === undefined) {
    throw new ModuleError("NOT_FOUND", `El módulo de ejemplo ${moduleId} no existe`);
  }
  const handle = await mountSample(moduleId);
  return loadFromApi(handle, { ...source, hasHome: false }, moduleId, query, page, sectionId, filters);
}

/** El último módulo elegido sobrevive a cambiar de pestaña en la sesión. */
let rememberedSampleId: string | null = null;

export function createSampleDiscoverSource(): DiscoverDataSource {
  return {
    async listModules() {
      return getDiscoverModules();
    },
    load: loadDiscoverData,
    async recallLastModule() {
      return rememberedSampleId;
    },
    async rememberLastModule(id: string) {
      rememberedSampleId = id;
    },
  };
}

// — Fuente del dispositivo: módulos instalados (F15b) —

export interface InstalledSourceDeps {
  driver: SqlDriver;
  /** La `Http` de la plataforma; inyectable para probar sin red. */
  http: Http;
  /**
   * Cargador de módulos `script` (F25, web con Web Worker). Con él se listan
   * también los módulos script; sin él solo los declarativos (dispositivo, D-5).
   */
  loader?: ScriptLoader;
}

/**
 * Fuente sobre el registro real (T14): lee `module:*`, monta con el runtime
 * (T20) la entrada del paquete (hex → texto) y persiste el último módulo en
 * `setting`. Los módulos script quedan fuera hasta tener `ScriptLoader` de
 * app (D-5): listarlos sin poder montarlos sería prometer lo que no funciona.
 */
export function createInstalledDiscoverSource(deps: InstalledSourceDeps): DiscoverDataSource {
  const { driver, http, loader } = deps;
  const registry = new ModuleRegistry({ storage: new SqliteStorage(driver) });
  const mounter = createInstalledMounter({
    driver,
    http,
    ...(loader === undefined ? {} : { loader }),
  });

  return {
    async listModules() {
      return (await registry.list())
        .filter((pkg) => pkg.enabled && (pkg.runtime === "declarative" || loader !== undefined))
        .map((pkg) => ({
          id: pkg.id,
          name: pkg.manifest.name,
          nsfw: pkg.nsfw,
          hasPopular: pkg.manifest.capabilities.includes("popular"),
          hasLatest: pkg.manifest.capabilities.includes("latest"),
        }));
    },
    async load({ moduleId, query, page, sectionId, filters }) {
      const { handle, manifest } = await mounter.mount(moduleId);
      return loadFromApi(
        handle,
        {
          hasLatest: manifest.capabilities.includes("latest"),
          hasPopular: manifest.capabilities.includes("popular"),
          hasHome: manifest.capabilities.includes("home"),
          hasFilters: manifest.capabilities.includes("filters"),
        },
        moduleId,
        query,
        page,
        sectionId,
        filters,
      );
    },
    async recallLastModule() {
      const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
        LAST_MODULE_SETTING,
      ]);
      return row?.value ?? null;
    },
    async rememberLastModule(id: string) {
      await driver.run(
        "INSERT INTO setting (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
        [LAST_MODULE_SETTING, id],
      );
    },
  };
}

// — Selección por plataforma —

/**
 * La fuente de la pantalla: en el dispositivo, los módulos instalados; en web (con o sin base
 * de datos, F14c/F49b) los módulos de ejemplo sobre `test-site`. La pantalla y
 * el hook no preguntan la plataforma: hablan con `DiscoverDataSource`.
 */
export async function resolveDiscoverSource(): Promise<DiscoverDataSource> {
  const driver = await openAppDatabase();
  if (driver === null || !isNativePlatform()) return createSampleDiscoverSource();
  return createInstalledDiscoverSource({
    driver,
    http: createFetchHttp(),
    loader: createFunctionScriptLoader(),
  });
}
