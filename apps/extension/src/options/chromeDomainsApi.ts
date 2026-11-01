import { ext } from "../browser";
import { createPendingHosts } from "../domains";
import { localStore } from "../storage";
import type { DomainsApi } from "./domainsModel";

/** `DomainsApi` sobre las APIs reales del navegador (`permissions` y `storage`). */
export function createChromeDomainsApi(): DomainsApi {
  return {
    grantedOrigins: async () => (await ext.permissions.getAll()).origins ?? [],
    // Sin `async`: un fallo síncrono se convierte en rechazo sin mover la llamada de turno.
    requestOrigins(origins) {
      try {
        return ext.permissions.request({ origins });
      } catch (error) {
        return Promise.reject(error);
      }
    },
    removeOrigins: (origins) => ext.permissions.remove({ origins }),
    pending: createPendingHosts(localStore),
  };
}
