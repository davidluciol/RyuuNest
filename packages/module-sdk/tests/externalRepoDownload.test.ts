import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import {
  FixedClock,
  InstallFlow,
  MemoryStorage,
  ModuleError,
  ModuleRegistry,
  PackageInstaller,
  RepoRegistry,
  StubHttp,
  utf8Encode,
  type Archive,
  type ArchiveEntry,
  type Http,
  type HttpResponse,
  type RepoIndex,
} from "@ryuunest/core";

import { validateManifest, validateRepoIndex } from "../src/index";

/**
 * Verificación de la descarga desde el repositorio externo de módulos
 * (`davidluciol/RyuuNest-Models`, P-78): repo → previsualizar → confirmar → descargar el
 * `.zip` → hash → módulo activo, con los validadores reales del SDK y un `.zip` real.
 *
 * - Siempre: el mismo flujo contra un repo simulado con la forma de URL del real
 *   (`raw.githubusercontent.com/.../main/index.json`, paquete relativo `packages/...`).
 * - Opcional (`RYUUNEST_LIVE=1`): contra el repositorio real por red, solo la descarga
 *   (índice válido; cada `.zip` con el tamaño y el SHA-256 del índice). No corre en CI.
 */

const REAL_REPO_URL =
  "https://raw.githubusercontent.com/davidluciol/RyuuNest-Models/main/index.json";
const SIMULATED_PACKAGE_URL =
  "https://raw.githubusercontent.com/davidluciol/RyuuNest-Models/main/packages/ejemplo-1.0.0.zip";

const unzipArchive: Archive = {
  async unzip(data: Uint8Array): Promise<ArchiveEntry[]> {
    return Object.entries(unzipSync(data)).map(([path, bytes]) => ({ path, data: bytes }));
  },
};

function fetchHttp(): Http {
  return {
    async request(url, init) {
      const response = await fetch(url, init as RequestInit | undefined);
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      return {
        status: response.status,
        headers,
        url: response.url,
        text: () => response.text(),
        bytes: async () => new Uint8Array(await response.arrayBuffer()),
      } satisfies HttpResponse;
    },
  };
}

function makeApp(http: Http): { repos: RepoRegistry; modules: ModuleRegistry; flow: InstallFlow } {
  const storage = new MemoryStorage();
  const clock = new FixedClock(1_000);
  const repos = new RepoRegistry({ storage, http, clock, validateIndex: validateRepoIndex });
  const installer = new PackageInstaller({
    http,
    storage,
    clock,
    archive: unzipArchive,
    validateManifest,
  });
  const modules = new ModuleRegistry({ storage });
  return { repos, modules, flow: new InstallFlow({ repos, installer, modules }) };
}

const MANIFEST = {
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
  entry: "module.js",
};

/** La forma del `zonatmo` real (P-80): declara también `details` y `pages`. */
const ZONATMO_STYLE_MANIFEST = {
  ...MANIFEST,
  capabilities: ["popular", "latest", "search", "details", "pages"],
};

function simulatedRepo(options: { sha256?: string; manifest?: typeof MANIFEST } = {}): {
  http: StubHttp;
  index: RepoIndex;
} {
  const manifest = options.manifest ?? MANIFEST;
  const zip = zipSync({
    "manifest.json": utf8Encode(JSON.stringify(manifest)),
    "module.js": utf8Encode("export default {};"),
  });
  const index: RepoIndex = {
    format: "ryuunest-repo",
    version: 1,
    name: "RyuuNest-Models (simulado)",
    updatedAt: "2026-10-26T00:00:00Z",
    modules: [
      {
        id: "ejemplo",
        name: "Ejemplo",
        version: "1.0.0",
        apiVersion: 1,
        runtime: "script",
        kinds: ["manga"],
        lang: "es",
        nsfw: false,
        permissions: { domains: ["ejemplo.com"] },
        package: "packages/ejemplo-1.0.0.zip",
        sha256: options.sha256 ?? bytesToHex(sha256(zip)),
        size: zip.length,
      },
    ],
  };
  const http = new StubHttp({
    [REAL_REPO_URL]: { body: JSON.stringify(index) },
    [SIMULATED_PACKAGE_URL]: { bodyBytes: zip },
  });
  return { http, index };
}

describe("descarga desde el repo externo (simulado, con la URL del real)", () => {
  it("descarga el .zip relativo al index.json, verifica el hash y deja el módulo activo", async () => {
    const { http } = simulatedRepo();
    const app = makeApp(http);

    const repo = await app.repos.addRepo(REAL_REPO_URL);
    const installed = await app.flow.install(repo.id, "ejemplo", {
      confirmed: true,
      reinforced: true,
    });

    expect(http.requests.map((request) => request.url)).toEqual([
      REAL_REPO_URL,
      SIMULATED_PACKAGE_URL,
    ]);
    expect(installed.files.map((file) => file.path)).toEqual(["manifest.json", "module.js"]);
    expect((await app.modules.get("ejemplo"))?.enabled).toBe(true);
  });

  it("un hash que no coincide con el índice aborta la descarga sin instalar nada", async () => {
    const { http } = simulatedRepo({ sha256: "0".repeat(64) });
    const app = makeApp(http);
    const repo = await app.repos.addRepo(REAL_REPO_URL);

    const error = await app.flow
      .install(repo.id, "ejemplo", { confirmed: true, reinforced: true })
      .catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(ModuleError);
    expect((error as ModuleError).message).toContain("hash");
    expect(await app.modules.list()).toEqual([]);
  });

  it("instala un módulo cuyo manifest declara `details` y `pages` (P-80 → P-82)", async () => {
    const { http } = simulatedRepo({ manifest: ZONATMO_STYLE_MANIFEST });
    const app = makeApp(http);

    const repo = await app.repos.addRepo(REAL_REPO_URL);
    await app.flow.install(repo.id, "ejemplo", { confirmed: true, reinforced: true });

    expect((await app.modules.get("ejemplo"))?.enabled).toBe(true);
  });
});

describe.skipIf(process.env.RYUUNEST_LIVE !== "1")(
  "descarga desde el repo externo REAL (RYUUNEST_LIVE=1)",
  () => {
    it("el índice del repo real se valida y cada paquete se descarga con su hash y tamaño", async () => {
      const http = fetchHttp();
      const app = makeApp(http);

      const repo = await app.repos.addRepo(REAL_REPO_URL);
      const entries = await app.repos.listModules(repo.id);
      expect(entries.length).toBeGreaterThan(0);

      for (const entry of entries) {
        const response = await http.request(new URL(entry.package, REAL_REPO_URL).href);
        const bytes = await response.bytes();

        expect(response.status, `${entry.id}: HTTP`).toBe(200);
        expect(bytes.length, `${entry.id}: tamaño`).toBe(entry.size);
        expect(bytesToHex(sha256(bytes)), `${entry.id}: sha256`).toBe(entry.sha256);

        // El hallazgo de P-80: instalar el módulo real fallaba porque su manifest
        // declara `details` y `pages`. Con el validador relajado (P-82) debe pasar.
        const files = unzipSync(bytes);
        const manifestBytes = files["manifest.json"];
        expect(manifestBytes, `${entry.id}: contenido`).toBeDefined();
        const manifest = JSON.parse(new TextDecoder().decode(manifestBytes)) as unknown;
        const result = validateManifest(manifest);
        expect(result.ok, `${entry.id}: manifest (${result.ok ? "" : JSON.stringify(result.issues)})`).toBe(
          true,
        );
      }
    }, 60_000);
  },
);
