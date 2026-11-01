import type { ErrorReporter } from "../../data/errorLogPort";
import { toDiscoverError } from "./discoverData";
import type { DiscoverError } from "./discoverFixtures";

/**
 * F31 — reporte de errores de Descubrir al registro `log` (P-72). La pantalla
 * sigue mostrando el `DiscoverError` (RF-11) con `ErrorState`; además, cada
 * fallo visible deja una entrada saneada en `log` con el código del contrato.
 */

/**
 * Traduce el fallo a `DiscoverError` y lo registra en `log` como
 * `discover.<código-en-minúsculas>`. Con `reporter === null` (web sin SQLite)
 * solo devuelve el error: la pantalla avisa igual, sin registro local.
 */
export function reportDiscoverError(
  reporter: ErrorReporter | null,
  error: unknown,
  moduleName: string,
  extraContext?: Record<string, unknown>,
): DiscoverError {
  const discoverError = toDiscoverError(error, moduleName);
  const logCode = `discover.${discoverError.code.toLowerCase()}`;
  reporter?.report("error", logCode, discoverError.cause, {
    module: moduleName === "" ? undefined : moduleName,
    errorCode: discoverError.code,
    ...(discoverError.url === undefined ? {} : { url: discoverError.url }),
    ...(discoverError.selector === undefined ? {} : { selector: discoverError.selector }),
    ...extraContext,
  });
  return discoverError;
}
