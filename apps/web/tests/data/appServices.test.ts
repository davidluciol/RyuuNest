import { describe, expect, it } from "vitest";

import { StubHttp } from "@ryuunest/core";

import type { RequestMessage } from "@ryuunest/extension-protocol";

import { openWebServices } from "../../src/data/appServices";
import { createMemoryByteStore } from "../../src/data/byteStore";
import type { ExtensionChannel } from "../../src/ports/extensionHttp";

/**
 * F25 — composición de servicios del cliente web sobre la base persistida:
 * registro de repos/módulos, instalador, flujo de instalación (con
 * confirmación, AC-8), registro de diagnóstico y reporter de errores.
 */
describe("openWebServices", () => {
  it("expone los servicios sobre una base migrada y vacía", async () => {
    const services = await openWebServices({
      byteStore: createMemoryByteStore(),
      http: new StubHttp(),
    });

    expect(await services.repos.listRepos()).toEqual([]);
    expect(await services.modules.list()).toEqual([]);
    // web: sin bloqueo del dispositivo (SPEC §5.3)
    expect(await services.secureLock.isAvailable()).toBe(false);

    services.reporter.report("warn", "prueba.code", "mensaje", { a: 1 });
    await services.flush();
    const entries = await services.logStore.list();
    expect(entries).toHaveLength(1);
    expect(entries[0]?.code).toBe("prueba.code");
  });

  it("añade un repo desde su index.json (HTTP inyectado + validación del SDK)", async () => {
    const http = new StubHttp({
      // La URL del repo es la del propio index.json (canonicalizada con «/» final).
      "https://repo.test/": {
        body: JSON.stringify({
          format: "ryuunest-repo",
          version: 1,
          name: "Repo de prueba",
          updatedAt: "2026-10-31T00:00:00.000Z",
          modules: [],
        }),
      },
    });
    const services = await openWebServices({ byteStore: createMemoryByteStore(), http });

    const repo = await services.repos.addRepo("https://repo.test");
    expect(repo.url).toBe("https://repo.test/");
    const repos = await services.repos.listRepos();
    expect(repos).toHaveLength(1);
    expect(http.requests.map((r) => r.url)).toContain("https://repo.test/");
  });

  describe("red por defecto: la extensión (SPEC §10; retira P-111)", () => {
    function silentChannel() {
      const sent: RequestMessage[] = [];
      const channel: ExtensionChannel = {
        post: (message) => void sent.push(message),
        subscribe: () => () => {},
      };
      return { channel, sent };
    }

    it("sin extensión las peticiones fallan con EXTENSION_MISSING y el estado lo refleja", async () => {
      const { channel, sent } = silentChannel();
      const services = await openWebServices({
        byteStore: createMemoryByteStore(),
        extension: { channel, detectTimeoutMs: 10 },
      });

      await expect(services.http.request("https://sitio.org/a")).rejects.toMatchObject({
        reason: "EXTENSION_MISSING",
      });
      expect(sent.map((message) => message.type)).toEqual(["ping"]);
      expect(services.extension.status.get().state).toBe("missing");
    });

    it("detect() permite comprobar la extensión sin esperar a la primera petición", async () => {
      const { channel, sent } = silentChannel();
      const services = await openWebServices({
        byteStore: createMemoryByteStore(),
        extension: { channel, detectTimeoutMs: 10 },
      });
      expect(services.extension.status.get().state).toBe("unknown");
      expect(await services.extension.detect()).toBe(false);
      expect(services.extension.status.get().state).toBe("missing");
      expect(sent.map((message) => message.type)).toEqual(["ping"]);
    });

    it("no hace ninguna petición directa con fetch", async () => {
      const original = globalThis.fetch;
      let direct = 0;
      globalThis.fetch = (async () => {
        direct += 1;
        throw new Error("petición directa");
      }) as typeof fetch;
      try {
        const { channel } = silentChannel();
        const services = await openWebServices({
          byteStore: createMemoryByteStore(),
          extension: { channel, detectTimeoutMs: 10 },
        });
        await services.http.request("https://sitio.org/a").catch(() => {});
        await services.repos.addRepo("https://repo.test").catch(() => {});
        expect(direct).toBe(0);
      } finally {
        globalThis.fetch = original;
      }
    });

    it("abrir las opciones de la extensión también pasa por el canal", async () => {
      const { channel, sent } = silentChannel();
      const services = await openWebServices({
        byteStore: createMemoryByteStore(),
        extension: { channel, detectTimeoutMs: 10 },
      });
      await expect(services.extension.openOptions("cdn.sitio.org")).rejects.toMatchObject({
        reason: "EXTENSION_MISSING",
      });
      expect(sent.map((message) => message.type)).toEqual(["ping"]);
    });
  });

  it("rechaza un index.json inválido sin registrar nada (PARSE)", async () => {
    const http = new StubHttp({
      "https://roto.test/": { body: JSON.stringify({ format: "otro" }) },
    });
    const services = await openWebServices({ byteStore: createMemoryByteStore(), http });

    await expect(services.repos.addRepo("https://roto.test")).rejects.toMatchObject({
      code: "PARSE",
    });
    expect(await services.repos.listRepos()).toEqual([]);
  });
});
