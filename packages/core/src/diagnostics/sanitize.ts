/**
 * Saneado de la redacción del registro (P-72).
 *
 * Todo lo que entra en la tabla `log` pasa por aquí antes de escribirse: el
 * registro de diagnóstico puede viajar fuera del dispositivo (export en
 * Ajustes → Diagnóstico), así que **nunca** debe llevar credenciales, cookies,
 * cabeceras, HTML, títulos de obras, URLs completas ni rutas locales.
 */

/** Longitud máxima del mensaje saneado. */
export const MAX_MESSAGE_LENGTH = 500;
/** Longitud máxima del contexto serializado en JSON. */
export const MAX_CONTEXT_CHARS = 2_500;

const URL_PATTERN = /https?:\/\/[^\s"'`<>]+/gi;
// El valor de una cabecera puede llevar espacios internos ("Bearer <token>"),
// así que se consume hasta el delimitador de lista o el fin de línea.
const HEADER_PATTERN =
  /\b(authorization|cookie|set-cookie|x-api-key|api-key|access[_-]?token|refresh[_-]?token)\b\s*[:=]\s*[^\n,;"']+/gi;
const HTML_TAG_PATTERN = /<\/?[a-zA-Z][^>]*>/g;
const ANDROID_PATH_PATTERN = /\/(?:data|storage\/emulated)\/[^\s"'`<>]*/g;
const WINDOWS_PATH_PATTERN = /\b[a-zA-Z]:\\[^\s"'`<>]*/g;

/**
 * Claves de objeto cuyo valor siempre se redonta: si un contexto trae
 * cabeceras como objeto (`{ Authorization: "Bearer …" }`), el patrón de
 * texto no las alcanza (en JSON la clave y el valor van entre comillas), así
 * que se detectan por nombre de clave, no por contenido.
 */
const SENSITIVE_KEY_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|api-key|access[_-]?token|refresh[_-]?token|proxy-authorization)$/i;

/** Reemplaza un valor sensible por un marcador, sin revelar nada. */
function redact(_match: string, name: string): string {
  return `[${name.toLowerCase()}]`;
}

/**
 * Sanea un texto libre: URLs, cabeceras con credenciales, HTML y rutas
 * locales, y lo trunca. Devuelve texto plano, sin etiquetas.
 */
export function sanitizeText(text: string): string {
  const withoutUrls = text.replace(URL_PATTERN, "[url]");
  const withoutHeaders = withoutUrls.replace(HEADER_PATTERN, redact);
  const withoutHtml = withoutHeaders.replace(HTML_TAG_PATTERN, "");
  const withoutPaths = withoutHtml
    .replace(ANDROID_PATH_PATTERN, "[ruta]")
    .replace(WINDOWS_PATH_PATTERN, "[ruta]");
  const collapsed = withoutPaths.replace(/\s+/g, " ").trim();
  return collapsed.length > MAX_MESSAGE_LENGTH
    ? `${collapsed.slice(0, MAX_MESSAGE_LENGTH - 1)}…`
    : collapsed;
}

/** Sanea un valor del contexto: recursivo, con profundidad y tamaño limitados. */
export function sanitizeContextValue(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return sanitizeText(value);
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }
  if (depth >= 3) {
    return "[profundidad]";
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeContextValue(item, depth + 1));
  }
  if (typeof value === "object" && value !== null) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value).slice(0, 20)) {
      const cleanKey = sanitizeText(key);
      // Una clave sensible redonta todo su valor, sea string u objeto.
      out[cleanKey] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeContextValue(item, depth + 1);
    }
    return out;
  }
  return "[tipo]";
}

/** Sanea un contexto completo y limita su tamaño serializado. */
export function sanitizeContext(context: unknown): Record<string, unknown> | undefined {
  if (context === undefined || context === null) {
    return undefined;
  }
  const saneado = sanitizeContextValue(context);
  if (typeof saneado !== "object" || saneado === null || Array.isArray(saneado)) {
    return { value: saneado };
  }
  let json = JSON.stringify(saneado);
  if (json.length > MAX_CONTEXT_CHARS) {
    json = `${json.slice(0, MAX_CONTEXT_CHARS - 1)}…`;
  }
  return JSON.parse(json) as Record<string, unknown>;
}
