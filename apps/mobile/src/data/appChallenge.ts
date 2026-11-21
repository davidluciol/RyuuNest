import { ModuleRegistry, SqliteStorage } from "@ryuunest/core";

import { openAppDatabase } from "./appDatabase";
import { createAppClearanceStore } from "./clearanceStore";
import { createChallengeController } from "./challengeController";

/**
 * F100 — instancia de la app: el almacén de verificaciones (lo comparten los
 * montadores de Descubrir, la ficha y el lector) y el controlador que pinta
 * `ChallengeHost`.
 */
export const appClearances = createAppClearanceStore();

export const appChallenge = createChallengeController({
  store: appClearances,
  async lookupDomains(moduleId) {
    const driver = await openAppDatabase();
    if (driver === null) return undefined;
    const pkg = await new ModuleRegistry({ storage: new SqliteStorage(driver) }).get(moduleId);
    return pkg?.enabled === true ? pkg.manifest.permissions.domains : undefined;
  },
});

/**
 * Acción «reintentar» de un error de módulo: con `BLOCKED` y una URL, primero
 * ofrece la verificación (hoja + navegador) y reintenta solo si quedó guardada.
 */
export function retryWithChallenge(
  moduleId: string | null | undefined,
  error: { code: string; url?: string | undefined },
  retry: () => void,
): () => void {
  if (error.code !== "BLOCKED" || error.url === undefined || !moduleId) return retry;
  const url = error.url;
  return () => {
    void appChallenge.verify(moduleId, url).then((ok) => {
      if (ok) retry();
    });
  };
}
