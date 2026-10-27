import { describe, expect, it } from "vitest";

import { createSampleSourcesService } from "../../src/screens/sources/sampleSourcesService";
import { EMPTY_SOURCES_DATA, SAMPLE_SOURCES_DATA } from "../../src/screens/sources/sourcesFixtures";

/**
 * F16 — servicio de Fuentes para la web (sin SQLite, F14c/P-79): guarda en
 * memoria una copia de los datos de ejemplo y aplica las mismas reglas de
 * confirmación que el núcleo, para que Playwright recorra los flujos sin red.
 */

const REPO = SAMPLE_SOURCES_DATA.repos[0]?.id ?? "";

describe("createSampleSourcesService", () => {
  it("arranca con los datos de ejemplo y no comparte estado entre instancias", async () => {
    const a = createSampleSourcesService();
    await a.uninstall("portal-aurora");

    const b = createSampleSourcesService();

    expect((await b.load()).modules.find((m) => m.id === "portal-aurora")?.status).toBe(
      "installed",
    );
  });

  it("puede arrancar vacío para probar el estado vacío (RF-1)", async () => {
    const service = createSampleSourcesService(EMPTY_SOURCES_DATA);

    expect(await service.load()).toEqual(EMPTY_SOURCES_DATA);
  });

  it("instalar exige confirmar y un script exige la confirmación reforzada", async () => {
    const service = createSampleSourcesService();

    await expect(service.install(REPO, "portal-duna", { confirmed: false })).rejects.toThrow(
      "confirmación",
    );
    await expect(service.install(REPO, "portal-cenit", { confirmed: true })).rejects.toThrow(
      "reforzada",
    );

    await service.install(REPO, "portal-cenit", { confirmed: true, reinforced: true });

    expect((await service.load()).modules.find((m) => m.id === "portal-cenit")).toMatchObject({
      status: "installed",
      enabled: true,
    });
  });

  it("activa, desactiva y desinstala", async () => {
    const service = createSampleSourcesService();

    await service.setEnabled("portal-aurora", false);
    expect((await service.load()).modules.find((m) => m.id === "portal-aurora")?.enabled).toBe(
      false,
    );

    await service.uninstall("portal-aurora");
    expect((await service.load()).modules.find((m) => m.id === "portal-aurora")?.status).toBe(
      "available",
    );
  });

  it("actualiza al número de versión disponible y quita la marca", async () => {
    const service = createSampleSourcesService();

    const result = await service.applyUpdate("portal-aurora", {});

    expect(result.status).toBe("updated");
    expect((await service.load()).modules.find((m) => m.id === "portal-aurora")).toMatchObject({
      version: "1.3.0",
    });
    expect(
      (await service.load()).modules.find((m) => m.id === "portal-aurora")?.updateTo,
    ).toBeUndefined();
  });

  it("quitar el repo deja los instalados sin repositorio y quita los disponibles (RF-8)", async () => {
    const service = createSampleSourcesService();

    await service.removeRepo(REPO);
    const data = await service.load();

    expect(data.repos).toEqual([]);
    expect(data.modules.map((m) => m.id).sort()).toEqual(["portal-aurora", "portal-brasa"]);
    expect(data.modules.every((m) => m.orphan)).toBe(true);
  });

  it("añadir un repo en la web registra el de ejemplo; una URL que no es HTTPS se rechaza", async () => {
    const service = createSampleSourcesService(EMPTY_SOURCES_DATA);

    await expect(service.addRepo("http://repo.test/index.json")).rejects.toThrow("HTTPS");

    await service.addRepo("https://repo.ejemplo.org/indice.json");

    expect((await service.load()).repos).toHaveLength(1);
  });

  it("la vista previa trae permisos, hash y si exige confirmación reforzada", async () => {
    const service = createSampleSourcesService();

    const preview = await service.previewInstall(REPO, "portal-cenit");

    expect(preview).toMatchObject({
      id: "portal-cenit",
      reinforced: true,
      permissions: { domains: ["cenit.test", "cdn.cenit.test"] },
    });
    expect(preview.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("guarda y limpia el último error de un módulo", async () => {
    const service = createSampleSourcesService();

    await service.recordModuleError("portal-brasa", undefined);

    expect(
      (await service.load()).modules.find((m) => m.id === "portal-brasa")?.lastError,
    ).toBeUndefined();
  });
});
