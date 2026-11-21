import { isAllowedHost } from "@ryuunest/core";

/**
 * F100 — reglas puras del navegador de verificación (sin `react-native`, para
 * Vitest): a dónde puede navegar el marco principal y qué cookie se toma.
 */

/** El marco principal solo navega por https a los dominios del módulo. */
export function allowsNavigation(url: string, domains: readonly string[]): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && isAllowedHost(parsed.hostname.toLowerCase(), domains);
  } catch {
    return false;
  }
}

/** Cookie tal como la devuelve `@react-native-cookies/cookies`. */
export interface NativeCookie {
  value: string;
  expires?: string;
}

/** Toma solo `cf_clearance` (y su caducidad si se conoce); el resto se ignora. */
export function pickClearance(
  cookies: Record<string, NativeCookie> | null | undefined,
): { value: string; expiresAt?: number } | null {
  const cookie = cookies?.["cf_clearance"];
  if (cookie === undefined || cookie.value === "") return null;
  const expiresAt = cookie.expires === undefined ? Number.NaN : Date.parse(cookie.expires);
  return Number.isFinite(expiresAt) ? { value: cookie.value, expiresAt } : { value: cookie.value };
}
