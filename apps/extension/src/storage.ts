import { ext } from "./browser";
import type { KeyValueStore } from "./domains";

/** `storage.local` de la extensión como almacén clave-valor (lo comparten el fondo y las opciones). */
export const localStore: KeyValueStore = {
  get: async (key) => (await ext.storage.local.get(key))[key],
  set: (key, value) => ext.storage.local.set({ [key]: value }),
};
