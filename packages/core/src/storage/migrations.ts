/**
 * Migraciones versionadas del esquema local (SPEC §8.1, T21).
 *
 * La versión viva en `PRAGMA user_version`, que SQLite guarda en la cabecera del archivo:
 * no hace falta ninguna tabla de control. `migrate` aplica solo las migraciones por delante
 * de la versión actual, cada una en su transacción, así que volver a llamarla con la base ya
 * al día no hace nada (criterio de T21: idempotente y versionada).
 */
import type { SqlDriver } from "./SqlDriver.js";
import { withTransaction } from "./SqlDriver.js";
import { MIGRATION_1, SCHEMA_VERSION } from "./schema.js";

export { SCHEMA_VERSION };

/** Una migración: número de versión y sentencias que la aplican. */
export interface Migration {
  readonly version: number;
  readonly statements: readonly string[];
}

/** Historia ordenada del esquema. Al cambiar el esquema, se añade una entrada nueva, nunca se edita una existente. */
export const MIGRATIONS: readonly Migration[] = [
  { version: SCHEMA_VERSION, statements: MIGRATION_1 },
];

/**
 * Pone la base al día. Deja activas las claves foráneas: SQLite solo las comprueba si la
 * conexión lo pide, y todo el dominio de la biblioteca (`favorite.folder_id` con
 * `ON DELETE SET NULL`) cuenta con ellas.
 */
export async function migrate(driver: SqlDriver): Promise<void> {
  await driver.exec("PRAGMA foreign_keys = ON");

  const version = await driver.get<{ user_version: number }>("PRAGMA user_version");
  const actual = version?.user_version ?? 0;

  for (const migration of MIGRATIONS) {
    if (migration.version <= actual) {
      continue;
    }

    await withTransaction(driver, async () => {
      for (const statement of migration.statements) {
        await driver.exec(statement);
      }
      await driver.exec(`PRAGMA user_version = ${migration.version}`);
    });
  }
}
