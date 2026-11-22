import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { ModuleError, type ModuleErrorCode } from "../../src/contract/errors";
import type { ModuleManifest } from "../../src/contract/types";
import {
  INSTALL_LIMITS,
  PackageInstaller,
  type InstallLimits,
  type ManifestValidator,
} from "../../src/install/PackageInstaller";
import { sha256Hex } from "../../src/install/verify";
import type { Archive } from "../../src/ports/archive";
import { FixedClock, MemoryStorage, StubHttp } from "../../src/ports/fakes";
import { createFflateArchive } from "../../src/ports/fflateArchive";

/**
 * T33 — amenazas del instalador (SPEC §7.2) con **paquetes `.zip` reales**: se comprimen
 * con `fflate`, se descomprimen con el adaptador de la app y el hash es el de los bytes.
 * Cada caso comprueba además que el almacén queda vacío (la instalación es atómica).
 *
 * Las mitigaciones por capas (topes antes de descomprimir en el adaptador y después en el
 * instalador) se prueban por separado: `withoutAdapterLimits` quita la primera capa para
 * que la prueba falle si alguien quita la segunda.
 */

const REPO_URL = "https://repo.example.com/index.json";
const PACKAGE_PATH = "packages/ejemplo-1.0.0.zip";
const PACKAGE_URL = "https://repo.example.com/packages/ejemplo-1.0.0.zip";

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
  capabilities: ["popular"],
  permissions: { domains: ["ejemplo.com"] },
  entry: "index.js",
};

const acceptAll: ManifestValidator = (value) => ({ ok: true, value: value as ModuleManifest });

/** Un `.zip` real con el manifest, el archivo de entrada y lo que se añada. */
function packageZip(extra: Record<string, Uint8Array> = {}): Uint8Array {
  return zipSync({
    "manifest.json": strToU8(JSON.stringify(MANIFEST)),
    "index.js": strToU8("export {};"),
    ...extra,
  });
}

/** El adaptador real, pero sin los topes previos a descomprimir (aísla al instalador). */
function withoutAdapterLimits(): Archive {
  const archive = createFflateArchive();
  return { unzip: (data) => archive.unzip(data) };
}

function setup(
  zip: Uint8Array,
  options: {
    sha256?: string;
    size?: number;
    packageUrl?: string;
    archive?: Archive;
    limits?: Partial<InstallLimits>;
    validateManifest?: ManifestValidator;
  } = {},
) {
  const http = new StubHttp({ [PACKAGE_URL]: { bodyBytes: zip } });
  const storage = new MemoryStorage();
  const installer = new PackageInstaller({
    http,
    archive: options.archive ?? createFflateArchive(),
    storage,
    clock: new FixedClock(1_000),
    validateManifest: options.validateManifest ?? acceptAll,
    ...(options.limits === undefined ? {} : { limits: options.limits }),
  });
  const request = {
    repoUrl: REPO_URL,
    package: options.packageUrl ?? PACKAGE_PATH,
    sha256: options.sha256 ?? sha256Hex(zip),
    size: options.size ?? zip.length,
  };
  return { installer, storage, http, request };
}

async function rejects(promise: Promise<unknown>, code: ModuleErrorCode): Promise<ModuleError> {
  const error = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(ModuleError);
  expect((error as ModuleError).code).toBe(code);
  return error as ModuleError;
}

describe("seguridad · control: un paquete sano se instala", () => {
  it("el mismo arnés instala un .zip real válido (las pruebas de rechazo no son vacías)", async () => {
    const { installer, storage, request } = setup(packageZip());

    const installed = await installer.install(request);

    expect(installed.files.map((file) => file.path)).toEqual(["index.js", "manifest.json"]);
    expect(await storage.keys("module:")).toEqual(["module:ejemplo"]);
  });
});

describe("seguridad · zip-slip (SPEC §7.2)", () => {
  it.each([
    ["«..» relativo", "../evil.js"],
    ["«..» en medio", "lib/../../evil.js"],
    ["«..» con barras invertidas", "..\\evil.js"],
    ["ruta absoluta", "/etc/passwd"],
    ["ruta UNC", "\\\\servidor\\recurso\\evil.js"],
    ["letra de unidad", "C:/Windows/evil.js"],
    ["byte nulo", "index.js\0.png"],
  ])("rechaza una entrada con %s sin guardar nada", async (_caso, path) => {
    const { installer, storage, request } = setup(packageZip({ [path]: strToU8("x") }));

    await rejects(installer.install(request), "UNSUPPORTED");

    expect(await storage.keys()).toEqual([]);
  });
});

describe("seguridad · bomba de descompresión (SPEC §7.1 y §7.2)", () => {
  const bomb = (): Uint8Array =>
    packageZip({ "bomba.bin": new Uint8Array(INSTALL_LIMITS.unpackedBytes + 1) });

  it("un .zip diminuto que se infla por encima del tope no se instala", async () => {
    const zip = bomb();
    expect(zip.length).toBeLessThan(64 * 1024);
    const { installer, storage, request } = setup(zip);

    await rejects(installer.install(request), "UNSUPPORTED");

    expect(await storage.keys()).toEqual([]);
  });

  it("el instalador mide lo descomprimido aunque el adaptador no aplique topes", async () => {
    const { installer, storage, request } = setup(bomb(), { archive: withoutAdapterLimits() });

    const error = await rejects(installer.install(request), "UNSUPPORTED");

    expect(error.message).toContain("bomba");
    expect(await storage.keys()).toEqual([]);
  });

});

describe("seguridad · número de archivos (SPEC §7.1)", () => {
  /** `count` archivos en total, contando manifest e `index.js`. */
  const zipWithFiles = (count: number): Uint8Array =>
    packageZip(
      Object.fromEntries(
        Array.from({ length: count - 2 }, (_value, index) => [`f${index}.js`, strToU8("x")]),
      ),
    );

  it("justo en el tope se instala", async () => {
    const { installer, request } = setup(zipWithFiles(INSTALL_LIMITS.files));

    await expect(installer.install(request)).resolves.toMatchObject({ id: "ejemplo" });
  });

  it("uno más que el tope no se instala", async () => {
    const { installer, storage, request } = setup(zipWithFiles(INSTALL_LIMITS.files + 1));

    await rejects(installer.install(request), "UNSUPPORTED");

    expect(await storage.keys()).toEqual([]);
  });

  it("el instalador cuenta los archivos aunque el adaptador no aplique topes", async () => {
    const { installer, request } = setup(zipWithFiles(INSTALL_LIMITS.files + 1), {
      archive: withoutAdapterLimits(),
    });

    const error = await rejects(installer.install(request), "UNSUPPORTED");

    expect(error.message).toContain("archivos");
  });
});

describe("seguridad · tamaño del paquete (SPEC §7.1)", () => {
  it("un paquete que declara más del tope no se descarga", async () => {
    const { installer, http, request } = setup(packageZip(), {
      size: INSTALL_LIMITS.packageBytes + 1,
    });

    await rejects(installer.install(request), "UNSUPPORTED");

    expect(http.requests).toEqual([]);
  });

  it("un paquete que miente sobre su tamaño se rechaza al medir lo descargado", async () => {
    const zip = packageZip();
    const { installer, storage, request } = setup(zip, {
      size: 1,
      limits: { packageBytes: zip.length - 1 },
    });

    await rejects(installer.install(request), "UNSUPPORTED");

    expect(await storage.keys()).toEqual([]);
  });
});

describe("seguridad · paquete alterado (SPEC §7.2: HTTPS y SHA-256)", () => {
  it("un byte cambiado en tránsito rompe el hash y no se instala", async () => {
    const original = packageZip();
    const tampered = original.slice();
    tampered[tampered.length - 30] = (tampered[tampered.length - 30] ?? 0) ^ 0xff;
    const { installer, storage, request } = setup(tampered, { sha256: sha256Hex(original) });

    const error = await rejects(installer.install(request), "PARSE");

    expect(error.message).toContain("hash");
    expect(await storage.keys()).toEqual([]);
  });

  it("el hash se compara sin distinguir mayúsculas (no es una puerta trasera)", async () => {
    const zip = packageZip();
    const { installer, request } = setup(zip, { sha256: sha256Hex(zip).toUpperCase() });

    await expect(installer.install(request)).resolves.toMatchObject({ id: "ejemplo" });
  });

  it.each([
    ["http plano", "http://repo.example.com/packages/ejemplo-1.0.0.zip"],
    ["file:", "file:///tmp/ejemplo.zip"],
  ])("un paquete servido por %s no se descarga", async (_caso, packageUrl) => {
    const { installer, http, request } = setup(packageZip(), { packageUrl });

    await rejects(installer.install(request), "UNSUPPORTED");

    expect(http.requests).toEqual([]);
  });
});

describe("seguridad · manifest (SPEC §7.1, paso 7)", () => {
  const rejectAll: ManifestValidator = () => ({
    ok: false,
    issues: [{ path: "permissions.domains", message: "Debe ser una lista con al menos un dominio" }],
  });

  it("un manifest que el validador rechaza no se instala y el motivo llega al usuario", async () => {
    const { installer, storage, request } = setup(packageZip(), { validateManifest: rejectAll });

    const error = await rejects(installer.install(request), "PARSE");

    expect(error.message).toContain("permissions.domains");
    expect(await storage.keys()).toEqual([]);
  });

  it("un paquete sin manifest.json no se instala", async () => {
    const zip = zipSync({ "index.js": strToU8("export {};") });
    const { installer, storage, request } = setup(zip);

    await rejects(installer.install(request), "PARSE");

    expect(await storage.keys()).toEqual([]);
  });

  it("un manifest cuya entrada no viene en el paquete no se instala", async () => {
    const zip = zipSync({ "manifest.json": strToU8(JSON.stringify(MANIFEST)) });
    const { installer, storage, request } = setup(zip);

    await rejects(installer.install(request), "PARSE");

    expect(await storage.keys()).toEqual([]);
  });
});
