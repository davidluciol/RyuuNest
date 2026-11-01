import { describe, expect, it, vi } from "vitest";

import { createPendingHosts, type KeyValueStore } from "../../src/domains";
import {
  authorizeHosts,
  loadDomains,
  revokeHost,
  type DomainsApi,
} from "../../src/options/domainsModel";

function makeApi(
  options: {
    granted?: string[];
    pending?: string[];
    grantResult?: boolean;
    removeResult?: boolean;
  } = {},
) {
  const data: Record<string, unknown> = { pendingHosts: options.pending ?? [] };
  const store: KeyValueStore = {
    get: async (key) => data[key],
    set: async (key, value) => {
      data[key] = value;
    },
  };
  const pending = createPendingHosts(store);
  const requestOrigins = vi.fn(async (_origins: string[]) => options.grantResult ?? true);
  const removeOrigins = vi.fn(async (_origins: string[]) => options.removeResult ?? true);
  const api: DomainsApi = {
    grantedOrigins: async () => options.granted ?? [],
    requestOrigins,
    removeOrigins,
    pending,
  };
  return { api, requestOrigins, removeOrigins, pending };
}

describe("loadDomains", () => {
  it("separa autorizados y pendientes", async () => {
    const { api } = makeApi({
      granted: ["*://cdn.sitio.org/*", "http://localhost:5173/*"],
      pending: ["otro.org", "cdn.sitio.org"],
    });
    expect(await loadDomains(api)).toEqual({
      authorized: ["cdn.sitio.org"],
      pending: ["otro.org"],
    });
  });

  it("sin nada concedido ni pendiente devuelve listas vacías", async () => {
    const { api } = makeApi();
    expect(await loadDomains(api)).toEqual({ authorized: [], pending: [] });
  });
});

describe("authorizeHosts", () => {
  it("pide un solo permiso con los patrones de host exacto", async () => {
    const { api, requestOrigins } = makeApi({ pending: ["a.org", "b.org"] });
    await authorizeHosts(api, ["a.org", "b.org"]);
    expect(requestOrigins).toHaveBeenCalledOnce();
    expect(requestOrigins).toHaveBeenCalledWith(["*://a.org/*", "*://b.org/*"]);
  });

  it("llama a permissions.request en el mismo turno (conserva el gesto del usuario)", () => {
    const { api, requestOrigins } = makeApi();
    void authorizeHosts(api, ["a.org"]);
    // Sin esperar nada: si hubiera un await antes, el navegador rechazaría la petición.
    expect(requestOrigins).toHaveBeenCalledOnce();
  });

  it("si el usuario concede, quita los hosts de pendientes", async () => {
    const { api, pending } = makeApi({ pending: ["a.org", "b.org", "c.org"] });
    expect(await authorizeHosts(api, ["a.org", "c.org"])).toBe(true);
    expect(await pending.list()).toEqual(["b.org"]);
  });

  it("si el usuario rechaza, los hosts siguen pendientes", async () => {
    const { api, pending } = makeApi({ pending: ["a.org"], grantResult: false });
    expect(await authorizeHosts(api, ["a.org"])).toBe(false);
    expect(await pending.list()).toEqual(["a.org"]);
  });

  it("ignora lo que no es un host exacto", async () => {
    const { api, requestOrigins } = makeApi();
    expect(await authorizeHosts(api, ["*.sitio.org", "https://a.org/x"])).toBe(false);
    expect(requestOrigins).not.toHaveBeenCalled();
  });
});

describe("revokeHost", () => {
  it("retira el permiso del host exacto", async () => {
    const { api, removeOrigins } = makeApi();
    expect(await revokeHost(api, "cdn.sitio.org")).toBe(true);
    expect(removeOrigins).toHaveBeenCalledWith(["*://cdn.sitio.org/*"]);
  });

  it("devuelve lo que diga el navegador", async () => {
    const { api } = makeApi({ removeResult: false });
    expect(await revokeHost(api, "cdn.sitio.org")).toBe(false);
  });

  it("no toca nada si no es un host válido", async () => {
    const { api, removeOrigins } = makeApi();
    expect(await revokeHost(api, "*://*/*")).toBe(false);
    expect(removeOrigins).not.toHaveBeenCalled();
  });
});
