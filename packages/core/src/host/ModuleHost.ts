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
  private readonly lastRequestAt = new Map<string, number>();
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
  }

  async fetch(url: string, init?: HostRequestInit): Promise<HostResponse> {
    const domain = this.assertDomain(url);

    await this.acquire();
    try {
      await this.respectDelay(domain);
      return await this.withTimeout(url, init);
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
    const allowed = this.domains.some((domain) => host === domain || host.endsWith(`.${domain}`));
    if (!allowed) {
      throw new ModuleError("UNSUPPORTED", `Dominio no permitido: ${host}`, { url });
    }

    return host;
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

  /** Espera, si hace falta, para respetar la pausa mínima del dominio. */
  private async respectDelay(domain: string): Promise<void> {
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
