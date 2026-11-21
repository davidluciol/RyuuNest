/**
 * `ModuleHost` (SPEC §6.5): la única puerta del módulo script hacia el exterior.
 *
 * Aplica permisos por dominio, tiempo límite por petición, máximo de peticiones
 * simultáneas y pausa mínima entre peticiones al mismo dominio. Se apoya en los
 * puertos `Http` y `Clock`, así que no depende de plataforma.
 */
import type { Host, HostRequestInit, HostResponse, HtmlDocument } from "../contract/types.js";
import { ModuleError } from "../contract/errors.js";
import type { Clock } from "../ports/clock.js";
import type { Http } from "../ports/http.js";
import type { Clearance, ClearanceStore } from "./challenge.js";
import { parseHtml } from "./html.js";

export type HostLogLevel = "debug" | "info" | "warn" | "error";

/** Destino de `host.log`. */
export type HostLogger = (level: HostLogLevel, message: string, data?: unknown) => void;

/** Almacén de `host.settings`. */
export interface ModuleSettings {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
}

/** Opciones del host. */
export interface ModuleHostOptions {
  http: Http;
  clock: Clock;
  /** Dominios a los que el módulo puede llamar. */
  permissions: { domains: string[] };
  /** Tiempo límite por petición, en ms. */
  timeoutMs?: number;
  /** Máximo de peticiones simultáneas. */
  maxConcurrent?: number;
  /** Pausa mínima entre peticiones al mismo dominio, en ms. */
  minDelayMs?: number;
  logger?: HostLogger;
  /** Por defecto, un almacén en memoria. */
  settings?: ModuleSettings;
  /** Verificaciones de Cloudflare guardadas por la app (F100). Sin él, no se envían. */
  clearances?: ClearanceStore;
}

/**
 * Valores por defecto de las políticas del host. El SPEC §6.5 no los fija; son
 * ajustables por módulo y se revisan con las mediciones de T35.
 */
export const HOST_DEFAULTS = {
  timeoutMs: 15_000,
  maxConcurrent: 4,
  minDelayMs: 250,
} as const;

function createMemorySettings(): ModuleSettings {
  const values = new Map<string, string>();
  return {
    get: (key) => values.get(key),
    set: (key, value) => {
      values.set(key, value);
    },
  };
}

/** ¿`host` es uno de `domains` o un subdominio suyo? `domains` en minúsculas. */
export function isAllowedHost(host: string, domains: readonly string[]): boolean {
  return domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}

/**
 * Cabeceras con la verificación aplicada (F100): sustituye el `User-Agent` y el
 * `cf_clearance` del módulo; conserva el resto de cookies y cabeceras.
 */
function withClearance(
  headers: Record<string, string> | undefined,
  clearance: Clearance,
): Record<string, string> {
  const result: Record<string, string> = {};
  const jar = clearance.cfClearance === null;
  let cookie = "";
  for (const [name, value] of Object.entries(headers ?? {})) {
    const lower = name.toLowerCase();
    if (lower === "user-agent") continue;
    if (lower === "cookie" && !jar) {
      cookie = value
        .split(";")
        .map((part) => part.trim())
        .filter((part) => part !== "" && !part.startsWith("cf_clearance="))
        .join("; ");
      continue;
    }
    result[name] = value;
  }
  result["User-Agent"] = clearance.userAgent;
  if (jar) return result;
  const own = `cf_clearance=${clearance.cfClearance}`;
  result["Cookie"] = cookie === "" ? own : `${cookie}; ${own}`;
  return result;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ModuleHost implements Host {
  readonly settings: ModuleSettings;

  private readonly http: Http;
  private readonly clock: Clock;
  private readonly domains: readonly string[];
  private readonly timeoutMs: number;
  private readonly maxConcurrent: number;
  private readonly minDelayMs: number;
  private readonly logger: HostLogger;
  private readonly clearances: ClearanceStore | undefined;
  private readonly lastRequestAt = new Map<string, number>();
  /**
   * Cadena por dominio para que la comprobación y la espera de `respectDelay`
   * sean atómicas: bajo carga, varias peticiones al mismo dominio no pueden
   * pasar la pausa mínima a la vez (T34).
   */
  private readonly domainChains = new Map<string, Promise<void>>();
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(options: ModuleHostOptions) {
    this.http = options.http;
    this.clock = options.clock;
    this.domains = options.permissions.domains.map((domain) => domain.toLowerCase());
    this.timeoutMs = options.timeoutMs ?? HOST_DEFAULTS.timeoutMs;
    this.maxConcurrent = Math.max(1, options.maxConcurrent ?? HOST_DEFAULTS.maxConcurrent);
    this.minDelayMs = Math.max(0, options.minDelayMs ?? HOST_DEFAULTS.minDelayMs);
    this.logger = options.logger ?? (() => {});
    this.settings = options.settings ?? createMemorySettings();
    this.clearances = options.clearances;
  }

  async fetch(url: string, init?: HostRequestInit): Promise<HostResponse> {
    const domain = this.assertDomain(url);
    const request = await this.applyClearance(url, domain, init);

    await this.acquire();
    try {
      await this.respectDelay(domain);
      return await this.withTimeout(url, request);
    } finally {
      this.release();
    }
  }

  html(text: string): HtmlDocument {
    return parseHtml(text);
  }

  log(level: HostLogLevel, message: string, data?: unknown): void {
    this.logger(level, message, data);
  }

  /** Comprueba la URL y devuelve su dominio si está permitido. */
  private assertDomain(url: string): string {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new ModuleError("UNSUPPORTED", `URL no válida: ${url}`, { url });
    }

    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      throw new ModuleError("UNSUPPORTED", `Protocolo no permitido: ${parsed.protocol}`, { url });
    }

    const host = parsed.hostname.toLowerCase();
    if (!isAllowedHost(host, this.domains)) {
      throw new ModuleError("UNSUPPORTED", `Dominio no permitido: ${host}`, { url });
    }

    return host;
  }

  /**
   * Añade la verificación guardada para este host exacto, solo por https y si no
   * ha caducado; la caducada se borra (F100).
   */
  private async applyClearance(
    url: string,
    host: string,
    init?: HostRequestInit,
  ): Promise<HostRequestInit | undefined> {
    if (this.clearances === undefined || !url.toLowerCase().startsWith("https:")) {
      return init;
    }
    const clearance = await this.clearances.get(host);
    if (clearance === undefined) {
      return init;
    }
    if (clearance.expiresAt <= this.clock.now()) {
      await this.clearances.delete(host);
      return init;
    }
    return { ...init, headers: withClearance(init?.headers, clearance) };
  }

  private async withTimeout(url: string, init?: HostRequestInit): Promise<HostResponse> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(
        () => reject(new ModuleError("TIMEOUT", `Tiempo límite agotado: ${url}`, { url })),
        this.timeoutMs,
      );
    });

    try {
      const response = await Promise.race([this.http.request(url, init), timeout]);
      return {
        status: response.status,
        headers: response.headers,
        url: response.url ?? url,
        text: () => response.text(),
        bytes: () => response.bytes(),
      };
    } catch (error) {
      if (error instanceof ModuleError) {
        throw error;
      }
      throw new ModuleError("NETWORK", `Fallo de red al pedir ${url}`, { url });
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }

  /**
   * Espera, si hace falta, para respetar la pausa mínima del dominio. La
   * comprobación y la espera van encadenadas por dominio, así que bajo carga
   * concurrente los inicios reales también quedan espaciados (T34).
   */
  private respectDelay(domain: string): Promise<void> {
    const previous = this.domainChains.get(domain) ?? Promise.resolve();
    const next = previous.then(() => this.waitForSlot(domain));
    // La cadena nunca se rompe aunque una espera falle.
    this.domainChains.set(
      domain,
      next.catch(() => {}),
    );
    return next;
  }

  private async waitForSlot(domain: string): Promise<void> {
    const last = this.lastRequestAt.get(domain);
    if (last !== undefined) {
      const wait = this.minDelayMs - (this.clock.now() - last);
      if (wait > 0) {
        await sleep(wait);
      }
    }
    this.lastRequestAt.set(domain, this.clock.now());
  }

  private async acquire(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });
    this.active += 1;
  }

  private release(): void {
    this.active -= 1;
    const next = this.waiters.shift();
    if (next !== undefined) {
      next();
    }
  }
}
