/**
 * Orígenes de la app web que pueden hablar con la extensión (SPEC §7.2: «la
 * extensión responde solo al origen de la app»). Fuente única: el manifiesto
 * (`content_scripts.matches`) lo vigila una prueba, y el content script y el
 * background lo vuelven a comprobar en ejecución.
 *
 * Decisión del humano (P-116): solo `localhost` mientras no haya dominio de
 * producción; el origen publicado se añade cuando se decida dónde alojar la PWA.
 */
export const APP_ORIGINS: readonly string[] = ["http://localhost:5173", "http://localhost:4173"];
