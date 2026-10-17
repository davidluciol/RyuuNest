import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F03 — puerta de iconos (P2-3, V4, RNF-5): un único conjunto SVG (Lucide), sin
 * emojis ni glifos de texto, y sin recursos remotos. `src/icons.ts` es el punto
 * de entrada único: las pantallas nunca importan `lucide-react-native` a mano.
 */

const SRC_DIR = path.resolve(process.cwd(), "src");

/** Emojis y glifos (pictográficos, dingbats, símbolos varios + variación U+FE0F). */
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

function sourceFiles(): string[] {
  return ["icons.ts", "ImageCapPanel.tsx", "calibrationPage.ts", "imageBudget.ts"]
    .map((f) => path.join(SRC_DIR, f))
    .filter((f) => existsSync(f));
}

describe("iconos: Lucide como fuente única (P2-3)", () => {
  it("apps/mobile depende de lucide-react-native (móvil/TV)", () => {
    const pkg = JSON.parse(readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.["lucide-react-native"], "falta la dependencia").toBeDefined();
  });

  it("src/icons.ts reexporta Lucide y es el único punto de entrada", () => {
    const abs = path.join(SRC_DIR, "icons.ts");
    expect(existsSync(abs), "falta src/icons.ts").toBe(true);
    const text = readFileSync(abs, "utf8");
    expect(text).toContain('from "lucide-react-native"');
    expect(text).not.toMatch(/https?:\/\//i);
  });

  it("ningún otro archivo de src importa lucide directamente (entrada única)", () => {
    for (const file of sourceFiles()) {
      if (path.basename(file) === "icons.ts") continue;
      expect(readFileSync(file, "utf8"), `${file} debe importar de ./icons`).not.toMatch(
        /lucide-react-native/,
      );
    }
  });
});

describe("V4: sin emojis ni glifos como iconos", () => {
  it.each(sourceFiles().map((f) => [path.basename(f)]))("%s no contiene emojis", (base) => {
    const file = path.join(SRC_DIR, base);
    expect(readFileSync(file, "utf8"), `${base} tiene un emoji o glifo`).not.toMatch(EMOJI);
  });
});
