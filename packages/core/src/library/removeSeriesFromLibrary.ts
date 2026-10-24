/**
 * Quitar una serie de la biblioteca (P-62, T25b).
 *
 * La biblioteca es la lista de favoritos (T23), así que quitarla borra lo que esa serie
 * mostraba: su fila `favorite`, su `progress` y sus `chapter_read`. Las tres escrituras
 * van en **una sola transacción**: si una falla, no queda una serie a medio quitar.
 *
 * **Qué se conserva (P-73, elegido por el humano):** la fila `series` y `series_pref`
 * quedan como caché de metadatos y preferencias, para que al volver a añadir la serie se
 * recuperen su título, su portada y su modo de lectura. No son filas huérfanas: la serie
 * sigue existiendo aunque no esté en la biblioteca.
 *
 * **No confundir con `Favorites.remove` (RF-30):** quitar un favorito no borra el
 * progreso. Esta operación es la acción explícita «quitar de la biblioteca», que sí lo
 * hace porque el usuario está quitando la serie, no solo desmarcándola.
 */
import { withTransaction, type SqlDriver } from "../storage/SqlDriver.js";

/** Datos para quitar una serie de la biblioteca. */
export interface RemoveSeriesFromLibraryOptions {
  driver: SqlDriver;
  moduleId: string;
  seriesId: string;
}

/**
 * Borra el favorito, el progreso y los capítulos leídos de una serie, en una transacción.
 * Si la serie no estaba en la biblioteca no falla: no hay nada que borrar.
 */
export async function removeSeriesFromLibrary(
  options: RemoveSeriesFromLibraryOptions,
): Promise<void> {
  const { driver, moduleId, seriesId } = options;

  await withTransaction(driver, async () => {
    await driver.run("DELETE FROM favorite WHERE module_id = ? AND series_id = ?", [
      moduleId,
      seriesId,
    ]);
    await driver.run("DELETE FROM progress WHERE module_id = ? AND series_id = ?", [
      moduleId,
      seriesId,
    ]);
    await driver.run("DELETE FROM chapter_read WHERE module_id = ? AND series_id = ?", [
      moduleId,
      seriesId,
    ]);
  });
}
