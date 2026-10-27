import { describe, expect, it } from "vitest";

import { fromHex, utf8Encode } from "../../src/bytes";
import { ModuleError, type ModuleErrorCode } from "../../src/contract/errors";
import type { ModuleManifest } from "../../src/contract/types";
import type { ArchiveEntry } from "../../src/ports/archive";
import { FakeArchive, FixedClock, MemoryStorage, StubHttp } from "../../src/ports/fakes";
import type { Storage } from "../../src/ports/storage";
import {
  INSTALL_LIMITS,
  PackageInstaller,
  moduleKey,
  type InstallRequest,
  type ManifestValidator,
} from "../../src/install/PackageInstaller";
import { sha256Hex } from "../../src/install/verify";

/**
 * Instalador de paquetes (SPEC §7.1 y §7.2).
 *
 * El `Archive` falso ignora los bytes del `.zip` y devuelve las entradas configuradas, así
 * que el paquete de prueba son los bytes de `"abc"` y su hash esperado es el **vector de
 * prueba conocido** de SHA-256 (no se recalcula con la implementación).
 */

const REPO_URL = "https://repo.example.com/index.json";
const PACKAGE_PATH = "packages/ejemplo-1.0.0.zip";
const PACKAGE_URL = "https://repo.example.com/packages/ejemplo-1.0.0.zip";

const PACKAGE_BYTES = utf8Encode("abc");
/** SHA-256 de "abc" (vector de prueba conocido). */
const PACKAGE_SHA = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";

const MANIFEST: ModuleManifest = {
  id: "ejemplo",
  name: "Ejemplo",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "script",
  kinds: ["manga"],
  lang: "es",
  nsfw: false,
  baseUrl: "https://ejemplo.com",
  capabilities: ["popular", "latest", "search"],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.js",
};

const ENTRY_SOURCE = "console.log(1)";

const acceptAll: ManifestValidator = (value) => ({ ok: true, value: value as ModuleManifest });

function manifestEntry(manifest: unknown = MANIFEST): ArchiveEntry {
  return { path: "manifest.json", data: utf8Encode(JSON.stringify(manifest)) };
}

function fileEntry(path: string, content = ENTRY_SOURCE): ArchiveEntry {
  return { path, data: utf8Encode(content) };
}

function defaultEntries(): ArchiveEntry[] {
  return [manifestEntry(), fileEntry("index.js")];
}

/** `Storage` que falla al escribir: sirve para probar la atomicidad. */
class FailingStorage implements Storage {
  readonly #data = new Map<string, string>();

  constructor(private readonly failAfter = 0) {}

  async get(key: string): Promise<string | undefined> {
    return this.#data.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (this.#data.size >= this.failAfter) {
      throw new Error("disco lleno");
    }
    this.#data.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.#data.delete(key);
  }

  async keys(): Promise<string[]> {
    return [...this.#data.keys()];
  }
}

function makeInstaller(
  options: {
    entries?: ArchiveEntry[];
    bytes?: Uint8Array;
    sha256?: string;
    size?: number;
    storage?: Storage;
    clock?: FixedClock;
    validateManifest?: ManifestValidator;
    appVersion?: string;
  } = {},
): {
  installer: PackageInstaller;
  storage: Storage;
  http: StubHttp;
  clock: FixedClock;
  request: InstallRequest;
} {
  const bytes = options.bytes ?? PACKAGE_BYTES;
  const http = new StubHttp({ [PACKAGE_URL]: { bodyBytes: bytes } });
  const storage = options.storage ?? new MemoryStorage();
  const clock = options.clock ?? new FixedClock(1_000);
  const installer = new PackageInstaller({
    http,
    archive: new FakeArchive(options.entries ?? defaultEntries()),
    storage,
    clock,
    validateManifest: options.validateManifest ?? acceptAll,
    ...(options.appVersion === undefined ? {} : { appVersion: options.appVersion }),
  });

  const request: InstallRequest = {
    repoUrl: REPO_URL,
    package: PACKAGE_PATH,
    sha256: options.sha256 ?? PACKAGE_SHA,
    size: options.size ?? bytes.length,
  };

  return { installer, storage, http, clock, request };
}

async function captureError(
  promise: Promise<unknown>,
  code: ModuleErrorCode,
): Promise<ModuleError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );

  expect(error).toBeInstanceOf(ModuleError);
  const moduleError = error as ModuleError;
  expect(moduleError.code).toBe(code);
  return moduleError;
}

describe("verify · hash y rutas", () => {
  it("calcula el SHA-256 de un vector de prueba conocido", () => {
    expect(sha256Hex(utf8Encode("abc"))).toBe(PACKAGE_SHA);
  });
});

describe("PackageInstaller · instalación (SPEC §7.1)", () => {
  it("descarga, verifica, descomprime, valida el manifest y guarda el paquete", async () => {
    const { installer, storage, http, request } = makeInstaller();

    const installed = await installer.install(request);

    expect(http.requests.map((entry) => entry.url)).toEqual([PACKAGE_URL]);
    expect(installed).toMatchObject({
      id: "ejemplo",
      version: "1.0.0",
      repoUrl: REPO_URL,
      runtime: "script",
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
      permissions: { domains: ["ejemplo.com"] },
      installedAt: 1_000,
      enabled: true,
    });
    expect(installed.files.map((file) => file.path)).toEqual(["index.js", "manifest.json"]);

    const stored = await storage.get(moduleKey("ejemplo"));
    expect(stored).toBeDefined();
    expect(JSON.parse(stored ?? "null")).toMatchObject({ id: "ejemplo", version: "1.0.0" });
  });

  it("guarda los archivos en hexadecimal, sin pérdidas", async () => {
    const { installer, request } = makeInstaller();

    const installed = await installer.install(request);
    const entry = installed.files.find((file) => file.path === "index.js");

    expect(fromHex(entry?.hex ?? "")).toEqual(utf8Encode(ENTRY_SOURCE));
  });

  it("rechaza un paquete que declara más bytes del tope sin descargarlo", async () => {
    const { installer, http, request } = makeInstaller({ size: INSTALL_LIMITS.packageBytes + 1 });

    const error = await captureError(installer.install(request), "UNSUPPORTED");

    expect(http.requests).toHaveLength(0);
    expect(error.message).toContain("tope");
  });
});

describe("PackageInstaller · hash (SPEC §7.1, paso 5)", () => {
  it("rechaza un hash incorrecto con mensaje claro y sin dejar restos", async () => {
    const { installer, storage, request } = makeInstaller({ sha256: "0".repeat(64) });

    const error = await captureError(installer.install(request), "PARSE");

    expect(error.message).toContain("hash");
    expect(await storage.keys()).toEqual([]);
  });
});

describe("PackageInstaller · zip-slip (SPEC §7.2)", () => {
  it("rechaza rutas con «..» sin dejar restos", async () => {
    const { installer, storage, request } = makeInstaller({
      entries: [manifestEntry(), fileEntry("../evil.js")],
    });

    const error = await captureError(installer.install(request), "UNSUPPORTED");

    expect(error.message).toContain("../evil.js");
    expect(await storage.keys()).toEqual([]);
  });

  it("rechaza rutas absolutas", async () => {
    const { installer, request } = makeInstaller({
      entries: [manifestEntry(), fileEntry("/etc/passwd")],
    });

    await captureError(installer.install(request), "UNSUPPORTED");
  });

  it("rechaza rutas con barras invertidas que escapan", async () => {
    const { installer, request } = makeInstaller({
      entries: [manifestEntry(), fileEntry("..\\evil.js")],
    });

    await captureError(installer.install(request), "UNSUPPORTED");
  });
});

describe("PackageInstaller · límites (SPEC §7.1)", () => {
  it("rechaza más archivos que el tope", async () => {
    const entries = [
      manifestEntry(),
      ...Array.from({ length: INSTALL_LIMITS.files }, (_value, index) => fileEntry(`f${index}.js`)),
    ];
    const { installer, storage, request } = makeInstaller({ entries });

    const error = await captureError(installer.install(request), "UNSUPPORTED");

    expect(error.message).toContain("archivos");
    expect(await storage.keys()).toEqual([]);
  });

  it("rechaza contenido descomprimido por encima del tope (bomba)", async () => {
    const bomb: ArchiveEntry = {
      path: "bomba.js",
      data: new Uint8Array(INSTALL_LIMITS.unpackedBytes + 1),
    };
    const { installer, storage, request } = makeInstaller({ entries: [manifestEntry(), bomb] });

    const error = await captureError(installer.install(request), "UNSUPPORTED");

    expect(error.message).toContain("descomprimido");
    expect(await storage.keys()).toEqual([]);
  });

  it("rechaza un paquete descargado por encima del tope", async () => {
    const { installer, request } = makeInstaller({
      bytes: new Uint8Array(INSTALL_LIMITS.packageBytes + 1),
      size: 1,
    });

    await captureError(installer.install(request), "UNSUPPORTED");
  });
});

describe("PackageInstaller · manifest (SPEC §7.1, paso 7)", () => {
  it("rechaza un manifest inválido con la ruta y el motivo", async () => {
    const { installer, storage, request } = makeInstaller({
      validateManifest: () => ({
        ok: false,
        issues: [{ path: "apiVersion", message: "Debe ser 1" }],
      }),
    });

    const error = await captureError(installer.install(request), "PARSE");

    expect(error.message).toContain("apiVersion");
    expect(error.message).toContain("Debe ser 1");
    expect(await storage.keys()).toEqual([]);
  });

  it("rechaza un paquete sin manifest.json", async () => {
    const { installer, request } = makeInstaller({ entries: [fileEntry("index.js")] });

    const error = await captureError(installer.install(request), "PARSE");

    expect(error.message).toContain("manifest.json");
  });

  it("rechaza un manifest.json que no es JSON", async () => {
    const { installer, request } = makeInstaller({
      entries: [{ path: "manifest.json", data: utf8Encode("{no") }, fileEntry("index.js")],
    });

    await captureError(installer.install(request), "PARSE");
  });

  it("rechaza un paquete al que le falta el archivo de entrada", async () => {
    const { installer, request } = makeInstaller({ entries: [manifestEntry()] });

    const error = await captureError(installer.install(request), "PARSE");

    expect(error.message).toContain("index.js");
  });

  it("pasa la versión de la app al validador", async () => {
    const seen: Array<{ appVersion?: string } | undefined> = [];
    const validateManifest: ManifestValidator = (value, options) => {
      seen.push(options);
      return { ok: true, value: value as ModuleManifest };
    };
    const { installer, request } = makeInstaller({ validateManifest, appVersion: "0.5.0" });

    await installer.install(request);

    expect(seen).toEqual([{ appVersion: "0.5.0" }]);
  });
});

describe("PackageInstaller · atomicidad (SPEC §7.1, paso 8)", () => {
  it("si el almacén falla al escribir, no queda nada", async () => {
    const storage = new FailingStorage();
    const { installer, request } = makeInstaller({ storage });

    await expect(installer.install(request)).rejects.toThrow("disco lleno");

    expect(await storage.keys()).toEqual([]);
  });

  it("una instalación fallida no toca una instalación previa", async () => {
    const storage = new MemoryStorage();
    const ok = makeInstaller({ storage });
    await ok.installer.install(ok.request);
    const before = await storage.keys();
    expect(before).toHaveLength(1);

    const bad = makeInstaller({ storage, sha256: "1".repeat(64) });
    await expect(bad.installer.install(bad.request)).rejects.toThrow();

    expect(await storage.keys()).toEqual(before);
  });
});

describe("PackageInstaller · prepare (F16, RF-6: verificar sin guardar)", () => {
  it("descarga y verifica el paquete y devuelve el resultado sin escribir nada", async () => {
    const { installer, storage, http, request } = makeInstaller();

    const prepared = await installer.prepare(request);

    expect(http.requests.map((entry) => entry.url)).toEqual([PACKAGE_URL]);
    expect(prepared).toMatchObject({ id: "ejemplo", version: "1.0.0", enabled: true });
    expect(await storage.keys()).toEqual([]);
  });

  it("aplica las mismas verificaciones: un hash incorrecto falla igual", async () => {
    const { installer, storage, request } = makeInstaller({ sha256: "0".repeat(64) });

    await captureError(installer.prepare(request), "PARSE");

    expect(await storage.keys()).toEqual([]);
  });

  it("install() guarda exactamente lo que prepare() devolvió", async () => {
    const { installer, storage, request } = makeInstaller();

    const prepared = await installer.prepare(request);
    const installed = await installer.install(request);

    expect(installed).toEqual(prepared);
    expect(JSON.parse((await storage.get(moduleKey("ejemplo"))) ?? "null")).toEqual(prepared);
  });
});
