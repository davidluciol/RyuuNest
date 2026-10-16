/**
 * Adaptadores falsos de los puertos (SPEC §5.3), para las pruebas del núcleo.
 *
 * Son deterministas y sin dependencias de plataforma. Las implementaciones reales
 * (SQLite/IndexedDB, cliente nativo/extensión, unzip, auth) llegan en su tarea.
 */
import type { Archive, ArchiveEntry } from "./archive.js";
import { utf8Encode } from "../bytes.js";
import type { Clock } from "./clock.js";
import type { Http, HttpRequest, HttpResponse } from "./http.js";
import type { ScriptFactory, ScriptLoader } from "./scriptLoader.js";
import type { SecureLock } from "./secureLock.js";
import type { Storage } from "./storage.js";

/**
 * `Storage` en memoria.
 *
 * ⚠️ Mínimo: el API completo sobre el esquema del SPEC §8.1 llega en T21.
 */
export class MemoryStorage implements Storage {
  readonly #data = new Map<string, string>();

  async get(key: string): Promise<string | undefined> {
    return this.#data.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    this.#data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.#data.delete(key);
  }

  async keys(prefix?: string): Promise<string[]> {
    const all = [...this.#data.keys()];
    return prefix === undefined ? all : all.filter((key) => key.startsWith(prefix));
  }
}

/** Respuesta configurable de `StubHttp`. */
export interface StubHttpRoute {
  status?: number;
  headers?: Record<string, string>;
  /** Cuerpo de texto (JSON, HTML). */
  body?: string;
  /** Cuerpo binario (paquetes `.zip`). Si no se indica, se codifica `body` en UTF-8. */
  bodyBytes?: Uint8Array;
}

/** Petición registrada por `StubHttp`. */
export interface StubHttpRequest {
  url: string;
  init?: HttpRequest;
}

/** `Http` de prueba: responde rutas fijas y registra todo lo pedido (200/404). */
export class StubHttp implements Http {
  readonly requests: StubHttpRequest[] = [];

  constructor(private readonly routes: Record<string, StubHttpRoute> = {}) {}

  async request(url: string, init?: HttpRequest): Promise<HttpResponse> {
    this.requests.push(init === undefined ? { url } : { url, init });

    const route = this.routes[url];
    if (route === undefined) {
      return {
        status: 404,
        headers: {},
        text: async () => "",
        bytes: async () => new Uint8Array(),
      };
    }

    return {
      status: route.status ?? 200,
      headers: route.headers ?? {},
      text: async () => route.body ?? "",
      bytes: async () => route.bodyBytes ?? utf8Encode(route.body ?? ""),
    };
  }
}

/** `Archive` de prueba: devuelve las entradas configuradas sin descomprimir nada. */
export class FakeArchive implements Archive {
  constructor(private readonly entries: readonly ArchiveEntry[] = []) {}

  async unzip(_data: Uint8Array): Promise<ArchiveEntry[]> {
    return this.entries.map((entry) => ({ path: entry.path, data: entry.data }));
  }
}

/** `Clock` de prueba: el tiempo solo avanza cuando se le pide. */
export class FixedClock implements Clock {
  constructor(private current: number) {}

  now(): number {
    return this.current;
  }

  set(now: number): void {
    this.current = now;
  }

  advance(ms: number): void {
    this.current += ms;
  }
}

/** `SecureLock` de prueba: nunca está disponible (web o dispositivo sin bloqueo). */
export class NoopSecureLock implements SecureLock {
  async isAvailable(): Promise<boolean> {
    return false;
  }

  async authenticate(_reason: string): Promise<boolean> {
    return false;
  }
}

/**
 * `ScriptLoader` de prueba: devuelve la fábrica registrada para cada código fuente y
 * apunta las fuentes pedidas. No evalúa nada (el núcleo no toca APIs de plataforma).
 */
export class FakeScriptLoader implements ScriptLoader {
  readonly loaded: string[] = [];
  readonly #factories = new Map<string, ScriptFactory>();

  constructor(factories: Record<string, ScriptFactory> = {}) {
    for (const [source, factory] of Object.entries(factories)) {
      this.#factories.set(source, factory);
    }
  }

  register(source: string, factory: ScriptFactory): void {
    this.#factories.set(source, factory);
  }

  async load(source: string): Promise<ScriptFactory> {
    this.loaded.push(source);
    const factory = this.#factories.get(source);
    if (factory === undefined) {
      throw new Error(`No hay ninguna fábrica registrada para ese código fuente`);
    }
    return factory;
  }
}
