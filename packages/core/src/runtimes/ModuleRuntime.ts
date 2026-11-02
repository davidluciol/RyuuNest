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
import { detailsShapeViolation, pageShapeViolation, pagesShapeViolation } from "./contractShape.js";
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
  /**
   * Contenido de **todos** los archivos del paquete (ruta → texto). Solo lo usa
   * el runtime `script` (R1): si falta, el paquete degenera a solo la entrada.
   */
  files?: Record<string, string>;
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
    return new ScriptRuntime({
      host: options.host,
      loader,
      // `entry` es el contenido del archivo de entrada; la ruta es `manifest.entry`.
      files: options.files ?? { [options.manifest.entry]: options.entry },
      entry: options.manifest.entry,
    });
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
 * suelto, deja el error listo para `module.last_error` y valida la **forma mínima**
 * del contrato (SPEC §6.2) en lo que devuelve cada método: otra cosa es `PARSE`, no
 * una pantalla rota (T37, R4 del ADR-0003). La validación tolera campos extra y solo
 * exige los obligatorios, para no romper módulos publicados.
 */
function guardApi(api: ModuleApi, record: (error: ModuleError) => void): ModuleApi {
  const run = async <R>(
    name: string,
    call: () => Promise<R>,
    violation?: (value: R) => string | undefined,
  ): Promise<R> => {
    try {
      const value = await call();
      const problem = violation?.(value);
      if (problem !== undefined) {
        throw new ModuleError(
          "PARSE",
          `${name}() devolvió una forma fuera del contrato (SPEC §6.2): ${problem}`,
        );
      }
      return value;
    } catch (error) {
      const moduleError = toModuleError(error);
      record(moduleError);
      throw moduleError;
    }
  };

  const guarded: ModuleApi = {
    search: (query, page) => run("search", () => api.search(query, page), pageShapeViolation),
    details: (seriesId) => run("details", () => api.details(seriesId), detailsShapeViolation),
    pages: (chapterId, releaseId) =>
      run("pages", () => api.pages(chapterId, releaseId), pagesShapeViolation),
  };

  const popular = api.popular;
  if (popular !== undefined) {
    guarded.popular = (page) => run("popular", () => popular(page), pageShapeViolation);
  }
  const latest = api.latest;
  if (latest !== undefined) {
    guarded.latest = (page) => run("latest", () => latest(page), pageShapeViolation);
  }

  return guarded;
}
