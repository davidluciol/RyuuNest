import { StubHttp } from "@ryuunest/core";
import { dragonNightColors } from "@ryuunest/ui-tokens";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { createSampleSettingsService } from "../../src/screens/settings/sampleSettingsService";
import {
  createSettingsService,
  type SettingsService,
} from "../../src/screens/settings/settingsData";
import { parseThemeFile } from "../../src/screens/settings/themeSettings";

/** F90/F91 — tema activo persistente, temas importados y su validación. */

const themeJson = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    schemaVersion: 1,
    id: "noche-azul",
    name: "Noche azul",
    colors: { ...dragonNightColors, accent: "#5AA9FF" },
    ...over,
  });

describe("parseThemeFile (F91)", () => {
  it("devuelve el tema de un JSON válido", () => {
    expect(parseThemeFile(themeJson()).id).toBe("noche-azul");
  });

  it("falla con un mensaje claro si no es JSON", () => {
    expect(() => parseThemeFile("{no")).toThrow(/JSON/);
  });

  it("falla listando los motivos si no valida", () => {
    expect(() => parseThemeFile(themeJson({ id: "X Y" }))).toThrow(/id/);
  });
});

function contract(
  name: string,
  make: () => Promise<{ service: SettingsService; done: () => void }>,
) {
  describe(`${name}: temas`, () => {
    let service: SettingsService;
    let done: () => void;
    beforeEach(async () => {
      ({ service, done } = await make());
    });
    afterEach(() => done());

    it("por defecto: Dragon Night activo y es el único tema", async () => {
      const data = await service.load();
      expect(data.activeThemeId).toBe("dragon-night");
      expect(data.themes.map((t) => [t.id, t.builtIn])).toEqual([["dragon-night", true]]);
    });

    it("importa un tema, lo lista como importado y se puede activar", async () => {
      await service.importTheme(themeJson());
      await service.setActiveTheme("noche-azul");
      const data = await service.load();
      expect(data.activeThemeId).toBe("noche-azul");
      expect(data.themes.find((t) => t.id === "noche-azul")).toMatchObject({ builtIn: false });
    });

    it("rechaza un JSON inválido, un id repetido y activar un tema que no existe", async () => {
      await expect(service.importTheme("{no")).rejects.toThrow();
      await expect(service.importTheme(themeJson({ id: "dragon-night" }))).rejects.toThrow(
        /ya existe/i,
      );
      await service.importTheme(themeJson());
      await expect(service.importTheme(themeJson())).rejects.toThrow(/ya existe/i);
      await expect(service.setActiveTheme("fantasma")).rejects.toThrow();
    });

    it("borrar el tema activo vuelve a Dragon Night; los integrados no se borran", async () => {
      await service.importTheme(themeJson());
      await service.setActiveTheme("noche-azul");
      await service.deleteTheme("noche-azul");
      const data = await service.load();
      expect(data.activeThemeId).toBe("dragon-night");
      expect(data.themes).toHaveLength(1);
      await expect(service.deleteTheme("dragon-night")).rejects.toThrow();
    });
  });
}

contract("SQLite", async () => {
  const driver = await openMigratedDriver();
  const service = createSettingsService({
    driver,
    http: new StubHttp(),
    clock: { now: () => 0 },
    secureLock: { isAvailable: async () => false, authenticate: async () => true },
  });
  return { service, done: () => driver.close() };
});

contract("memoria (web/galería)", async () => ({
  service: createSampleSettingsService(),
  done: () => {},
}));

describe("persistencia entre sesiones (SQLite)", () => {
  it("el tema activo y los importados sobreviven a un servicio nuevo", async () => {
    const driver = await openMigratedDriver();
    const deps = {
      driver,
      http: new StubHttp(),
      clock: { now: () => 0 },
      secureLock: { isAvailable: async () => false, authenticate: async () => true },
    };
    const first = createSettingsService(deps);
    await first.importTheme(themeJson());
    await first.setActiveTheme("noche-azul");
    const second = await createSettingsService(deps).load();
    expect(second.activeThemeId).toBe("noche-azul");
    driver.close();
  });
});
