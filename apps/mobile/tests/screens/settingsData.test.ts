import { StubHttp, type SecureLock } from "@ryuunest/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { OFFICIAL_REPO_DISMISSAL_SETTING, OFFICIAL_REPO_URL } from "../../src/data/officialRepo";
import { createSettingsService } from "../../src/screens/settings/settingsData";
import { INSTALL_PROTECTION_SETTING } from "../../src/screens/sources/sourcesData";

/**
 * F16b — capa de datos de Ajustes sobre el núcleo real (SQLite): el
 * interruptor escribe `security.installProtection` (RF-7) sin poderse activar
 * sin bloqueo en el dispositivo, y expone si el repo oficial está registrado
 * para poder restaurarlo (P-85).
 */

const OFFICIAL_INDEX_BODY = JSON.stringify({
  format: "ryuunest-repo",
  version: 1,
  name: "Repo oficial de prueba",
  updatedAt: "2026-10-05T00:00:00Z",
  modules: [],
});

function fakeLock(available: boolean): SecureLock {
  return {
    isAvailable: async () => available,
    authenticate: async () => true,
  };
}

let driver: Awaited<ReturnType<typeof openMigratedDriver>>;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

function build(lock: SecureLock = fakeLock(false), serveOfficial = true): ReturnType<typeof createSettingsService> {
  const routes: Record<string, { body?: string }> = {};
  if (serveOfficial) {
    routes[OFFICIAL_REPO_URL] = { body: OFFICIAL_INDEX_BODY };
  }
  return createSettingsService({
    driver,
    http: new StubHttp(routes),
    clock: { now: () => 5_000 },
    secureLock: lock,
  });
}

describe("createSettingsService · protección de instalación (RF-7, F16b)", () => {
  it("apagada por defecto y expone si el dispositivo tiene bloqueo", async () => {
    const service = build(fakeLock(true));

    expect(await service.load()).toEqual({
      installProtection: false,
      lockAvailable: true,
      officialRepoRegistered: false,
      nsfwVisible: false,
      language: "es",
      defaultReaderMode: "vertical",
    });
  });

  it("guarda la visibilidad NSFW y el modo de lectura predeterminado", async () => {
    const service = build(fakeLock(true));

    await service.setNsfwVisible(true);
    await service.setDefaultReaderMode("paged-rtl");

    expect(await service.load()).toMatchObject({
      nsfwVisible: true,
      defaultReaderMode: "paged-rtl",
    });
  });

  it("activar escribe el ajuste solo si hay bloqueo en el dispositivo", async () => {
    const service = build(fakeLock(true));

    await service.setInstallProtection(true);

    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      INSTALL_PROTECTION_SETTING,
    ]);
    expect(row?.value).toBe("true");
    expect((await service.load()).installProtection).toBe(true);
  });

  it("sin bloqueo no se puede activar: falla cerrado y no escribe nada", async () => {
    const service = build(fakeLock(false));

    await expect(service.setInstallProtection(true)).rejects.toThrow("bloqueo");
    expect((await service.load()).installProtection).toBe(false);
    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      INSTALL_PROTECTION_SETTING,
    ]);
    expect(row).toBeUndefined();
  });

  it("apagar no exige bloqueo", async () => {
    await driver.run("INSERT INTO setting (key, value) VALUES (?, 'true')", [
      INSTALL_PROTECTION_SETTING,
    ]);
    const service = build(fakeLock(false));

    await service.setInstallProtection(false);

    expect((await service.load()).installProtection).toBe(false);
  });
});

describe("createSettingsService · repo oficial (P-85)", () => {
  it("restaurarlo lo registra y limpia el descarte", async () => {
    await driver.run("INSERT INTO setting (key, value) VALUES (?, 'true')", [
      OFFICIAL_REPO_DISMISSAL_SETTING,
    ]);
    const service = build();

    await service.restoreOfficialRepo();

    expect((await service.load()).officialRepoRegistered).toBe(true);
    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      OFFICIAL_REPO_DISMISSAL_SETTING,
    ]);
    expect(row).toBeUndefined();
  });

  it("si el índice del oficial falla, lanza y no limpia el descarte", async () => {
    const service = build(fakeLock(false), false);

    await expect(service.restoreOfficialRepo()).rejects.toBeInstanceOf(Error);
    expect((await service.load()).officialRepoRegistered).toBe(false);
  });
});
