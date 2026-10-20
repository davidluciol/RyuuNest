import { describe, expect, it } from "vitest";

import { migrate, SCHEMA_VERSION } from "../../src/storage/migrations";
import { NodeSqliteDriver, openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * Esquema local del SPEC §8.1 y sus migraciones (T21).
 *
 * Se comprueba contra SQLite real (el `node:sqlite` de Node), que es quien de verdad
 * aplica claves foráneas, defaults e índices. La misma estructura lógica la replicará
 * el adaptador de web (IndexedDB) detrás del puerto `Storage`.
 */

/** [columna, tipo, NOT NULL, posición en la clave primaria (0 = fuera), valor por defecto]. */
type ColumnSpec = readonly [string, string, 0 | 1, number, string | null];

const TABLAS: Readonly<Record<string, readonly ColumnSpec[]>> = {
  repo: [
    ["id", "TEXT", 0, 1, null],
    ["url", "TEXT", 1, 0, null],
    ["name", "TEXT", 0, 0, null],
    ["added_at", "INTEGER", 1, 0, null],
  ],
  module: [
    ["id", "TEXT", 0, 1, null],
    ["version", "TEXT", 1, 0, null],
    ["repo_id", "TEXT", 0, 0, null],
    ["runtime", "TEXT", 1, 0, null],
    ["kinds", "TEXT", 1, 0, null],
    ["lang", "TEXT", 0, 0, null],
    ["nsfw", "INTEGER", 1, 0, "0"],
    ["enabled", "INTEGER", 1, 0, "1"],
    ["installed_at", "INTEGER", 1, 0, null],
    ["last_error", "TEXT", 0, 0, null],
  ],
  series: [
    ["module_id", "TEXT", 1, 1, null],
    ["series_id", "TEXT", 1, 2, null],
    ["title", "TEXT", 1, 0, null],
    ["title_norm", "TEXT", 1, 0, null],
    ["cover_url", "TEXT", 0, 0, null],
    ["kind", "TEXT", 0, 0, null],
    ["nsfw", "INTEGER", 1, 0, "0"],
    ["status", "TEXT", 0, 0, null],
    ["updated_at", "INTEGER", 1, 0, null],
  ],
  folder: [
    ["id", "INTEGER", 0, 1, null],
    ["name", "TEXT", 1, 0, null],
    ["sort", "INTEGER", 1, 0, "0"],
    ["updated_at", "INTEGER", 1, 0, null],
  ],
  favorite: [
    ["module_id", "TEXT", 1, 1, null],
    ["series_id", "TEXT", 1, 2, null],
    ["folder_id", "INTEGER", 0, 0, null],
    ["added_at", "INTEGER", 1, 0, null],
    ["updated_at", "INTEGER", 1, 0, null],
  ],
  progress: [
    ["module_id", "TEXT", 1, 1, null],
    ["series_id", "TEXT", 1, 2, null],
    ["chapter_id", "TEXT", 1, 0, null],
    ["release_id", "TEXT", 0, 0, null],
    ["chapter_title", "TEXT", 0, 0, null],
    ["page_index", "INTEGER", 1, 0, "0"],
    ["page_total", "INTEGER", 0, 0, null],
    ["updated_at", "INTEGER", 1, 0, null],
  ],
  chapter_read: [
    ["module_id", "TEXT", 1, 1, null],
    ["series_id", "TEXT", 1, 2, null],
    ["chapter_id", "TEXT", 1, 3, null],
    ["read_at", "INTEGER", 1, 0, null],
  ],
  series_pref: [
    ["module_id", "TEXT", 1, 1, null],
    ["series_id", "TEXT", 1, 2, null],
    ["reader_mode", "TEXT", 0, 0, null],
    ["preferred_group", "TEXT", 0, 0, null],
    ["updated_at", "INTEGER", 1, 0, null],
  ],
  setting: [
    ["key", "TEXT", 0, 1, null],
    ["value", "TEXT", 1, 0, null],
  ],
};

/** Índices declarados en el SPEC §8.1 (los automáticos de PRIMARY KEY/UNIQUE no cuentan). */
const INDICES: Readonly<Record<string, readonly string[]>> = {
  idx_series_title: ["title_norm"],
  idx_favorite_folder: ["folder_id"],
  idx_progress_recent: ["updated_at"],
};

interface TableInfoRow {
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface IndexListRow {
  name: string;
  unique: number;
  origin: string;
}

interface IndexInfoRow {
  name: string;
}

interface ForeignKeyRow {
  table: string;
  from: string;
  to: string | null;
  on_delete: string;
}

describe("esquema · tablas del SPEC §8.1", () => {
  it("crea las nueve tablas con las columnas, tipos, NOT NULL, claves y valores por defecto del SPEC", async () => {
    const driver = await openMigratedDriver();

    for (const [tabla, esperadas] of Object.entries(TABLAS)) {
      const filas = await driver.all<TableInfoRow>(`PRAGMA table_info(${tabla})`);
      const reales = filas.map((f) => [f.name, f.type, f.notnull, f.pk, f.dflt_value] as const);

      expect(reales, `columnas de ${tabla}`).toEqual(
        esperadas.map((c) => [c[0], c[1], c[2], c[3], c[4]] as const),
      );
    }
  });

  it("title_norm y page_total existen (normalización de título y barra de progreso)", async () => {
    const driver = await openMigratedDriver();

    const series = await driver.all<TableInfoRow>("PRAGMA table_info(series)");
    const progreso = await driver.all<TableInfoRow>("PRAGMA table_info(progress)");

    expect(series.map((c) => c.name)).toContain("title_norm");
    expect(progreso.map((c) => c.name)).toContain("page_total");
  });

  it("deja repo.url como clave única", async () => {
    const driver = await openMigratedDriver();

    const indices = await driver.all<IndexListRow>("PRAGMA index_list(repo)");
    const cobertura: string[] = [];
    for (const indice of indices) {
      const filas = await driver.all<IndexInfoRow>(
        `PRAGMA index_info(${JSON.stringify(indice.name)})`,
      );
      cobertura.push(`${filas.map((f) => f.name).join("+")}:${indice.unique}`);
    }

    // El SPEC pide UNIQUE sobre url: existe un índice que cubre solo esa columna y es único.
    expect(cobertura).toContain("url:1");
  });

  it("crea exactamente los tres índices del SPEC, sobre las columnas que toca", async () => {
    const driver = await openMigratedDriver();

    const nombres = await driver.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%' ORDER BY name",
    );
    expect(nombres.map((n) => n.name).sort()).toEqual(Object.keys(INDICES).sort());

    for (const [indice, columnas] of Object.entries(INDICES)) {
      const filas = await driver.all<IndexInfoRow>(`PRAGMA index_info(${indice})`);
      expect(
        filas.map((f) => f.name),
        `columnas de ${indice}`,
      ).toEqual(columnas);
    }
  });
});

describe("migraciones · versionadas e idempotentes", () => {
  it("registra la versión del esquema en PRAGMA user_version", async () => {
    const driver = await openMigratedDriver();

    const row = await driver.get<{ user_version: number }>("PRAGMA user_version");

    expect(row?.user_version).toBe(SCHEMA_VERSION);
  });

  it("aplicar las migraciones dos veces seguidas no falla ni duplica objetos", async () => {
    const driver = NodeSqliteDriver.openInMemory();
    await migrate(driver);

    const trasPrimera = await driver.all<{ type: string; name: string }>(
      "SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    );

    await expect(migrate(driver)).resolves.toBeUndefined();

    const trasSegunda = await driver.all<{ type: string; name: string }>(
      "SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name",
    );
    const version = await driver.get<{ user_version: number }>("PRAGMA user_version");

    expect(trasSegunda).toEqual(trasPrimera);
    expect(version?.user_version).toBe(SCHEMA_VERSION);
  });

  it("no toca los datos que ya estaban en la base", async () => {
    const driver = await openMigratedDriver();
    await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", ["nsfw_enabled", "0"]);

    await migrate(driver);

    const fila = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      "nsfw_enabled",
    ]);
    expect(fila?.value).toBe("0");
  });
});

describe("claves foráneas", () => {
  it("favorite.folder_id referencia a folder con ON DELETE SET NULL", async () => {
    const driver = await openMigratedDriver();

    const claves = await driver.all<ForeignKeyRow>("PRAGMA foreign_key_list(favorite)");

    expect(claves).toHaveLength(1);
    expect(claves[0]).toEqual(
      expect.objectContaining({
        table: "folder",
        from: "folder_id",
        to: "id",
        on_delete: "SET NULL",
      }),
    );
  });

  it("con foreign_keys activo, un favorito apunta a una carpeta existente", async () => {
    const driver = await openMigratedDriver();

    await expect(
      driver.run(
        "INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        ["m", "s", 999, 1, 1],
      ),
    ).rejects.toThrow();
  });

  it("borrar la carpeta deja sus favoritos sin carpeta, no borrados", async () => {
    const driver = await openMigratedDriver();
    const creado = await driver.run("INSERT INTO folder (name, updated_at) VALUES (?, ?)", [
      "Tesoros",
      1,
    ]);
    await driver.run(
      "INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      ["m", "s", creado.lastInsertRowid, 1, 1],
    );

    await driver.run("DELETE FROM folder WHERE id = ?", [creado.lastInsertRowid]);

    const fila = await driver.get<{ folder_id: number | null }>(
      "SELECT folder_id FROM favorite WHERE module_id = ? AND series_id = ?",
      ["m", "s"],
    );
    expect(fila?.folder_id).toBeNull();
  });

  it("el que manda es el pragma: sin foreign_keys entra la fila huérfana, con ellos no", async () => {
    const driver = await openMigratedDriver();
    const huerfano = (
      modulo: string,
      serie: string,
    ): readonly [string, string, number, number, number] => [modulo, serie, 999, 1, 1];
    const insertar =
      "INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at) VALUES (?, ?, ?, ?, ?)";

    await driver.exec("PRAGMA foreign_keys = OFF");
    await expect(driver.run(insertar, huerfano("m", "s"))).resolves.toMatchObject({ changes: 1 });

    await driver.exec("PRAGMA foreign_keys = ON");
    await expect(driver.run(insertar, huerfano("m2", "s2"))).rejects.toThrow();
  });
});
