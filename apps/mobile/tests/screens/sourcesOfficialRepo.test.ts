import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StubHttp } from "@ryuunest/core";

import { openMigratedDriver } from "../../../../packages/core/tests/support/nodeSqliteDriver";
import { createFflateArchive } from "../../src/data/fflateArchive";
import { OFFICIAL_REPO_URL } from "../../src/data/officialRepo";
import {
  createSourcesService,
  loadSourcesWithOfficialRepo,
} from "../../src/screens/sources/sourcesData";

/**
 * P-131 — con el `index.json` real del repo oficial (copia guardada, nunca la
 * red), Fuentes debe listar sus tres módulos. Es la puerta de F32.
 */

const realIndex = readFileSync(join(__dirname, "../fixtures/officialRepoIndex.json"), "utf8");

let driver: Awaited<ReturnType<typeof openMigratedDriver>>;

beforeEach(async () => {
  driver = await openMigratedDriver();
});

afterEach(() => {
  driver.close();
});

function build(appVersion?: string) {
  return createSourcesService({
    driver,
    http: new StubHttp({ [OFFICIAL_REPO_URL]: { body: realIndex } }),
    archive: createFflateArchive(),
    secureLock: { isAvailable: async () => false, authenticate: async () => false },
    clock: { now: () => 5_000 },
    ...(appVersion === undefined ? {} : { appVersion }),
  });
}

describe("Fuentes con el índice real del repo oficial (P-131)", () => {
  it.each([undefined, "0.0.0", "1.0.0"])(
    "lista zonatmo, yupmanga y m440 (appVersion %s)",
    async (appVersion) => {
      const { data, officialRepoFailed } = await loadSourcesWithOfficialRepo(build(appVersion));

      expect(officialRepoFailed).toBe(false);
      expect(data.repos).toHaveLength(1);
      expect(data.modules.map((m) => m.id).sort()).toEqual(["m440", "yupmanga", "zonatmo"]);
    },
  );
});
