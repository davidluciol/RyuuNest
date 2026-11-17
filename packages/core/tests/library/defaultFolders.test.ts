import { beforeEach, describe, expect, it } from "vitest";

import { FixedClock } from "../../src/ports/fakes";
import { exportBackup } from "../../src/backup/export";
import { importBackup } from "../../src/backup/import";
import { Folders } from "../../src/library/Folders";
import { MemoryStorage } from "../../src/storage/MemoryStorage";
import { migrate } from "../../src/storage/migrations";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { NodeSqliteDriver, openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * F52 — carpetas por defecto. «Favoritos» es una carpeta real marcada (`folder.system`);
 * «Gemas» no es pertenencia, es la vista de todo y no tiene fila. La siembra es idempotente.
 */

let driver: SqlDriver;
let carpetas: Folders;

beforeEach(async () => {
  driver = await openMigratedDriver();
  carpetas = new Folders({ driver, clock: new FixedClock(1_000) });
});

describe("Favoritos · carpeta por defecto", () => {
  it("existe tras la primera apertura, marcada como del sistema y sin duplicarse al migrar de nuevo", async () => {
    await migrate(driver);
    await migrate(driver);

    const sistema = (await carpetas.list()).filter((c) => c.system === "favorites");
    expect(sistema).toHaveLength(1);
    expect(sistema[0]?.name).toBe("Favoritos");
  });

  it("adopta una carpeta del usuario llamada «favoritos» en una base ya existente (sin perder sus series)", async () => {
    // Base en versión 2, con una carpeta del usuario que ya se llama así.
    const vieja = NodeSqliteDriver.openInMemory();
    await vieja.exec("PRAGMA foreign_keys = ON");
    const { MIGRATION_1, MIGRATION_2 } = await import("../../src/storage/schema");
    for (const sentencia of [...MIGRATION_1, ...MIGRATION_2]) await vieja.exec(sentencia);
    await vieja.exec("PRAGMA user_version = 2");
    await vieja.run("INSERT INTO folder (name, sort, updated_at) VALUES ('favoritos', 3, 7)");

    await migrate(vieja);

    const filas = await new Folders({ driver: vieja, clock: new FixedClock(1) }).list();
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ id: 1, system: "favorites", sort: 3 });
    vieja.close();
  });

  it.each(["merge", "replace"] as const)(
    "importar un respaldo (%s) no duplica Favoritos ni pierde la marca",
    async (mode) => {
      const texto = JSON.stringify(
        await exportBackup({ driver, storage: new MemoryStorage(), clock: new FixedClock(5) }),
      );
      const otro = await openMigratedDriver();

      const result = await importBackup({ driver: otro, mode }, texto);

      expect(result.ok).toBe(true);
      const filas = await new Folders({ driver: otro, clock: new FixedClock(1) }).list();
      expect(filas.filter((c) => c.system === "favorites")).toHaveLength(1);
      expect(filas.filter((c) => c.name === "Favoritos")).toHaveLength(1);
    },
  );

  it("un respaldo sin carpetas deja igualmente Favoritos tras reemplazar", async () => {
    const vacio = await openMigratedDriver();
    await vacio.run("DELETE FROM folder WHERE system = 'favorites'");
    const texto = JSON.stringify(
      await exportBackup({ driver: vacio, storage: new MemoryStorage(), clock: new FixedClock(5) }),
    );

    await importBackup({ driver, mode: "replace" }, texto);

    expect((await carpetas.list()).filter((c) => c.system === "favorites")).toHaveLength(1);
  });

  it("no se puede borrar ni renombrar", async () => {
    const favoritos = (await carpetas.list()).find((c) => c.system === "favorites");
    expect(favoritos).toBeDefined();
    const id = favoritos?.id ?? 0;

    await expect(carpetas.remove(id)).rejects.toThrow(/sistema/);
    await expect(carpetas.rename(id, "Otra")).rejects.toThrow(/sistema/);
    expect((await carpetas.get(id))?.name).toBe("Favoritos");
  });

  it("las carpetas del usuario se crean, renombran y borran igual que antes", async () => {
    const id = await carpetas.create("Lectura Nocturna");
    await carpetas.rename(id, "Noche");
    expect((await carpetas.get(id))?.system).toBeNull();
    await carpetas.remove(id);
    expect(await carpetas.get(id)).toBeUndefined();
  });
});
