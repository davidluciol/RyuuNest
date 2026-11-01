import { originPatternFor } from "@ryuunest/extension-protocol";

import { authorizedHostsFrom, isValidHost, type PendingHosts } from "../domains";

/**
 * F26 — lógica de la página de opciones (donde el usuario autoriza dominios).
 * Sin React ni APIs de navegador: todo entra por `DomainsApi`, así que se prueba
 * en Node.
 */

export interface DomainsApi {
  /** `permissions.getAll().origins`. */
  grantedOrigins(): Promise<string[]>;
  /** `permissions.request`: el navegador solo lo admite dentro de un gesto del usuario. */
  requestOrigins(origins: string[]): Promise<boolean>;
  /** `permissions.remove`. */
  removeOrigins(origins: string[]): Promise<boolean>;
  pending: PendingHosts;
}

export interface DomainsState {
  authorized: string[];
  pending: string[];
}

export async function loadDomains(api: DomainsApi): Promise<DomainsState> {
  const [origins, pending] = await Promise.all([api.grantedOrigins(), api.pending.list()]);
  const authorized = authorizedHostsFrom(origins);
  return { authorized, pending: pending.filter((host) => !authorized.includes(host)) };
}

/**
 * Pide al navegador autorizar los hosts (un solo aviso para todos). **Debe
 * llamarse directamente desde el manejador del clic**: `requestOrigins` se
 * invoca en el mismo turno, sin ningún `await` antes, para no perder el gesto.
 */
export function authorizeHosts(api: DomainsApi, hosts: readonly string[]): Promise<boolean> {
  const valid = hosts.filter(isValidHost);
  if (valid.length === 0) return Promise.resolve(false);

  return api.requestOrigins(valid.map(originPatternFor)).then(async (granted) => {
    if (granted) await api.pending.remove(valid);
    return granted;
  });
}

export async function revokeHost(api: DomainsApi, host: string): Promise<boolean> {
  if (!isValidHost(host)) return false;
  return api.removeOrigins([originPatternFor(host)]);
}
