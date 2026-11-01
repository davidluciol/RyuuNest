/**
 * Utilidades de URL del protocolo. El «dominio» que autoriza el usuario es el
 * **host exacto** de la petición (decisión del humano, P-117): sin subdominios
 * implícitos ni lista de sufijos públicos.
 */

/** Host en minúsculas de una URL `http(s)`; `null` si no es una URL válida de esos esquemas. */
export function hostOf(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  return parsed.hostname.toLowerCase();
}

/** Patrón de origen del navegador (`permissions.request`) que concede exactamente un host. */
export function originPatternFor(host: string): string {
  return `*://${host}/*`;
}
