/**
 * Punto único de montaje de un módulo instalado (SPEC §5.4, D-5 y §6.3, T20).
 *
 * El resto del núcleo no sabe qué runtime hay detrás: `createModuleRuntime` elige
 * **declarativo** o **script** según `manifest.runtime`, y `createModuleApi` devuelve su
 * `ModuleApi` con los fallos **contenidos**: cualquier excepción del módulo se traduce a
 * un `ModuleError` (SPEC §6.4) y queda anotada como último error, para guardarla en
 * `module.last_error` (SPEC §8.1, RF-5). Un módulo roto no tumba la app (RNF-8).
 *
 * La interfaz `ModuleRuntime` es la costura que permite cambiar el motor sin tocar el
 * resto (D-5: en la v1 los scripts corren sin aislamiento real).
 */
import type { Host, ModuleApi, ModuleManifest } from "../contract/types.js";
import { ModuleError } from "../contract/errors.js";
import type { ScriptLoader } from "../ports/scriptLoader.js";
import { DeclarativeRuntime, type DeclarativeConfig } from "./DeclarativeRuntime.js";
import { describeError, toModuleError } from "./errorMapping.js";
import { ScriptRuntime } from "./ScriptRuntime.js";

/**
 * Interfaz común de los runtimes de módulo (SPEC §5.4): lo único que el resto del núcleo
 * ve. La implementan `DeclarativeRuntime` y `ScriptRuntime`.
 */
export interface ModuleRuntime {
  createApi(): ModuleApi | Promise<ModuleApi>;
}

/** Cómo montar la API de un módulo ya instalado. */
export interface CreateModuleApiOptions {
  /** Manifest del módulo; `runtime` decide qué motor se monta (SPEC §6.1). */
  manifest: ModuleManifest;
  /**
   * Contenido del archivo de entrada (`manifest.entry`) ya en texto: el `index.json` de
   * un módulo declarativo o el código fuente de uno script.
   */
  entry: string;
  host: Host;
  /** Carga de módulos script (SPEC §6.5). Obligatoria si `manifest.runtime === "script"`. */
  loader?: ScriptLoader;
}

/** API montada de un módulo, con la memoria de su último fallo. */
export interface ModuleApiHandle {
  /** La `ModuleApi` del módulo (SPEC §6.3); nunca propaga un fallo no controlado. */
  api: ModuleApi;
  /** Último fallo contenido, para `ModuleRegistry.setLastError` (SPEC §8.1, RF-5). */
  lastError(): ModuleError | undefined;
}

/** Elige el runtime de un módulo instalado según `manifest.runtime`. */
export function createModuleRuntime(options: CreateModuleApiOptions): ModuleRuntime {
  const runtime = options.manifest.runtime;

  if (runtime === "declarative") {
    return new DeclarativeRuntime({
      config: parseDeclarativeConfig(options.entry),
      host: options.host,
      baseUrl: options.manifest.baseUrl,
    });
  }

  if (runtime === "script") {
    const loader = options.loader;
    if (loader === undefined) {
      throw new ModuleError(
        "UNSUPPORTED",
        "Un módulo script necesita un cargador (ScriptLoader) para montarse",
      );
    }
    return new ScriptRuntime({ host: options.host, loader, source: options.entry });
  }

  throw new ModuleError("UNSUPPORTED", `Runtime de módulo desconocido: ${String(runtime)}`);
}

/** Monta la `ModuleApi` de un módulo instalado, con sus fallos contenidos. */
export async function createModuleApi(options: CreateModuleApiOptions): Promise<ModuleApiHandle> {
  const runtime = createModuleRuntime(options);
  let last: ModuleError | undefined;

  const api = guardApi(await runtime.createApi(), (error) => {
    last = error;
  });

  return { api, lastError: () => last };
}

/** El `index.json` de un módulo declarativo (SPEC §6.6). */
function parseDeclarativeConfig(entry: string): DeclarativeConfig {
  let parsed: unknown;
  try {
    parsed = JSON.parse(entry);
  } catch (error) {
    throw new ModuleError(
      "PARSE",
      `El index.json del módulo no es JSON válido: ${describeError(error)}`,
    );
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ModuleError("PARSE", "El index.json del módulo debe ser un objeto");
  }

  return parsed as DeclarativeConfig;
}

/**
 * Envuelve la API para que todo fallo salga como `ModuleError` y quede anotado. Los
 * runtime ya contienen lo suyo; esto es la última red: cubre un runtime que lance algo
 * suelto y deja el error listo para `module.last_error`.
 */
function guardApi(api: ModuleApi, record: (error: ModuleError) => void): ModuleApi {
  const run = async <R>(call: () => Promise<R>): Promise<R> => {
    try {
      return await call();
    } catch (error) {
      const moduleError = toModuleError(error);
      record(moduleError);
      throw moduleError;
    }
  };

  const guarded: ModuleApi = {
    search: (query, page) => run(() => api.search(query, page)),
    details: (seriesId) => run(() => api.details(seriesId)),
    pages: (chapterId, releaseId) => run(() => api.pages(chapterId, releaseId)),
  };

  const popular = api.popular;
  if (popular !== undefined) {
    guarded.popular = (page) => run(() => popular(page));
  }
  const latest = api.latest;
  if (latest !== undefined) {
    guarded.latest = (page) => run(() => latest(page));
  }

  return guarded;
}
