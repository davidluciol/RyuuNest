import { beforeEach, describe, expect, it } from "vitest";

import { importBackup, type ImportResult } from "../../src/backup/import";
import { BACKUP_FORMAT, BACKUP_VERSION, MAX_BACKUP_BYTES } from "../../src/backup/schema";
import type { SqlDriver } from "../../src/storage/SqlDriver";
import { openMigratedDriver } from "../support/nodeSqliteDriver";

/**
 * T33 — respaldo JSON malicioso (SPEC §7.2): tope de tamaño, validación estricta del
 * esquema y ningún repo ni módulo instalado o registrado solo (RF-38, AC-8). Un rechazo
 * no toca ni una fila.
 */

const REPO_URL = "https://repo.example.com/index.json";

let driver: SqlDriver;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

function backupText(parts: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    createdAt: 1_000,
    repos: [],
    modules: [],
    folders: [],
    series: [],
    favorites: [],
    progress: [],
    read: [],
    prefs: [],
    settings: {},
    ...parts,
  });
}

/** Filas de todas las tablas que un respaldo podría tocar, para ver que nada cambia. */
async function snapshot(): Promise<Record<string, unknown[]>> {
  const tables = [
    "repo",
    "module",
    "kv",
    "series",
    "folder",
    "favorite",
    "progress",
    "chapter_read",
    "series_pref",
    "setting",
  ];
  const rows: Record<string, unknown[]> = {};
  for (const table of tables) {
    rows[table] = await driver.all(`SELECT * FROM ${table}`);
  }
  return rows;
}

async function rejected(text: string): Promise<Extract<ImportResult, { ok: false }>> {
  const before = await snapshot();
  const result = await importBackup({ driver, mode: "replace" }, text);
  if (result.ok) throw new Error("se esperaba un rechazo");
  expect(await snapshot()).toEqual(before);
  return result;
}

describe("seguridad · respaldo malicioso: tamaño (SPEC §7.2)", () => {
  it("un respaldo por encima del tope se rechaza antes de parsearlo", async () => {
    // Espacios: si el tope faltara, el parser lo vería y diría NOT_JSON.
    const result = await rejected(" ".repeat(MAX_BACKUP_BYTES + 1));

    expect(result.reason).toBe("TOO_LARGE");
  });
});

describe("seguridad · respaldo malicioso: esquema estricto (SPEC §7.2)", () => {
  it.each([
    ["javascript:", "javascript:alert(1)"],
    ["file:", "file:///etc/passwd"],
    ["http plano", "http://repo.example.com/index.json"],
  ])("un repo con URL %s se rechaza entero", async (_caso, url) => {
    const result = await rejected(
      backupText({ repos: [{ url, name: "Repo", addedAt: 1, updatedAt: 1 }] }),
    );

    expect(result.reason).toBe("INVALID");
    expect(result.issues.map((issue) => issue.path)).toContain("repos[0].url");
  });

  it("un módulo cuyo repo no es HTTPS se rechaza entero", async () => {
    const module = {
      id: "m",
      version: "1.0.0",
      repoUrl: "http://repo.example.com/index.json",
      runtime: "script",
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
    };

    const result = await rejected(backupText({ modules: [module] }));

    expect(result.issues.map((issue) => issue.path)).toContain("modules[0].repoUrl");
  });

  it("tipos cambiados o un formato ajeno se rechazan sin escribir nada", async () => {
    expect((await rejected(backupText({ format: "otro" }))).reason).toBe("INVALID");
    expect((await rejected(backupText({ series: "no es una lista" }))).reason).toBe("INVALID");
    expect((await rejected(backupText({ settings: { clave: 1 } }))).reason).toBe("INVALID");
  });
});

describe("seguridad · respaldo malicioso: nada se instala solo (RF-38, AC-8)", () => {
  it("los repos y módulos del respaldo vuelven como sugerencias, sin registrarse", async () => {
    const repo = { url: REPO_URL, name: "Repo", addedAt: 1, updatedAt: 1 };
    const module = {
      id: "m",
      version: "1.0.0",
      repoUrl: REPO_URL,
      runtime: "script",
      kinds: ["manga"],
      lang: "es",
      nsfw: false,
    };

    const result = await importBackup(
      { driver, mode: "replace" },
      backupText({ repos: [repo], modules: [module] }),
    );

    expect(result.ok && result.suggestions).toEqual({ repos: [repo], modules: [module] });
    const rows = await snapshot();
    expect(rows["repo"]).toEqual([]);
    expect(rows["module"]).toEqual([]);
    expect(rows["kv"]).toEqual([]);
  });
});
