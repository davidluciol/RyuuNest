import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  describePlatformIssue,
  findPlatformImportIssues,
  type SourceTree,
} from "./platformImports";

/**
 * F34.1 — guarda de `apps/mobile/src` en cada plataforma. Un `x.native.ts` no
 * puede importar `./x` (en Android e iOS Metro lo resuelve a sí mismo) y nadie
 * puede pedir a un módulo con variantes un nombre que la variante de su
 * plataforma no exporte. Lo compartido vive en un módulo sin hermano de
 * plataforma (`diagnosticsReport.ts`, `backupFilesPort.ts`).
 *
 * Cómo se comprobó el defecto de F21: el bundle de Android no contenía
 * `backupFiles.ts`; `isNativePlatform` y `createWebBackupFiles` se llamaban en dos
 * sitios y no se definían en ninguno. `tsc` y Vitest no lo ven.
 */

/** Fuentes que empaqueta Metro: todo `.ts`/`.tsx` bajo `apps/mobile/src`. */
function readSourceTree(): SourceTree {
  const root = fileURLToPath(new URL("../src", import.meta.url));
  const tree: Record<string, string> = {};
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
        tree[path.relative(root, full).split(path.sep).join("/")] = readFileSync(full, "utf8");
      }
    }
  };
  walk(root);
  return tree;
}

describe("apps/mobile/src en cada plataforma (F34.1)", () => {
  const tree = readSourceTree();

  it("hay variantes de plataforma que comprobar (la guarda no es vacua)", () => {
    const variants = Object.keys(tree).filter((file) =>
      /\.(native|ios|android|web)\.tsx?$/.test(file),
    );
    expect(variants.length).toBeGreaterThan(0);
  });

  it("ningún archivo se importa a sí mismo ni pide un nombre que su plataforma no exporta", () => {
    expect(findPlatformImportIssues(tree).map(describePlatformIssue)).toEqual([]);
  });
});
