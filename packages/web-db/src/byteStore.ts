/**
 * F25 — `ByteStore`: persistencia de los bytes de la base de datos (sql.js).
 * En producción es IndexedDB (SPEC §5.3, D-7); en pruebas, memoria.
 */
export interface ByteStore {
  /** Bytes guardados, o `undefined` si todavía no hay nada. */
  load(): Promise<Uint8Array | undefined>;
  save(bytes: Uint8Array): Promise<void>;
}

/** Doble en memoria para pruebas. */
export function createMemoryByteStore(): ByteStore {
  let current: Uint8Array | undefined;
  return {
    async load() {
      return current === undefined ? undefined : current.slice();
    },
    async save(bytes) {
      current = bytes.slice();
    },
  };
}

export interface IdbByteStoreOptions {
  readonly dbName: string;
  readonly store: string;
  readonly key: string;
}

/** Almacén de bytes sobre IndexedDB (un registro con la base serializada). */
export function createIdbByteStore(options: IdbByteStoreOptions): ByteStore {
  let opening: Promise<IDBDatabase> | undefined;

  function open(): Promise<IDBDatabase> {
    opening ??= new Promise((resolve, reject) => {
      const request = indexedDB.open(options.dbName, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(options.store)) {
          request.result.createObjectStore(options.store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB no abrió"));
    });
    return opening;
  }

  return {
    async load() {
      const db = await open();
      return new Promise<Uint8Array | undefined>((resolve, reject) => {
        const tx = db.transaction(options.store, "readonly");
        const request = tx.objectStore(options.store).get(options.key);
        request.onsuccess = () => {
          const value = request.result as Uint8Array | undefined;
          resolve(value === undefined ? undefined : new Uint8Array(value));
        };
        request.onerror = () => reject(request.error ?? new Error("IndexedDB get falló"));
      });
    },
    async save(bytes) {
      const db = await open();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(options.store, "readwrite");
        tx.objectStore(options.store).put(bytes.slice(), options.key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error("IndexedDB put falló"));
      });
    },
  };
}
