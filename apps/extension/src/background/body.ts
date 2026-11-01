import { bytesToBase64, type BodyEncoding } from "@ryuunest/extension-protocol";

/**
 * F26 — codificación del cuerpo de la respuesta (SPEC §10: «texto o base64»).
 * Los tipos de texto viajan como texto (decodificados con el charset que
 * declaren, UTF-8 si no); todo lo demás va en base64 exacto, sin pasar por UTF-8.
 */

const TEXTUAL_APPLICATION_TYPES = new Set([
  "application/json",
  "application/xml",
  "application/xhtml+xml",
  "application/javascript",
  "application/x-javascript",
]);

function mediaTypeOf(contentType: string): string {
  return contentType.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isTextual(contentType: string | null): boolean {
  if (contentType === null) return false;
  const mediaType = mediaTypeOf(contentType);
  return (
    mediaType.startsWith("text/") ||
    TEXTUAL_APPLICATION_TYPES.has(mediaType) ||
    mediaType.endsWith("+json") ||
    mediaType.endsWith("+xml")
  );
}

function charsetOf(contentType: string): string | null {
  const match = /charset\s*=\s*"?([^;"\s]+)/i.exec(contentType);
  return match?.[1] ?? null;
}

function decode(bytes: Uint8Array, contentType: string): string {
  try {
    return new TextDecoder(charsetOf(contentType) ?? "utf-8").decode(bytes);
  } catch {
    // Etiqueta de charset desconocida: se vuelve a UTF-8 en lugar de fallar.
    return new TextDecoder("utf-8").decode(bytes);
  }
}

export function encodeBody(
  bytes: Uint8Array,
  contentType: string | null,
): { encoding: BodyEncoding; body: string } {
  if (contentType !== null && isTextual(contentType)) {
    return { encoding: "text", body: decode(bytes, contentType) };
  }
  return { encoding: "base64", body: bytesToBase64(bytes) };
}
