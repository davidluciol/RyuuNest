/**
 * Verificación de Cloudflare con un navegador visible (F100, spike).
 *
 * Solo la llama la app tras un `BLOCKED` y con confirmación explícita del usuario;
 * **no** forma parte del `Host` de los módulos (un módulo no puede abrir el
 * navegador). Guarda solo `cf_clearance` y el `User-Agent` del navegador, por host
 * exacto y con caducidad; `ModuleHost` los envía después en `host.fetch`.
 */
import { ModuleError } from "../contract/errors.js";
import type { Clock } from "../ports/clock.js";
import { isAllowedHost } from "./ModuleHost.js";

/** Lo que devuelve el navegador al superar el reto. */
export interface ChallengeSolution {
  /**
   * Valor de la cookie `cf_clearance` (sin el nombre). `null` = el navegador no
   * puede leerla (Expo Go, sin módulo de cookies) y viaja en el tarro de cookies
   * compartido de la plataforma; entonces solo se fija el `User-Agent`.
   */
  cfClearance: string | null;
  /** User-Agent con el que el navegador superó el reto: Cloudflare lo exige igual. */
  userAgent: string;
  /** Caducidad de la cookie (ms desde la época), si el navegador la conoce. */
  expiresAt?: number;
}

/** Verificación guardada para un host. */
export interface Clearance {
  cfClearance: string | null;
  userAgent: string;
  expiresAt: number;
}

/**
 * Puerto del navegador visible (WebView en el dispositivo). Abre `url`, deja que
 * el usuario vea el reto y devuelve la solución, o `null` si lo cierra o no se
 * supera. El adaptador no expone puente JS al sitio ni lee otra cookie.
 */
export interface ChallengeBrowser {
  solve(url: string): Promise<ChallengeSolution | null>;
}

/**
 * Almacén de verificaciones por host. En el dispositivo debe ser un almacén de
 * secretos; nunca entra en respaldos ni en diagnóstico.
 */
export interface ClearanceStore {
  get(host: string): Promise<Clearance | undefined>;
  set(host: string, clearance: Clearance): Promise<void>;
  delete(host: string): Promise<void>;
}

/** Almacén en memoria (pruebas y web). */
export class MemoryClearanceStore implements ClearanceStore {
  private readonly values = new Map<string, Clearance>();
  async get(host: string): Promise<Clearance | undefined> {
    return this.values.get(host);
  }
  async set(host: string, clearance: Clearance): Promise<void> {
    this.values.set(host, clearance);
  }
  async delete(host: string): Promise<void> {
    this.values.delete(host);
  }
}

/**
 * Caducidad cuando el navegador no la informa: 30 min es el «Challenge Passage»
 * por defecto de Cloudflare. Provisional hasta medirlo en el S25 (F100).
 */
export const CLEARANCE_FALLBACK_TTL_MS = 30 * 60 * 1000;

// Caracteres de valor de cookie (RFC 6265 cookie-octet): sin `;`, `,`, espacios ni controles.
const COOKIE_VALUE = /^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/;
// User-Agent imprimible, sin saltos de línea (evita inyectar cabeceras).
const USER_AGENT = /^[\x20-\x7E]+$/;

export interface SolveChallengeOptions {
  /** Dominios declarados por el módulo (`permissions.domains`). */
  domains: readonly string[];
  browser: ChallengeBrowser;
  store: ClearanceStore;
  clock: Clock;
  /** Hoja de confirmación: el usuario acepta abrir el navegador para `host`. */
  confirm: (host: string) => Promise<boolean>;
}

/**
 * Valida la URL (https y dominio del módulo), pide confirmación, abre el navegador
 * y guarda la verificación. Devuelve si quedó guardada.
 */
export async function solveChallenge(
  url: string,
  options: SolveChallengeOptions,
): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new ModuleError("UNSUPPORTED", `URL no válida: ${url}`, { url });
  }
  if (parsed.protocol !== "https:") {
    throw new ModuleError("UNSUPPORTED", `Protocolo no permitido: ${parsed.protocol}`, { url });
  }
  const host = parsed.hostname.toLowerCase();
  if (!isAllowedHost(host, options.domains)) {
    throw new ModuleError("UNSUPPORTED", `Dominio no permitido: ${host}`, { url });
  }

  if (!(await options.confirm(host))) {
    return false;
  }

  const solution = await options.browser.solve(parsed.href);
  if (
    solution === null ||
    (solution.cfClearance !== null && !COOKIE_VALUE.test(solution.cfClearance)) ||
    !USER_AGENT.test(solution.userAgent)
  ) {
    return false;
  }

  await options.store.set(host, {
    cfClearance: solution.cfClearance,
    userAgent: solution.userAgent,
    expiresAt: solution.expiresAt ?? options.clock.now() + CLEARANCE_FALLBACK_TTL_MS,
  });
  return true;
}
