import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { Storage } from "../../src/ports/storage";
import { MemoryStorage } from "../../src/storage/MemoryStorage";
import { SqliteStorage } from "../../src/storage/SqliteStorage";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * Suite de conformidad del puerto `Storage` (SPEC §5.3 y §8.1, T21).
 *
 * La misma batería corre contra `MemoryStorage` y contra `SqliteStorage` sobre SQLite
 * real: lo que guarda la aplicación no puede depender del adaptador que esté debajo.
 */

/** Adaptador bajo prueba: la almacén y cómo soltarlo al terminar cada prueba. */
interface BajoPrueba {
  storage: Storage;
  cerrar?(): Promise<void>;
}

function suiteDeConformidad(nombre: string, abrir: () => Promise<BajoPrueba>): void {
  describe(`${nombre} · conformidad del puerto Storage`, () => {
    let actual: BajoPrueba;

    beforeEach(async () => {
      actual = await abrir();
    });

    afterEach(async () => {
      await actual.cerrar?.();
    });

    it("devuelve undefined para una clave que no está", async () => {
      await expect(actual.storage.get("module:ausente")).resolves.toBeUndefined();
    });

    it("guarda y recupera un valor, y sobreescribir reemplaza", async () => {
      await actual.storage.set("repo:x", "primero");
      await actual.storage.set("repo:x", "segundo");

      await expect(actual.storage.get("repo:x")).resolves.toBe("segundo");
    });

    it("distingue la cadena vacía de la ausencia de clave", async () => {
      await actual.storage.set("setting:vacia", "");

      await expect(actual.storage.get("setting:vacia")).resolves.toBe("");
    });

    it("borra una clave y deja las demás intactas", async () => {
      await actual.storage.set("module:a", "1");
      await actual.storage.set("module:b", "2");

      await actual.storage.delete("module:a");

      await expect(actual.storage.get("module:a")).resolves.toBeUndefined();
      await expect(actual.storage.get("module:b")).resolves.toBe("2");
    });

    it("borrar una clave que no existe no es un error", async () => {
      await expect(actual.storage.delete("no:existe")).resolves.toBeUndefined();
    });

    it("lista todas las claves y filtra por prefijo", async () => {
      await actual.storage.set("module:uno", "1");
      await actual.storage.set("module:dos", "2");
      await actual.storage.set("repo:alfa", "3");

      await expect(claves(actual.storage)).resolves.toEqual([
        "module:dos",
        "module:uno",
        "repo:alfa",
      ]);
      await expect(claves(actual.storage, "module:")).resolves.toEqual([
        "module:dos",
        "module:uno",
      ]);
      await expect(claves(actual.storage, "repo:")).resolves.toEqual(["repo:alfa"]);
    });

    it("un prefijo sin coincidencias devuelve una lista vacía", async () => {
      await actual.storage.set("module:uno", "1");

      await expect(claves(actual.storage, "nada:")).resolves.toEqual([]);
    });

    it("un prefijo vacío cuenta como todas las claves", async () => {
      await actual.storage.set("a", "1");
      await actual.storage.set("b", "2");

      await expect(claves(actual.storage, "")).resolves.toEqual(["a", "b"]);
    });

    it("los caracteres de comodín del prefijo no amplían el filtro", async () => {
      await actual.storage.set("module:a", "1");
      await actual.storage.set("module:b", "2");
      await actual.storage.set("module:%", "3");

      await expect(claves(actual.storage, "module:%")).resolves.toEqual(["module:%"]);
    });

    it("conserva valores grandes con unicode, saltos de línea y JSON", async () => {
      const valor = JSON.stringify({
        título: "SERIE — 龍の巣 · «a»\nému\ttab",
        lista: Array.from({ length: 500 }, (_, i) => `capítulo ${i}`),
      });

      await actual.storage.set("module:grande", valor);

      await expect(actual.storage.get("module:grande")).resolves.toBe(valor);
    });
  });
}

/** Claves ordenadas: el puerto no garantiza orden, las pruebas sí lo comparan estable. */
async function claves(storage: Storage, prefijo?: string): Promise<string[]> {
  return (await storage.keys(prefijo)).slice().sort();
}

suiteDeConformidad("MemoryStorage", async () => ({ storage: new MemoryStorage() }));

suiteDeConformidad("SqliteStorage", async () => {
  const driver = await openMigratedDriver();
  return { storage: new SqliteStorage(driver), cerrar: async () => driver.close() };
});
