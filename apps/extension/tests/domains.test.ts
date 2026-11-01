import { describe, expect, it } from "vitest";

import {
  MAX_PENDING_HOSTS,
  authorizedHostsFrom,
  createPendingHosts,
  isValidHost,
  type KeyValueStore,
} from "../src/domains";

function memoryStore(
  initial: Record<string, unknown> = {},
): KeyValueStore & { data: Record<string, unknown> } {
  const data = { ...initial };
  return {
    data,
    get: async (key) => data[key],
    set: async (key, value) => {
      // Un tick de espera para que las escrituras simultáneas se pisen si no se serializan.
      await Promise.resolve();
      data[key] = value;
    },
  };
}

describe("isValidHost", () => {
  it.each(["sitio.org", "cdn.sitio.org", "127.0.0.1", "xn--espaol-zwa.org"])(
    "%s es válido",
    (host) => {
      expect(isValidHost(host)).toBe(true);
    },
  );

  it.each([
    "",
    "sitio.org/ruta",
    "https://sitio.org",
    "*.sitio.org",
    "sitio.org:8443",
    "con espacio.org",
    "a b",
  ])("«%s» no es válido", (host) => {
    expect(isValidHost(host)).toBe(false);
  });
});

describe("createPendingHosts", () => {
  it("anota hosts sin repetirlos y en orden de llegada", async () => {
    const pending = createPendingHosts(memoryStore());
    await pending.add("a.org");
    await pending.add("b.org");
    await pending.add("a.org");
    expect(await pending.list()).toEqual(["a.org", "b.org"]);
  });

  it("ignora lo que no es un host", async () => {
    const pending = createPendingHosts(memoryStore());
    await pending.add("https://a.org/ruta");
    await pending.add("*.a.org");
    expect(await pending.list()).toEqual([]);
  });

  it("no pierde anotaciones simultáneas", async () => {
    const pending = createPendingHosts(memoryStore());
    await Promise.all(["a.org", "b.org", "c.org", "d.org"].map((host) => pending.add(host)));
    expect([...(await pending.list())].sort()).toEqual(["a.org", "b.org", "c.org", "d.org"]);
  });

  it("guarda como mucho MAX_PENDING_HOSTS y descarta los más antiguos", async () => {
    const pending = createPendingHosts(memoryStore());
    for (let index = 0; index < MAX_PENDING_HOSTS + 5; index += 1) {
      await pending.add(`h${index}.org`);
    }
    const list = await pending.list();
    expect(list).toHaveLength(MAX_PENDING_HOSTS);
    expect(list[0]).toBe("h5.org");
    expect(list.at(-1)).toBe(`h${MAX_PENDING_HOSTS + 4}.org`);
  });

  it("quita los hosts autorizados", async () => {
    const pending = createPendingHosts(memoryStore());
    await Promise.all(["a.org", "b.org", "c.org"].map((host) => pending.add(host)));
    await pending.remove(["a.org", "c.org", "no-estaba.org"]);
    expect(await pending.list()).toEqual(["b.org"]);
  });

  it("tolera un valor corrupto en el almacén", async () => {
    const pending = createPendingHosts(memoryStore({ pendingHosts: "no es una lista" }));
    expect(await pending.list()).toEqual([]);
    await pending.add("a.org");
    expect(await pending.list()).toEqual(["a.org"]);
  });
});

describe("authorizedHostsFrom", () => {
  it("lista los hosts concedidos con el patrón de la extensión", () => {
    expect(
      authorizedHostsFrom(["*://cdn.sitio.org/*", "https://otro.org/*", "http://127.0.0.1/*"]),
    ).toEqual(["cdn.sitio.org", "otro.org", "127.0.0.1"]);
  });

  it("ignora comodines y patrones que no son de un host exacto", () => {
    expect(
      authorizedHostsFrom([
        "*://*/*",
        "http://*/*",
        "https://*.sitio.org/*",
        "<all_urls>",
        "https://a.org/ruta",
      ]),
    ).toEqual([]);
  });

  it("no repite un host concedido en http y https", () => {
    expect(authorizedHostsFrom(["http://a.org/*", "https://a.org/*"])).toEqual(["a.org"]);
  });
});
