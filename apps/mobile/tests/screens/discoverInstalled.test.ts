import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SqliteStorage,
  moduleKey,
  toHex,
  utf8Encode,
  type Http,
  type InstalledPackage,
  type ModuleManifest,
} from "@ryuunest/core";
import {
  EXAMPLE_DECLARATIVE,
  HTML_SITE_BASE_URL,
  TestSiteHttp,
  createHtmlSite,
} from "@ryuunest/test-site";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { createInstalledDiscoverSource } from "../../src/screens/discover/discoverData";

/**
 * F15b — Descubrir sobre módulos INSTALADOS en el dispositivo: la fuente lista
 * el registro de módulos (T14), monta cada paquete con el runtime real (T20)
 * decodificando la entrada en hexadecimal, y persiste el último módulo elegido
 * en la tabla `setting` (SPEC §8.1). SQLite real (`node:sqlite`) y el sitio
 * falso de `test-site` detrás del `Http` inyectado.
 */

let driver: Awaited<ReturnType<typeof openMigratedDriver>>;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

const { popular: _popularDeSobra, ...CONFIG_SIN_POPULAR } = EXAMPLE_DECLARATIVE;

function manifest(
  overrides: Partial<ModuleManifest> & Pick<ModuleManifest, "id" | "name">,
): ModuleManifest {
  return {
    version: "1.0.0",
    apiVersion: 1,
    runtime: "declarative",
    kinds: ["manga"],
    lang: "es",
    nsfw: false,
    baseUrl: HTML_SITE_BASE_URL,
    capabilities: ["popular", "latest", "search"],
    permissions: { domains: ["sitio-html.test"] },
    entry: "index.json",
    ...overrides,
  };
}

function packageFor(
  pkgManifest: ModuleManifest,
  config: unknown = EXAMPLE_DECLARATIVE,
): InstalledPackage {
  return {
    id: pkgManifest.id,
    version: pkgManifest.version,
    repoUrl: "https://repo.test/index.json",
    runtime: pkgManifest.runtime,
    kinds: pkgManifest.kinds,
    lang: pkgManifest.lang,
    nsfw: pkgManifest.nsfw,
    permissions: pkgManifest.permissions,
    manifest: pkgManifest,
    // Los archivos del paquete viven en hexadecimal (el puerto Storage es de texto).
    files: [
      { path: "manifest.json", hex: toHex(utf8Encode(JSON.stringify(pkgManifest))) },
      { path: "index.json", hex: toHex(utf8Encode(JSON.stringify(config))) },
    ],
    installedAt: 1_000,
    enabled: true,
  };
}

async function seed(pkg: InstalledPackage): Promise<void> {
  await new SqliteStorage(driver).set(moduleKey(pkg.id), JSON.stringify(pkg));
}

const INSTALADO = manifest({ id: "m-instalado", name: "Módulo instalado" });
const ADULTO = manifest({
  id: "m-adulto",
  name: "Módulo para mayores",
  nsfw: true,
  capabilities: ["latest", "search"],
});
const APAGADO = manifest({ id: "m-apagado", name: "Módulo apagado" });

function siteHttp(): Http {
  return new TestSiteHttp(createHtmlSite());
}

describe("createInstalledDiscoverSource · listModules", () => {
  it("solo lista declarativos activos, con las capacidades del manifest", async () => {
    await seed(packageFor(INSTALADO));
    await seed(packageFor(ADULTO, CONFIG_SIN_POPULAR));
    await seed({ ...packageFor(manifest({ id: "m-script", name: "Módulo script" })), runtime: "script" });
    await seed({ ...packageFor(APAGADO), enabled: false });

    const source = createInstalledDiscoverSource({ driver, http: siteHttp() });
    expect(await source.listModules()).toEqual([
      { id: "m-adulto", name: "Módulo para mayores", nsfw: true, hasPopular: false, hasLatest: true },
      { id: "m-instalado", name: "Módulo instalado", nsfw: false, hasPopular: true, hasLatest: true },
    ]);
  });
});

describe("createInstalledDiscoverSource · load", () => {
  it("monta la entrada del paquete (hex → config) y estampa el moduleId", async () => {
    await seed(packageFor(INSTALADO));
    const source = createInstalledDiscoverSource({ driver, http: siteHttp() });

    const data = await source.load({ moduleId: "m-instalado", query: "dragon", page: 1 });

    expect(data.catalog.entries).toHaveLength(1);
    expect(data.catalog.entries[0]).toMatchObject({
      seriesId: "dragon-de-ceniza",
      moduleId: "m-instalado",
      kind: "manhwa",
    });
    expect(data.popular.map((entry) => entry.seriesId)).toEqual([
      "dragon-de-ceniza",
      "guardiana-del-nido",
      "cronicas-de-moonlit",
    ]);
    expect(data.latest.map((entry) => entry.seriesId)).toEqual([
      "draco-de-jade",
      "noche-de-ambar",
      "cronicas-de-moonlit",
    ]);
  });

  it("un módulo sin `popular` declarada trae la fila vacía", async () => {
    await seed(packageFor(ADULTO, CONFIG_SIN_POPULAR));
    const source = createInstalledDiscoverSource({ driver, http: siteHttp() });

    const data = await source.load({ moduleId: "m-adulto", query: "", page: 1 });
    expect(data.popular).toEqual([]);
    expect(data.latest.length).toBeGreaterThan(0);
  });

  it("módulo desconocido o apagado falla con NOT_FOUND sin tocar la red", async () => {
    let pedidos = 0;
    const contador: Http = {
      async request() {
        pedidos += 1;
        throw new Error("no debe haber red");
      },
    };
    const source = createInstalledDiscoverSource({ driver, http: contador });

    await expect(source.load({ moduleId: "m-fantasma", query: "", page: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await seed({ ...packageFor(APAGADO), enabled: false });
    await expect(source.load({ moduleId: "m-apagado", query: "", page: 1 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(pedidos).toBe(0);
  });
});

describe("createInstalledDiscoverSource · último módulo (RF-9 entre arranques)", () => {
  it("arranca sin recuerdo, recuerda al elegir y lo sobrescribe", async () => {
    const source = createInstalledDiscoverSource({ driver, http: siteHttp() });
    expect(await source.recallLastModule()).toBeNull();

    await source.rememberLastModule("m-instalado");
    expect(await source.recallLastModule()).toBe("m-instalado");

    await source.rememberLastModule("m-adulto");
    expect(await source.recallLastModule()).toBe("m-adulto");
  });

  it("el recuerdo vive en la tabla `setting` (SPEC §8.1)", async () => {
    const source = createInstalledDiscoverSource({ driver, http: siteHttp() });
    await source.rememberLastModule("m-instalado");

    const fila = await driver.get<{ value: string }>(
      "SELECT value FROM setting WHERE key = ?",
      ["discover.lastModule"],
    );
    expect(fila?.value).toBe("m-instalado");
  });
});
