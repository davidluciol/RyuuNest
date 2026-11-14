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
 * - `date` (L4) y `map` (L6) los añade T39: ver `docs/declarative-format.md`.
 */
import { ModuleError } from "../contract/errors.js";

/** Nombres de transformación admitidos (SPEC §6.6). */
export type TransformName =
  "trim" | "path" | "absoluteUrl" | "regex" | "number" | "join" | "replace" | "date" | "map";

/** Todos los nombres, en el orden del SPEC §6.6. */
export const TRANSFORM_NAMES = [
  "trim",
  "path",
  "absoluteUrl",
  "regex",
  "number",
  "join",
  "replace",
  "date",
  "map",
] as const satisfies readonly TransformName[];

/** Argumento de una transformación; el objeto solo lo usa `map`. */
export type TransformArg = string | number | Readonly<Record<string, string>>;

/**
 * Una transformación: su nombre a secas (`"trim"`) o su nombre con argumentos
 * (`["replace", "mundo", "dragón"]`, `["map", { "En emisión": "ongoing" }]`).
 */
export type TransformSpec = TransformName | readonly [TransformName, ...TransformArg[]];

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
export function transformArgs(spec: TransformSpec): readonly TransformArg[] {
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

/** Partes de un formato de `date`: tokens (`YYYY`, `MM`, `DD`, `HH`, `mm`, `ss`) o literales. */
const DATE_TOKEN = /YYYY|MM|DD|HH|mm|ss/gu;

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/**
 * `["date", "DD/MM/YYYY"]` (L4): fecha del sitio → ISO 8601. Sin hora, solo fecha
 * (`2026-05-27`); con hora, UTC (`2026-05-27T18:30:00Z`). Si el valor no encaja con
 * el formato o la fecha no existe, devuelve `""` (el campo se omite). No usa
 * `Date.parse`, que interpreta distinto en Hermes y en V8.
 */
function toIsoDate(value: string, format: string): string {
  const order: string[] = [];
  let pattern = "";
  let last = 0;
  for (const match of format.matchAll(DATE_TOKEN)) {
    pattern += escapeRegex(format.slice(last, match.index));
    pattern += match[0] === "YYYY" ? "(\\d{4})" : "(\\d{1,2})";
    order.push(match[0]);
    last = match.index + match[0].length;
  }
  pattern += escapeRegex(format.slice(last));
  if (!["YYYY", "MM", "DD"].every((token) => order.includes(token))) {
    throw new ModuleError("UNSUPPORTED", `El formato de «date» necesita YYYY, MM y DD: ${format}`);
  }

  const match = new RegExp(`^${pattern}$`, "u").exec(value.trim());
  if (match === null) {
    return "";
  }
  const part = (token: string): number => {
    const index = order.indexOf(token);
    return index === -1 ? 0 : Number(match[index + 1]);
  };
  const [year, month, day] = [part("YYYY"), part("MM"), part("DD")];
  const [hour, minute, second] = [part("HH"), part("mm"), part("ss")];
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  // Date.UTC desborda (31/02 → 02/03): si no coincide al volver, la fecha no existe.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    return "";
  }
  const iso = date.toISOString();
  return order.includes("HH") ? `${iso.slice(0, 19)}Z` : iso.slice(0, 10);
}

/**
 * `["map", { "En emisión": "ongoing" }]` (L6): traduce el valor (recortado y sin
 * distinguir mayúsculas). Sin coincidencia, el valor sigue igual. El mapa viene de
 * un `index.json` descargado: se recorre con `Object.entries`, nunca `objeto[valor]`,
 * para que `constructor` o `__proto__` no resuelvan nada.
 */
function mapValue(value: string, table: TransformArg | undefined): string {
  if (typeof table !== "object" || table === null || Array.isArray(table)) {
    throw new ModuleError("UNSUPPORTED", "La transformación «map» necesita un objeto");
  }
  const key = value.trim().toLowerCase();
  for (const [from, to] of Object.entries(table)) {
    if (from.trim().toLowerCase() === key && typeof to === "string") {
      return to;
    }
  }
  return value;
}

/** Une los valores no vacíos con `separator` (para campos `all: true`). */
export function joinValues(values: readonly string[], separator = ""): string {
  return values.filter((value) => value !== "").join(separator);
}

function applyOne(
  name: Exclude<TransformName, "join">,
  args: readonly TransformArg[],
  value: string,
  context: TransformContext,
): string {
  const arg = (index: number, fallback?: string): string => {
    const raw = args[index];
    if (typeof raw === "string" || typeof raw === "number") {
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
    case "date":
      return toIsoDate(value, arg(0));
    case "map":
      return mapValue(value, args[0]);
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
