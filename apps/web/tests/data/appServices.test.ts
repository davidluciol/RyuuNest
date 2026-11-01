import { describe, expect, it } from "vitest";

import { StubHttp } from "@ryuunest/core";

import { openWebServices } from "../../src/data/appServices";
import { createMemoryByteStore } from "../../src/data/byteStore";

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
