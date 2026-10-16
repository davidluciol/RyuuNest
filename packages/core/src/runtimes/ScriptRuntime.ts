/**
 * Runtime de módulos script (SPEC §6.5, T18).
 *
 * Un módulo script exporta una fábrica `create(host)` que devuelve una `ModuleApi`. El
 * núcleo le pasa **solo** el `Host`: los permisos de dominio, el tiempo límite y el
 * límite de concurrencia los aplica el host, así que un módulo no tiene por qué hacer red
 * por su cuenta. Todo error del módulo se convierte en `ModuleError`, de modo que un
 * módulo roto no tumba la app (RNF-8).
 *
 * La **carga** del código fuente entra inyectada por el puerto `ScriptLoader`; la
 * implementación de plataforma es del cliente.
 *
 * ⚠️ Limitación conocida (**D-5**): en la v1 **no hay aislamiento real**. El módulo corre
 * en el mismo contexto que la app y la única frontera es la API del host que se le
 * entrega. Un módulo malicioso podría llamar a globales de la plataforma; se acepta como
 * riesgo conocido del nivel «script» (SPEC §5.4).
 */
import type {
  ChapterPages,
  Host,
  ModuleApi,
  Page,
  SeriesDetails,
  SeriesSummary,
} from "../contract/types.js";
import { ModuleError } from "../contract/errors.js";
import type { ScriptFactory, ScriptLoader } from "../ports/scriptLoader.js";

/** Opciones del runtime. */
export interface ScriptRuntimeOptions {
  host: Host;
  loader: ScriptLoader;
  /** Código fuente del archivo de entrada del módulo (`manifest.entry`). */
  source: string;
}

/** Métodos que todo módulo debe implementar (SPEC §6.3). */
const REQUIRED_METHODS = ["search", "details", "pages"] as const;

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Convierte cualquier fallo del módulo en un `ModuleError` del contrato. */
function toModuleError(error: unknown): ModuleError {
  if (error instanceof ModuleError) {
    return error;
  }
  return new ModuleError("INTERNAL", describe(error));
}

export class ScriptRuntime {
  readonly #host: Host;
  readonly #loader: ScriptLoader;
  readonly #source: string;

  constructor(options: ScriptRuntimeOptions) {
    this.#host = options.host;
    this.#loader = options.loader;
    this.#source = options.source;
  }

  /** Carga el módulo y devuelve su `ModuleApi` envuelta. */
  async createApi(): Promise<ModuleApi> {
    const module = await this.#instantiate(await this.#load());
    this.#assertContract(module);

    const call = <R>(name: string, args: unknown[]): Promise<R> =>
      this.#invoke<R>(module, name, args);

    const api: ModuleApi = {
      search: (query, page) => call<Page<SeriesSummary>>("search", [query, page]),
      details: (seriesId) => call<SeriesDetails>("details", [seriesId]),
      pages: (chapterId, releaseId) => call<ChapterPages>("pages", [chapterId, releaseId]),
    };

    if (typeof module["popular"] === "function") {
      api.popular = (page) => call<Page<SeriesSummary>>("popular", [page]);
    }
    if (typeof module["latest"] === "function") {
      api.latest = (page) => call<Page<SeriesSummary>>("latest", [page]);
    }
    return api;
  }

  async #load(): Promise<ScriptFactory> {
    try {
      return await this.#loader.load(this.#source);
    } catch (error) {
      throw new ModuleError("INTERNAL", `No se pudo cargar el módulo: ${describe(error)}`);
    }
  }

  async #instantiate(factory: ScriptFactory): Promise<Record<string, unknown>> {
    let module: unknown;
    try {
      module = await factory(this.#host);
    } catch (error) {
      throw toModuleError(error);
    }
    if (module === null || typeof module !== "object") {
      throw new ModuleError("INTERNAL", "El módulo script no devolvió una ModuleApi");
    }
    return module as Record<string, unknown>;
  }

  #assertContract(module: Record<string, unknown>): void {
    for (const name of REQUIRED_METHODS) {
      if (typeof module[name] !== "function") {
        throw new ModuleError("INTERNAL", `El módulo script no implementa ${name}()`);
      }
    }
  }

  async #invoke<R>(module: Record<string, unknown>, name: string, args: unknown[]): Promise<R> {
    const fn = module[name];
    if (typeof fn !== "function") {
      throw new ModuleError("INTERNAL", `El módulo script no implementa ${name}()`);
    }
    try {
      const callable = fn as (...callArgs: unknown[]) => unknown;
      return (await callable(...args)) as R;
    } catch (error) {
      throw toModuleError(error);
    }
  }
}
