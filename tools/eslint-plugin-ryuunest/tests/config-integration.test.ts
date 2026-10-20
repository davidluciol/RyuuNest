import path from "node:path";

import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

/**
 * F09 — integración de la regla con la configuración real del repo (AC-13):
 * el lint falla ante un literal en el código de la interfaz, y **no** marca los
 * tests ni los paquetes de tokens, donde los valores literales son la fuente de
 * verdad que afirma el resultado.
 */

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const RULE = "ryuunest/no-design-literals";

/** Una sola instancia de ESLint (levantarla es costoso) para todos los casos. */
const eslint = new ESLint({ cwd: REPO_ROOT });

async function lintAt(relativePath: string, code: string) {
  const results = await eslint.lintText(code, {
    filePath: path.join(REPO_ROOT, relativePath),
  });
  return results[0].messages;
}

describe("lint de diseño en la interfaz (F09, AC-13)", () => {
  it("un color y una medida literales en apps/*/src fallan", async () => {
    const messages = await lintAt(
      "apps/mobile/src/components/__lint_probe__.ts",
      `export const s = { padding: 13, backgroundColor: "#123456" };`,
    );
    const ours = messages.filter((message) => message.ruleId === RULE);
    expect(ours).toHaveLength(2);
    expect(ours.map((message) => message.message)).toEqual([
      expect.stringContaining("padding: 13"),
      expect.stringContaining("#123456"),
    ]);
  });

  it("los tests de la app no se marcan (afirman valores de token)", async () => {
    const messages = await lintAt(
      "apps/mobile/tests/__lint_probe__.test.ts",
      `export const s = { padding: 13, backgroundColor: "#123456" };`,
    );
    expect(messages.filter((message) => message.ruleId === RULE)).toHaveLength(0);
  });

  it("los paquetes de tokens no se marcan (definen los valores)", async () => {
    const messages = await lintAt(
      "packages/ui-tokens/src/__lint_probe__.ts",
      `export const s = { padding: 13, backgroundColor: "#123456" };`,
    );
    expect(messages.filter((message) => message.ruleId === RULE)).toHaveLength(0);
  });
});
