/**
 * Etiquetas de la biblioteca (F53). Se comparan por `tag_norm` (minúsculas y sin acentos, como
 * los títulos) y se muestran como llegaron, recortadas.
 */
import type { SqlDriver } from "../storage/SqlDriver.js";
import { normalizeTitle } from "./normalize.js";

/** Etiqueta lista para guardar: texto visible y clave de comparación. */
export interface CleanTag {
  tag: string;
  norm: string;
}

/** Recorta, descarta las vacías y quita repetidas (gana la primera). */
export function cleanTags(tags: readonly string[]): CleanTag[] {
  const vistas = new Map<string, CleanTag>();
  for (const bruta of tags) {
    const tag = bruta.trim();
    const norm = normalizeTitle(tag);
    if (norm !== "" && !vistas.has(norm)) {
      vistas.set(norm, { tag, norm });
    }
  }
  return [...vistas.values()];
}

/** Tabla de etiquetas y su columna de dueño: lo único que cambia entre series y carpetas. */
type TagTable = "series_tag" | "folder_tag";

/** Reemplaza todas las etiquetas de un dueño. Quien llama pone la transacción. */
export async function replaceTags(
  driver: SqlDriver,
  table: TagTable,
  owner: readonly (string | number)[],
  tags: readonly string[],
): Promise<void> {
  const columnas = table === "series_tag" ? "module_id = ? AND series_id = ?" : "folder_id = ?";
  const insertar = table === "series_tag" ? "module_id, series_id" : "folder_id";
  const marcas = owner.map(() => "?").join(", ");
  await driver.run(`DELETE FROM ${table} WHERE ${columnas}`, owner);
  for (const { tag, norm } of cleanTags(tags)) {
    await driver.run(`INSERT INTO ${table} (${insertar}, tag, tag_norm) VALUES (${marcas}, ?, ?)`, [
      ...owner,
      tag,
      norm,
    ]);
  }
}

/** Etiquetas de un dueño, por orden de `tag_norm`. */
export async function readTags(
  driver: SqlDriver,
  table: TagTable,
  owner: readonly (string | number)[],
): Promise<string[]> {
  const columnas = table === "series_tag" ? "module_id = ? AND series_id = ?" : "folder_id = ?";
  const filas = await driver.all<{ tag: string }>(
    `SELECT tag FROM ${table} WHERE ${columnas} ORDER BY tag_norm`,
    owner,
  );
  return filas.map((fila) => fila.tag);
}

/** Etiquetas de las series guardadas en la biblioteca, una vez cada una y por orden. */
export async function listLibraryTags(driver: SqlDriver): Promise<string[]> {
  const filas = await driver.all<{ tag: string }>(
    `SELECT MIN(st.tag) AS tag
       FROM series_tag AS st
       JOIN favorite AS f ON f.module_id = st.module_id AND f.series_id = st.series_id
      GROUP BY st.tag_norm
      ORDER BY st.tag_norm`,
  );
  return filas.map((fila) => fila.tag);
}
