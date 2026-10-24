import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { validateManifest } from "../src/index";

const MANIFEST = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../modules/tmo/manifest.json",
);

describe("modules/tmo · manifest (T31)", () => {
  it("pasa el validador del SDK", () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as unknown;

    const result = validateManifest(manifest);

    expect(result.ok ? [] : result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
