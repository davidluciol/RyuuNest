import { describe, expect, it } from "vitest";

import type { RepoIndex } from "../../src/contract/repoIndex";
import type { InstalledPackage } from "../../src/install/PackageInstaller";
import { ModuleRegistry } from "../../src/modules/ModuleRegistry";
import { FixedClock, StubHttp } from "../../src/ports/fakes";
import { RepoRegistry, type RepoRecord } from "../../src/repo/RepoRegistry";
import { MIGRATIONS, migrate, SCHEMA_VERSION } from "../../src/storage/migrations";
import { SqliteStorage } from "../../src/storage/SqliteStorage";
import { NodeSqliteDriver } from "../support/nodeSqliteDriver";

/**
 * G2 — las filas JSON de repos y módulos salen de la tabla `kv` y pasan a `repo`/`module`
 * (SPEC §8.1). Una base que ya tenía filas `kv` (esquema 5) migra sin perder nada: los
 * registros devuelven exactamente lo mismo.
 */

const REPO_URL = "https://repo.example.com/index.json";
const SIN_MODULOS_URL = "https://vacio.example.com/index.json";

const INDEX: RepoIndex = {
  format: "ryuunest-repo",
  version: 1,
  name: "Mi repo",
  updatedAt: "2026-10-05T00:00:00Z",
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
      sha256: "a".repeat(64),
      size: 12345,
    },
  ],
};

const REPOS: RepoRecord[] = [
  { id: REPO_URL, url: REPO_URL, name: "Mi repo", addedAt: 100, updatedAt: 200 },
  { id: SIN_MODULOS_URL, url: SIN_MODULOS_URL, name: "Vacío", addedAt: 300, updatedAt: 300 },
];

function paquete(id: string, overrides: Partial<InstalledPackage> = {}): InstalledPackage {
  return {
    id,
    version: "1.2.0",
    repoUrl: REPO_URL,
    runtime: "declarative",
    kinds: ["manga", "manhwa"],
    lang: "es",
    nsfw: true,
    permissions: { domains: ["ejemplo.com"] },
    manifest: {
      id,
      name: id,
      version: "1.2.0",
      apiVersion: 1,
      runtime: "declarative",
      kinds: ["manga", "manhwa"],
      lang: "es",
      nsfw: true,
      baseUrl: "https://ejemplo.com",
      capabilities: ["popular"],
      permissions: { domains: ["ejemplo.com"] },
    },
    files: [{ path: "module.json", hex: "7b7d" }],
    installedAt: 1_000,
    enabled: false,
    lastError: "NETWORK — «sin red» 龍",
    ...overrides,
  } as InstalledPackage;
}

const MODULOS: InstalledPackage[] = [
  paquete("ejemplo"),
  // Su repo ya no está registrado (RF-8 no toca los módulos): la fila no puede perderse.
  paquete("huerfano", { repoUrl: "https://borrado.example.com/index.json", enabled: true }),
];

/** Base con el esquema 5 (aún con `kv`) y las filas que dejaban el instalador y los registros. */
async function baseConKv(): Promise<NodeSqliteDriver> {
  const driver = NodeSqliteDriver.openInMemory();
  for (const migracion of MIGRATIONS.filter((m) => m.version <= 5)) {
    for (const sentencia of migracion.statements) {
      await driver.exec(sentencia);
    }
  }
  await driver.exec("PRAGMA user_version = 5");

  const filas: [string, string][] = [
    ...REPOS.map((r): [string, string] => [`repo:${r.id}`, JSON.stringify(r)]),
    [`repoIndex:${REPO_URL}`, JSON.stringify(INDEX)],
    ...MODULOS.map((m): [string, string] => [`module:${m.id}`, JSON.stringify(m)]),
  ];
  for (const [key, value] of filas) {
    await driver.run("INSERT INTO kv (key, value) VALUES (?, ?)", [key, value]);
  }
  return driver;
}

function registros(driver: NodeSqliteDriver): { repos: RepoRegistry; modules: ModuleRegistry } {
  const storage = new SqliteStorage(driver);
  return {
    repos: new RepoRegistry({
      storage,
      http: new StubHttp({}),
      clock: new FixedClock(0),
      validateIndex: (value) => ({ ok: true, value: value as RepoIndex }),
    }),
    modules: new ModuleRegistry({ storage }),
  };
}

describe("migración 6 · kv → repo/module", () => {
  it("copia repos, índices y módulos: los registros devuelven lo mismo", async () => {
    const driver = await baseConKv();

    await migrate(driver);

    const { repos, modules } = registros(driver);
    expect(await repos.listRepos()).toEqual(REPOS);
    expect(await repos.listModules()).toEqual([{ repoId: REPO_URL, ...INDEX.modules[0] }]);
    expect(await repos.listModules(SIN_MODULOS_URL)).toEqual([]);
    expect(await modules.list()).toEqual(MODULOS);
    expect(await modules.get("huerfano")).toEqual(MODULOS[1]);
  });

  it("rellena las columnas del SPEC §8.1 y enlaza repo_id solo si el repo existe", async () => {
    const driver = await baseConKv();

    await migrate(driver);

    const filas = await driver.all(
      `SELECT id, version, repo_id, runtime, kinds, lang, nsfw, enabled, installed_at, last_error
       FROM module ORDER BY id`,
    );
    expect(filas).toEqual([
      {
        id: "ejemplo",
        version: "1.2.0",
        repo_id: REPO_URL,
        runtime: "declarative",
        kinds: '["manga","manhwa"]',
        lang: "es",
        nsfw: 1,
        enabled: 0,
        installed_at: 1_000,
        last_error: "NETWORK — «sin red» 龍",
      },
      expect.objectContaining({ id: "huerfano", repo_id: null, enabled: 1 }),
    ]);
    expect(await driver.all("SELECT id, url, name, added_at FROM repo ORDER BY added_at")).toEqual(
      REPOS.map((r) => ({ id: r.id, url: r.url, name: r.name, added_at: r.addedAt })),
    );
  });

  it("retira kv, deja la versión al día y volver a migrar no cambia nada", async () => {
    const driver = await baseConKv();

    await migrate(driver);
    await migrate(driver);

    const kv = await driver.get("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'kv'");
    expect(kv).toBeUndefined();
    const version = await driver.get<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(6);
    expect(await registros(driver).modules.list()).toEqual(MODULOS);
  });

  it("si una fila no se puede copiar, la migración entera se deshace y kv sigue intacta", async () => {
    const driver = await baseConKv();
    // Dos repos con la misma URL violan repo.url UNIQUE.
    await driver.run("INSERT INTO kv (key, value) VALUES (?, ?)", [
      "repo:otro-id",
      JSON.stringify({ ...REPOS[0], id: "otro-id" }),
    ]);

    await expect(migrate(driver)).rejects.toThrow();

    const version = await driver.get<{ user_version: number }>("PRAGMA user_version");
    expect(version?.user_version).toBe(5);
    expect((await driver.get<{ n: number }>("SELECT COUNT(*) AS n FROM kv"))?.n).toBe(6);
    expect((await driver.get<{ n: number }>("SELECT COUNT(*) AS n FROM module"))?.n).toBe(0);
  });
});

describe("SqliteStorage · claves sobre repo/module (G2)", () => {
  async function abrir(): Promise<{ driver: NodeSqliteDriver; storage: SqliteStorage }> {
    const driver = NodeSqliteDriver.openInMemory();
    await migrate(driver);
    return { driver, storage: new SqliteStorage(driver) };
  }

  it("rechaza lo que se perdería: clave desconocida, JSON inválido o índice sin repo", async () => {
    const { storage } = await abrir();

    await expect(storage.set("setting:x", "1")).rejects.toThrow("setting:x");
    await expect(storage.set("module:x", "no es json")).rejects.toThrow("module:x");
    await expect(storage.set(`repoIndex:${REPO_URL}`, "{}")).rejects.toThrow("repoIndex:");
    await expect(storage.get("setting:x")).resolves.toBeUndefined();
  });

  it("enlaza el módulo con su repo aunque el repo llegue después, y borrar el repo no borra el módulo", async () => {
    const { driver, storage } = await abrir();
    const repoDe = async (): Promise<unknown> =>
      (
        await driver.get<{ repo_id: string | null }>("SELECT repo_id FROM module WHERE id = ?", [
          "ejemplo",
        ])
      )?.repo_id;

    await storage.set("module:ejemplo", JSON.stringify(MODULOS[0]));
    expect(await repoDe()).toBeNull();

    await storage.set(`repo:${REPO_URL}`, JSON.stringify(REPOS[0]));
    expect(await repoDe()).toBe(REPO_URL);

    await storage.delete(`repo:${REPO_URL}`);
    expect(await repoDe()).toBeNull();
    expect(await storage.get("module:ejemplo")).toBe(JSON.stringify(MODULOS[0]));
    expect(await storage.keys()).toEqual(["module:ejemplo"]);
  });
});
