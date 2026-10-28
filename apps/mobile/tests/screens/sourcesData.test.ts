import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { zipSync } from "fflate";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ModuleError, StubHttp, type SecureLock } from "@ryuunest/core";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { createFflateArchive } from "../../src/data/fflateArchive";
import { OFFICIAL_REPO_URL } from "../../src/data/officialRepo";
import {
  INSTALL_PROTECTION_SETTING,
  createSourcesService,
  type SourcesService,
} from "../../src/screens/sources/sourcesData";

/**
 * F16 — capa de datos de Fuentes (RF-1 a RF-8): repos, instalar, activar,
 * desinstalar y actualizar sobre el núcleo real (SQLite, zips reales y los
 * validadores de `module-sdk`); solo la red y el bloqueo del dispositivo son
 * dobles. La protección de instalación (RF-7) se lee de la tabla `setting`.
 */

const REPO_URL = "https://repo.test/index.json";
const PACKAGE_URL = "https://repo.test/packages/";

const text = (value: string) => new TextEncoder().encode(value);

interface Version {
  id: string;
  version: string;
  runtime?: "declarative" | "script";
  domains?: string[];
  nsfw?: boolean;
}

function manifestOf(v: Version) {
  const runtime = v.runtime ?? "declarative";
  return {
    id: v.id,
    name: `Módulo ${v.id}`,
    version: v.version,
    apiVersion: 1,
    runtime,
    kinds: ["manga"],
    lang: "es",
    nsfw: v.nsfw ?? false,
    baseUrl: "https://ejemplo.test",
    capabilities: ["search"],
    permissions: { domains: v.domains ?? ["ejemplo.test"] },
    entry: runtime === "script" ? "index.js" : "index.json",
  };
}

function zipOf(v: Version): Uint8Array {
  const manifest = manifestOf(v);
  return zipSync({
    "manifest.json": text(JSON.stringify(manifest)),
    [manifest.entry]: text(manifest.runtime === "script" ? "export default {}" : "{}"),
  });
}

class Repo {
  readonly http: StubHttp;
  private readonly routes: Record<
    string,
    { status?: number; body?: string; bodyBytes?: Uint8Array }
  > = {};

  /** El índice deja de responder bien (error 500). */
  breakIndex(): void {
    this.routes[REPO_URL] = { status: 500, body: "" };
  }

  constructor(versions: Version[]) {
    this.http = new StubHttp(this.routes);
    this.publish(versions);
  }

  /** Sirve el índice del repo oficial (P-85) con los módulos indicados. */
  serveOfficial(versions: Version[]): void {
    this.routes[OFFICIAL_REPO_URL] = {
      body: JSON.stringify(this.indexBody("Repo oficial de prueba", versions)),
    };
  }

  /** El índice del repo oficial deja de responder bien (error 500). */
  breakOfficialIndex(): void {
    this.routes[OFFICIAL_REPO_URL] = { status: 500, body: "" };
  }

  private indexBody(name: string, versions: Version[]) {
    return {
      format: "ryuunest-repo",
      version: 1,
      name,
      updatedAt: "2026-10-05T00:00:00Z",
      modules: versions.map((v) => {
        const bytes = zipOf(v);
        const { entry: _entry, ...rest } = manifestOf(v);
        return {
          ...rest,
          package: `packages/${v.id}.zip`,
          sha256: bytesToHex(sha256(bytes)),
          size: bytes.length,
        };
      }),
    };
  }

  publish(versions: Version[]): void {
    this.routes[REPO_URL] = {
      body: JSON.stringify(this.indexBody("Repo de prueba", versions)),
    };
    for (const v of versions) {
      const bytes = zipOf(v);
      this.routes[`${PACKAGE_URL}${v.id}.zip`] = { bodyBytes: bytes };
    }
  }
}

function fakeLock(options: { available: boolean; grants?: boolean }): SecureLock & {
  asked: string[];
} {
  const asked: string[] = [];
  return {
    asked,
    isAvailable: async () => options.available,
    authenticate: async (reason) => {
      asked.push(reason);
      return options.grants ?? true;
    },
  };
}

let driver: Awaited<ReturnType<typeof openMigratedDriver>>;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

function build(repo: Repo, lock: SecureLock = fakeLock({ available: false })): SourcesService {
  return createSourcesService({
    driver,
    http: repo.http,
    archive: createFflateArchive(),
    secureLock: lock,
    clock: { now: () => 5_000 },
    appVersion: "1.0.0",
  });
}

async function setProtection(on: boolean): Promise<void> {
  await driver.run("INSERT INTO setting (key, value) VALUES (?, ?)", [
    INSTALL_PROTECTION_SETTING,
    on ? "true" : "false",
  ]);
}

describe("createSourcesService · repos y lista (RF-1 a RF-3, RF-8)", () => {
  it("sin repos ni módulos devuelve la lista vacía (RF-1)", async () => {
    const service = build(new Repo([]));

    expect(await service.load()).toEqual({
      repos: [],
      modules: [],
      officialRepoDismissed: false,
    });
  });

  it("añade un repo y lista sus módulos como disponibles con sus metadatos (RF-2, RF-3)", async () => {
    const service = build(new Repo([{ id: "uno", version: "1.0.0" }]));

    await service.addRepo(REPO_URL);
    const data = await service.load();

    expect(data.repos).toEqual([
      expect.objectContaining({ id: REPO_URL, name: "Repo de prueba", moduleCount: 1 }),
    ]);
    expect(data.modules).toEqual([
      expect.objectContaining({
        id: "uno",
        status: "available",
        runtime: "declarative",
        kinds: ["manga"],
        lang: "es",
        nsfw: false,
        domains: ["ejemplo.test"],
        repoId: REPO_URL,
      }),
    ]);
  });

  it("rechaza una URL que no es HTTPS y no guarda nada (RF-2)", async () => {
    const service = build(new Repo([]));

    await expect(service.addRepo("http://repo.test/index.json")).rejects.toBeInstanceOf(
      ModuleError,
    );
    expect((await service.load()).repos).toEqual([]);
  });

  it("quitar un repo conserva sus módulos y los marca sin repo (RF-8)", async () => {
    const service = build(new Repo([{ id: "uno", version: "1.0.0" }]));
    await service.addRepo(REPO_URL);
    await service.install(REPO_URL, "uno", { confirmed: true });

    await service.removeRepo(REPO_URL);
    const data = await service.load();

    expect(data.repos).toEqual([]);
    expect(data.modules).toEqual([
      expect.objectContaining({ id: "uno", status: "installed", orphan: true }),
    ]);
  });
});

describe("createSourcesService · instalar, activar y desinstalar (RF-4, RF-5)", () => {
  it("instala tras confirmar y lo deja activo; sin confirmar no instala (AC-8)", async () => {
    const service = build(new Repo([{ id: "uno", version: "1.0.0" }]));
    await service.addRepo(REPO_URL);

    await expect(service.install(REPO_URL, "uno", { confirmed: false })).rejects.toThrow(
      "confirmación",
    );
    expect((await service.load()).modules[0]).toMatchObject({ status: "available" });

    await service.install(REPO_URL, "uno", { confirmed: true });

    expect((await service.load()).modules[0]).toMatchObject({
      id: "uno",
      status: "installed",
      enabled: true,
      version: "1.0.0",
    });
  });

  it("la vista previa trae permisos, hash y si exige confirmación reforzada", async () => {
    const service = build(
      new Repo([{ id: "uno", version: "1.0.0", runtime: "script", domains: ["a.test"] }]),
    );
    await service.addRepo(REPO_URL);

    const preview = await service.previewInstall(REPO_URL, "uno");

    expect(preview).toMatchObject({
      id: "uno",
      runtime: "script",
      reinforced: true,
      permissions: { domains: ["a.test"] },
    });
    expect(preview.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("activa y desactiva, y desinstala (RF-5)", async () => {
    const service = build(new Repo([{ id: "uno", version: "1.0.0" }]));
    await service.addRepo(REPO_URL);
    await service.install(REPO_URL, "uno", { confirmed: true });

    await service.setEnabled("uno", false);
    expect((await service.load()).modules[0]).toMatchObject({ enabled: false });

    await service.uninstall("uno");
    expect((await service.load()).modules[0]).toMatchObject({ status: "available" });
  });
});

describe("createSourcesService · protección de instalación (RF-7)", () => {
  it("apagada por defecto: instalar un script no pide el bloqueo", async () => {
    const lock = fakeLock({ available: true });
    const service = build(new Repo([{ id: "s", version: "1.0.0", runtime: "script" }]), lock);
    await service.addRepo(REPO_URL);

    await service.install(REPO_URL, "s", { confirmed: true, reinforced: true });

    expect(lock.asked).toEqual([]);
  });

  it("activa: añadir un repo y instalar un script piden el bloqueo", async () => {
    await setProtection(true);
    const lock = fakeLock({ available: true });
    const service = build(new Repo([{ id: "s", version: "1.0.0", runtime: "script" }]), lock);

    await service.addRepo(REPO_URL);
    await service.install(REPO_URL, "s", { confirmed: true, reinforced: true });

    expect(lock.asked).toHaveLength(2);
  });

  it("activa: instalar un módulo declarativo no pide el bloqueo", async () => {
    await setProtection(true);
    const lock = fakeLock({ available: true });
    const service = build(new Repo([{ id: "d", version: "1.0.0" }]), lock);
    await service.addRepo(REPO_URL);
    lock.asked.length = 0;

    await service.install(REPO_URL, "d", { confirmed: true });

    expect(lock.asked).toEqual([]);
  });

  it("si el usuario no se autentica, no se instala nada", async () => {
    await setProtection(true);
    const repo = new Repo([{ id: "s", version: "1.0.0", runtime: "script" }]);
    await build(repo, fakeLock({ available: true })).addRepo(REPO_URL);
    const service = build(repo, fakeLock({ available: true, grants: false }));

    await expect(
      service.install(REPO_URL, "s", { confirmed: true, reinforced: true }),
    ).rejects.toThrow("bloqueo");
    expect((await service.load()).modules[0]).toMatchObject({ status: "available" });
  });

  it("activa sin bloqueo en el dispositivo: falla cerrado en vez de saltarse la protección", async () => {
    await setProtection(true);
    const service = build(new Repo([]), fakeLock({ available: false }));

    await expect(service.addRepo(REPO_URL)).rejects.toThrow("bloqueo");
  });
});

describe("createSourcesService · actualizar (RF-6)", () => {
  it("marca la actualización disponible y la aplica conservando el estado", async () => {
    const repo = new Repo([{ id: "uno", version: "1.0.0" }]);
    const service = build(repo);
    await service.addRepo(REPO_URL);
    await service.install(REPO_URL, "uno", { confirmed: true });
    await service.setEnabled("uno", false);

    repo.publish([{ id: "uno", version: "1.1.0" }]);
    await service.addRepo(REPO_URL);
    expect((await service.load()).modules[0]).toMatchObject({ updateTo: "1.1.0" });

    const result = await service.applyUpdate("uno", {});

    expect(result.status).toBe("updated");
    expect((await service.load()).modules[0]).toMatchObject({
      version: "1.1.0",
      enabled: false,
    });
    expect((await service.load()).modules[0]?.updateTo).toBeUndefined();
  });

  it("con permisos ampliados pide confirmar de nuevo y no aplica nada antes", async () => {
    const repo = new Repo([{ id: "uno", version: "1.0.0" }]);
    const service = build(repo);
    await service.addRepo(REPO_URL);
    await service.install(REPO_URL, "uno", { confirmed: true });

    repo.publish([{ id: "uno", version: "1.1.0", domains: ["ejemplo.test", "cdn.test"] }]);
    await service.addRepo(REPO_URL);

    const result = await service.applyUpdate("uno", {});

    expect(result.status).toBe("needs-confirmation");
    expect((await service.load()).modules[0]).toMatchObject({ version: "1.0.0" });
  });
});

describe("createSourcesService · último error del módulo (RF-5)", () => {
  it("expone el último error guardado en el registro", async () => {
    const service = build(new Repo([{ id: "uno", version: "1.0.0" }]));
    await service.addRepo(REPO_URL);
    await service.install(REPO_URL, "uno", { confirmed: true });

    await service.recordModuleError("uno", "El selector ya no existe");

    expect((await service.load()).modules[0]).toMatchObject({
      lastError: "El selector ya no existe",
    });
  });
});

describe("createSourcesService · sincronizar un repo (botón del diseño)", () => {
  it("vuelve a leer el índice sin pedir el bloqueo: no es añadir un repo (RF-7)", async () => {
    const repo = new Repo([{ id: "uno", version: "1.0.0" }]);
    const lock = fakeLock({ available: true });
    const service = build(repo, lock);
    await service.addRepo(REPO_URL);
    await service.install(REPO_URL, "uno", { confirmed: true });

    await setProtection(true);
    repo.publish([{ id: "uno", version: "1.1.0" }]);
    await service.refreshRepo(REPO_URL);

    expect(lock.asked).toEqual([]);
    expect((await service.load()).modules[0]).toMatchObject({ updateTo: "1.1.0" });
  });

  it("si el índice falla, lanza y conserva lo que ya había", async () => {
    const repo = new Repo([{ id: "uno", version: "1.0.0" }]);
    const service = build(repo);
    await service.addRepo(REPO_URL);

    repo.breakIndex();

    await expect(service.refreshRepo(REPO_URL)).rejects.toBeInstanceOf(ModuleError);
    expect((await service.load()).repos).toHaveLength(1);
  });
});

describe("createSourcesService · repo oficial por defecto (P-85)", () => {
  it("con la lista vacía lo registra y sus módulos quedan disponibles", async () => {
    const repo = new Repo([]);
    repo.serveOfficial([{ id: "uno", version: "1.0.0" }]);
    const service = build(repo);

    expect(await service.ensureOfficialRepo()).toBe(true);
    const data = await service.load();

    expect(data.repos).toEqual([
      expect.objectContaining({ id: OFFICIAL_REPO_URL, name: "Repo oficial de prueba" }),
    ]);
    expect(data.modules).toEqual([
      expect.objectContaining({ id: "uno", status: "available", repoId: OFFICIAL_REPO_URL }),
    ]);
  });

  it("no lo añade si ya hay repos, y no toca la red", async () => {
    const repo = new Repo([{ id: "uno", version: "1.0.0" }]);
    repo.serveOfficial([{ id: "otro", version: "1.0.0" }]);
    const service = build(repo);
    await service.addRepo(REPO_URL);
    repo.http.requests.length = 0;

    expect(await service.ensureOfficialRepo()).toBe(false);
    expect(repo.http.requests).toEqual([]);
  });

  it("primera parte: no pide el bloqueo aunque la protección esté activa (RF-7)", async () => {
    await setProtection(true);
    const lock = fakeLock({ available: true });
    const repo = new Repo([]);
    repo.serveOfficial([{ id: "uno", version: "1.0.0" }]);
    const service = build(repo, lock);

    await service.ensureOfficialRepo();

    expect(lock.asked).toEqual([]);
  });

  it("quitar el repo oficial recuerda el descarte y no vuelve a añadirse solo", async () => {
    const repo = new Repo([]);
    repo.serveOfficial([{ id: "uno", version: "1.0.0" }]);
    const service = build(repo);
    await service.ensureOfficialRepo();

    await service.removeRepo(OFFICIAL_REPO_URL);
    repo.http.requests.length = 0;

    expect(await service.load()).toMatchObject({ repos: [], officialRepoDismissed: true });
    expect(await service.ensureOfficialRepo()).toBe(false);
    expect(repo.http.requests).toEqual([]);
  });

  it("restaurarlo lo vuelve a registrar y limpia el descarte", async () => {
    const repo = new Repo([]);
    repo.serveOfficial([{ id: "uno", version: "1.0.0" }]);
    const service = build(repo);
    await service.ensureOfficialRepo();
    await service.removeRepo(OFFICIAL_REPO_URL);

    await service.restoreOfficialRepo();

    expect(await service.load()).toMatchObject({
      repos: [expect.objectContaining({ id: OFFICIAL_REPO_URL })],
      officialRepoDismissed: false,
    });
  });

  it("si el índice oficial falla, lanza sin dejar nada a medias", async () => {
    const repo = new Repo([]);
    repo.serveOfficial([]);
    repo.breakOfficialIndex();
    const service = build(repo);

    await expect(service.ensureOfficialRepo()).rejects.toBeInstanceOf(ModuleError);
    expect((await service.load()).repos).toEqual([]);
  });
});
