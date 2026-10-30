import { importBackup, StubHttp } from "@ryuunest/core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { backupFileName } from "../../src/data/backupFilesPort";
import type { BackupFiles } from "../../src/data/backupFilesPort";
import {
  createBackupService,
  summarizeImport,
  type BackupService,
} from "../../src/screens/settings/backup/backupData";

/**
 * F21a/F21c — capa de datos del respaldo sobre el núcleo real (SQLite): la
 * exportación vuelca el estado local como texto SPEC §8.3, la importación la
 * aplica con `importBackup` y las sugerencias descartan los repos ya
 * registrados sin instalar nada (AC-8).
 */

interface FakeFiles extends BackupFiles {
  shared: string[];
  picked: { text: string; name: string } | null;
  downloads: string[];
}

function fakeFiles(): FakeFiles {
  const files: FakeFiles = {
    shared: [],
    picked: null,
    downloads: [],
    async shareBackup(text) {
      files.shared.push(text);
      return "shared";
    },
    async pickBackup() {
      return files.picked;
    },
    downloadBackup(text) {
      files.downloads.push(text);
    },
  };
  return files;
}

let driver: Awaited<ReturnType<typeof openMigratedDriver>>;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

function build(files: BackupFiles = fakeFiles()): BackupService {
  return createBackupService({
    driver,
    http: new StubHttp(),
    clock: { now: () => 1_000 },
    files,
  });
}

async function seedState(): Promise<void> {
  await driver.run(
    "INSERT INTO folder (id, name, sort, updated_at) VALUES (1, 'Favoritos épicos', 0, 100)",
  );
  await driver.run(
    `INSERT INTO series (module_id, series_id, title, title_norm, cover_url, kind, nsfw, status, updated_at)
     VALUES ('m-ejemplo', 's-1', 'El dragón de ceniza', 'el dragon de ceniza', NULL, 'manhwa', 0, 'ongoing', 200)`,
  );
  await driver.run(
    "INSERT INTO favorite (module_id, series_id, folder_id, added_at, updated_at) VALUES ('m-ejemplo', 's-1', 1, 150, 200)",
  );
  await driver.run(
    `INSERT INTO progress (module_id, series_id, chapter_id, release_id, chapter_title, page_index, page_total, updated_at)
     VALUES ('m-ejemplo', 's-1', 'ch-3', 'r-oficial', 'Capítulo 3', 2, 4, 300)`,
  );
  await driver.run(
    "INSERT INTO chapter_read (module_id, series_id, chapter_id, read_at) VALUES ('m-ejemplo', 's-1', 'ch-2', 250)",
  );
  await driver.run(
    "INSERT INTO series_pref (module_id, series_id, reader_mode, preferred_group, updated_at) VALUES ('m-ejemplo', 's-1', 'vertical', 'r-oficial', 200)",
  );
  await driver.run("INSERT INTO setting (key, value) VALUES ('settings.nsfwVisible', 'true')");
}

describe("exportText (RF-37, F21a)", () => {
  it("vuelca el estado local como texto SPEC §8.3, sin secretos", async () => {
    await seedState();
    const service = build();

    const text = await service.exportText();
    const backup = JSON.parse(text) as {
      format: string;
      version: number;
      folders: Array<{ name: string }>;
      series: Array<{ title: string }>;
      favorites: unknown[];
      progress: Array<{ pageIndex: number; pageTotal: number }>;
      read: unknown[];
      prefs: unknown[];
      settings: Record<string, string>;
    };

    expect(backup.format).toBe("ryuunest-backup");
    expect(backup.version).toBe(1);
    expect(backup.folders).toEqual([{ name: "Favoritos épicos", id: 1, sort: 0, updatedAt: 100 }]);
    expect(backup.series[0]?.title).toBe("El dragón de ceniza");
    expect(backup.favorites).toHaveLength(1);
    expect(backup.progress[0]).toMatchObject({ pageIndex: 2, pageTotal: 4 });
    expect(backup.read).toHaveLength(1);
    expect(backup.prefs).toHaveLength(1);
    expect(backup.settings).toEqual({ "settings.nsfwVisible": "true" });
  });

  it("el texto exportado pasa la validación del núcleo al reimportarlo", async () => {
    await seedState();
    const service = build();

    const text = await service.exportText();
    const result = await importBackup({ driver, mode: "merge" }, text);

    expect(result.ok).toBe(true);
  });

  it("shareText entrega el texto al puerto de archivos (hoja del sistema nativo)", async () => {
    const files = fakeFiles();
    const service = build(files);

    await service.shareText("{}");

    expect(files.shared).toEqual(["{}"]);
    expect(files.downloads).toEqual([]);
  });

  it("pickText devuelve lo que eligió el usuario, o null si canceló", async () => {
    const files = fakeFiles();
    files.picked = { text: "{ \"format\": \"ryuunest-backup\" }", name: "respaldo.json" };
    const service = build(files);

    expect(await service.pickText()).toEqual({
      text: '{ "format": "ryuunest-backup" }',
      name: "respaldo.json",
    });

    files.picked = null;
    expect(await service.pickText()).toBeNull();
  });
});

describe("applyText (RF-38, F21b)", () => {
  it("aplica merge y replace con el núcleo; un rechazo no toca los datos", async () => {
    await seedState();
    const service = build();
    const text = await service.exportText();

    const merged = await service.applyText(text, "merge");
    expect(merged.ok).toBe(true);
    if (merged.ok) expect(summarizeImport(merged)).toMatchObject({ mode: "merge", added: 0 });

    const replaced = await service.applyText(text, "replace");
    expect(replaced.ok).toBe(true);
    if (replaced.ok) {
      // 7 filas: folder + series + favorito + progreso + leído + preferencia + ajuste.
      expect(summarizeImport(replaced)).toMatchObject({ mode: "replace", added: 7 });
    }

    const rechazado = await service.applyText("no es json", "merge");
    expect(rechazado.ok).toBe(false);
    if (!rechazado.ok) expect(rechazado.reason).toBe("NOT_JSON");

    // El rechazo no tocó nada: la serie sigue ahí.
    const series = await driver.all("SELECT title FROM series");
    expect(series).toHaveLength(1);
  });
});

describe("sugerencias (F21c)", () => {
  const REPO_URL = "https://repo-ejemplo.test/index.json";
  const INDEX_BODY = JSON.stringify({
    format: "ryuunest-repo",
    version: 1,
    name: "Repo de ejemplo",
    updatedAt: "2026-10-05T00:00:00Z",
    modules: [],
  });

  it("descarta los repos ya registrados y los repetidos del respaldo", async () => {
    const service = createBackupService({
      driver,
      http: new StubHttp({ [REPO_URL]: { body: INDEX_BODY } }),
      clock: { now: () => 5_000 },
      files: fakeFiles(),
    });

    // Sin repos registrados: las dos sugerencias (una repetida) llegan filtradas.
    const pendientes = await service.pendingRepos([
      { url: REPO_URL, name: "Repo de ejemplo", addedAt: 0, updatedAt: 0 },
      { url: REPO_URL, name: "Repo de ejemplo (otra vez)", addedAt: 0, updatedAt: 0 },
      { url: "https://otro.test/index.json", name: "Otro repo", addedAt: 0, updatedAt: 0 },
    ]);
    expect(pendientes).toEqual([
      { url: REPO_URL, name: "Repo de ejemplo" },
      { url: "https://otro.test/index.json", name: "Otro repo" },
    ]);

    // Tras confirmar uno, solo queda el otro pendiente.
    await service.confirmRepo(REPO_URL);
    const trasConfirmar = await service.pendingRepos([
      { url: REPO_URL, name: "Repo de ejemplo", addedAt: 0, updatedAt: 0 },
      { url: "https://otro.test/index.json", name: "Otro repo", addedAt: 0, updatedAt: 0 },
    ]);
    expect(trasConfirmar).toEqual([{ url: "https://otro.test/index.json", name: "Otro repo" }]);

    // El repo confirmado quedó registrado (RF-2: descargó su índice).
    const repos = await driver.all("SELECT key FROM kv WHERE key LIKE 'repo:%'");
    expect(repos).toHaveLength(1);
  });

  it("confirmRepo registra el repo con su índice (nada se instala solo)", async () => {
    const service = createBackupService({
      driver,
      http: new StubHttp({ [REPO_URL]: { body: INDEX_BODY } }),
      clock: { now: () => 5_000 },
      files: fakeFiles(),
    });

    await service.confirmRepo(REPO_URL);

    const registro = await driver.get<{ value: string }>("SELECT value FROM kv WHERE key = ?", [
      `repo:${REPO_URL}`,
    ]);
    expect(registro?.value).toBeDefined();
    const indice = await driver.get<{ value: string }>("SELECT value FROM kv WHERE key = ?", [
      `repoIndex:${REPO_URL}`,
    ]);
    expect(indice?.value).toContain("Repo de ejemplo");
    // Sin módulos: nada instalado.
    const modules = await driver.all("SELECT key FROM kv WHERE key LIKE 'module:%'");
    expect(modules).toEqual([]);
  });

  it("descarta los módulos ya instalados y los repetidos", async () => {
    const service = build();

    const pendientes = await service.pendingModules([
      {
        id: "m-ejemplo",
        version: "1.0.0",
        repoUrl: REPO_URL,
        runtime: "declarative",
        kinds: ["manga"],
        lang: "es",
        nsfw: false,
      },
      {
        id: "m-ejemplo",
        version: "1.0.0",
        repoUrl: REPO_URL,
        runtime: "declarative",
        kinds: ["manga"],
        lang: "es",
        nsfw: false,
      },
      {
        id: "m-otro",
        version: "2.0.0",
        repoUrl: REPO_URL,
        runtime: "script",
        kinds: ["manhwa"],
        lang: "es",
        nsfw: true,
      },
    ]);

    expect(pendientes.map((module) => module.id)).toEqual(["m-ejemplo", "m-otro"]);
    expect(pendientes[1]).toMatchObject({ runtime: "script", nsfw: true });
  });
});

describe("backupFileName", () => {
  it("usa la fecha ISO: ryuunest-respaldo-2026-10-28.json", () => {
    expect(backupFileName(new Date("2026-10-28T15:04:05Z"))).toBe("ryuunest-respaldo-2026-10-28.json");
  });
});
