import { describe, expect, it } from "vitest";

import { createMemoryByteStore } from "../../src/data/byteStore";
import { openWebDatabase } from "../../src/data/webDatabase";

/**
 * F25 — base de datos web: SQLite real sobre sql.js (WASM) cuyos bytes se
 * persisten en el `ByteStore` (IndexedDB en producción, SPEC §5.3/D-7). Las
 * pruebas corren sql.js en Node con el almacén en memoria.
 */
describe("openWebDatabase (sql.js + ByteStore)", () => {
  it("migra el esquema del SPEC §8.1 (tablas del núcleo y log)", async () => {
    const { driver } = await openWebDatabase({ byteStore: createMemoryByteStore() });
    const tables = await driver.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    const names = tables.map((row) => row.name);
    for (const expected of ["series", "favorite", "folder", "progress", "chapter_read", "series_pref", "setting", "log"]) {
      expect(names, `falta la tabla ${expected}`).toContain(expected);
    }
    const version = await driver.get<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(2);
  });

  it("run/all/get con parámetros hacen ida y vuelta", async () => {
    const { driver } = await openWebDatabase({ byteStore: createMemoryByteStore() });
    await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["prueba", "1"]);
    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", ["prueba"]);
    expect(row?.value).toBe("1");
    const all = await driver.all<{ key: string; value: string }>("SELECT key, value FROM setting");
    expect(all).toEqual([{ key: "prueba", value: "1" }]);
  });

  it("persiste los bytes en el ByteStore y al reabrir conserva los datos", async () => {
    const byteStore = createMemoryByteStore();
    const first = await openWebDatabase({ byteStore });
    await first.driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["persistida", "sí"]);
    await first.flush();

    const second = await openWebDatabase({ byteStore });
    const row = await second.driver.get<{ value: string }>(
      "SELECT value FROM setting WHERE key = ?",
      ["persistida"],
    );
    expect(row?.value).toBe("sí");
  });

  it("el guardado es con retraso: sin flush los bytes no cambian", async () => {
    const byteStore = createMemoryByteStore();
    const { driver, flush } = await openWebDatabase({ byteStore, persistDelayMs: 60_000 });
    const before = await byteStore.load();
    expect(before).toBeDefined(); // la migración inicial sí se volcó

    await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["tarde", "x"]);
    expect(await byteStore.load()).toEqual(before); // diferido: aún no volcado

    await flush();
    const after = await byteStore.load();
    expect(after).toBeDefined();
    expect(after).not.toEqual(before);
    const second = await openWebDatabase({ byteStore });
    expect(
      await second.driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", ["tarde"]),
    ).toMatchObject({ value: "x" });
  });
});
