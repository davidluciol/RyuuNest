/**
 * `Storage` en memoria (SPEC §5.3, T21).
 *
 * Es el adaptador de referencia del puerto clave-valor: sin plataforma, determinista y
 * usado en pruebas. Nació como doble mínimo en `ports/fakes.ts` (T07) y aquí vive ya como
 * implementación propia; el almacén de la app real es `SqliteStorage` (SPEC §8.1).
 */
import type { Storage } from "../ports/storage.js";

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
