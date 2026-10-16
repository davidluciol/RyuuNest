/**
 * Transformaciones del módulo declarativo (SPEC §6.6, T16).
 *
 * Funciones puras (sin red ni HTML) que convierten el texto extraído de un sitio en
 * el valor que espera el contrato. La cadena de transformaciones de un campo se
 * aplica en orden.
 *
 * Decisiones de formato (P-50):
 * - `path` devuelve el **último segmento** de la ruta (`/serie/dragon-de-ceniza` →
 *   `dragon-de-ceniza`), que es el `id` estable de una serie.
 * - `absoluteUrl` resuelve una URL relativa contra la `baseUrl` del módulo.
 * - `join` solo vale cuando el campo se extrae con `all: true` (une la lista).
 */
import { ModuleError } from "../contract/errors.js";

/** Nombres de transformación admitidos (SPEC §6.6). */
export type TransformName =
  "trim" | "path" | "absoluteUrl" | "regex" | "number" | "join" | "replace";

/** Todos los nombres, en el orden del SPEC §6.6. */
export const TRANSFORM_NAMES = [
  "trim",
  "path",
  "absoluteUrl",
  "regex",
  "number",
  "join",
  "replace",
] as const satisfies readonly TransformName[];

/**
 * Una transformación: su nombre a secas (`"trim"`) o su nombre con argumentos
 * (`["replace", "mundo", "dragón"]`).
 */
export type TransformSpec = TransformName | readonly [TransformName, ...Array<string | number>];

/** Contexto que necesita alguna transformación (por ejemplo la `baseUrl`). */
export interface TransformContext {
  baseUrl: string;
}

function isTransformName(value: string): value is TransformName {
  return (TRANSFORM_NAMES as readonly string[]).includes(value);
}

/** Nombre de una transformación. */
export function transformName(spec: TransformSpec): TransformName {
  return typeof spec === "string" ? spec : spec[0];
}

/** Argumentos de una transformación (sin el nombre). */
export function transformArgs(spec: TransformSpec): readonly (string | number)[] {
  return typeof spec === "string" ? [] : spec.slice(1);
}

/** Último segmento de una ruta o URL (ignora consulta, ancla y barra final). */
function lastSegment(value: string): string {
  const withoutFragment = value.split("#")[0] ?? "";
  const withoutQuery = withoutFragment.split("?")[0] ?? "";
  const trimmed = withoutQuery.replace(/\/+$/u, "");
  const slash = trimmed.lastIndexOf("/");
  return slash === -1 ? trimmed : trimmed.slice(slash + 1);
}

/** Resuelve una URL relativa contra la base; una absoluta se queda igual. */
function toAbsoluteUrl(value: string, context: TransformContext): string {
  if (value === "") {
    return "";
  }
  try {
    return new URL(value, context.baseUrl).href;
  } catch {
    return value;
  }
}

function compile(pattern: string, flags: string): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch {
    throw new ModuleError("UNSUPPORTED", `Expresión regular no válida: ${pattern}`);
  }
}

/** Primer grupo de captura de `pattern` sobre `value` (o la coincidencia entera). */
export function regexCapture(value: string, pattern: string): string {
  const match = compile(pattern, "").exec(value);
  if (match === null) {
    return "";
  }
  return match[1] ?? match[0] ?? "";
}

/** Primer número de `value` (admite signo y decimales); cadena vacía si no hay. */
function firstNumber(value: string): string {
  const match = /-?\d+(?:\.\d+)?/u.exec(value);
  return match?.[0] ?? "";
}

/** Sustituye todas las coincidencias de la expresión regular `search`. */
function replaceAll(value: string, search: string, replacement: string): string {
  return value.replace(compile(search, "g"), replacement);
}

/** Une los valores no vacíos con `separator` (para campos `all: true`). */
export function joinValues(values: readonly string[], separator = ""): string {
  return values.filter((value) => value !== "").join(separator);
}

function applyOne(
  name: Exclude<TransformName, "join">,
  args: readonly (string | number)[],
  value: string,
  context: TransformContext,
): string {
  const arg = (index: number, fallback?: string): string => {
    const raw = args[index];
    if (raw !== undefined) {
      return String(raw);
    }
    if (fallback !== undefined) {
      return fallback;
    }
    throw new ModuleError("UNSUPPORTED", `La transformación «${name}» necesita más argumentos`);
  };

  switch (name) {
    case "trim":
      return value.trim();
    case "path":
      return lastSegment(value);
    case "absoluteUrl":
      return toAbsoluteUrl(value, context);
    case "regex":
      return regexCapture(value, arg(0));
    case "number":
      return firstNumber(value);
    case "replace":
      return replaceAll(value, arg(0), arg(1, ""));
  }
}

/** Aplica una cadena de transformaciones de texto a un valor. */
export function applyTransforms(
  value: string,
  specs: readonly TransformSpec[] | undefined,
  context: TransformContext,
): string {
  if (specs === undefined) {
    return value;
  }
  let result = value;
  for (const spec of specs) {
    const name = transformName(spec);
    if (!isTransformName(name)) {
      throw new ModuleError("UNSUPPORTED", `Transformación desconocida: ${name}`);
    }
    if (name === "join") {
      throw new ModuleError(
        "UNSUPPORTED",
        "«join» solo vale en un campo con «all: true» (une una lista)",
      );
    }
    result = applyOne(name, transformArgs(spec), result, context);
  }
  return result;
}
