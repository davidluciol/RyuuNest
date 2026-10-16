import { describe, expect, it } from "vitest";

import { fontFiles, fontLicenses } from "../src/fonts";
import { fonts } from "../src/typography";

/**
 * F03 — manifiesto de las fuentes empaquetadas (P2-3): un archivo por peso,
 * sin pesos sintéticos, licencia OFL junto a cada familia. `ui-tokens` fija los
 * nombres; `apps/mobile` empaqueta los archivos y F05/F11 los cargan con
 * `expo-font`. Los nombres `postScriptName` son los que hay que usar como
 * `fontFamily` en React Native con archivos por peso.
 */
describe("manifiesto de fuentes (F03, P2-3)", () => {
  it("empaqueta exactamente los cinco archivos de pesos reales", () => {
    expect(fontFiles).toEqual([
      {
        family: "Manrope",
        weight: 600,
        file: "Manrope-SemiBold.ttf",
        postScriptName: "Manrope-SemiBold",
        license: "LICENSE-Manrope.txt",
      },
      {
        family: "Manrope",
        weight: 700,
        file: "Manrope-Bold.ttf",
        postScriptName: "Manrope-Bold",
        license: "LICENSE-Manrope.txt",
      },
      {
        family: "Inter",
        weight: 400,
        file: "Inter-Regular.ttf",
        postScriptName: "Inter-Regular",
        license: "LICENSE-Inter.txt",
      },
      {
        family: "Inter",
        weight: 500,
        file: "Inter-Medium.ttf",
        postScriptName: "Inter-Medium",
        license: "LICENSE-Inter.txt",
      },
      {
        family: "Inter",
        weight: 600,
        file: "Inter-SemiBold.ttf",
        postScriptName: "Inter-SemiBold",
        license: "LICENSE-Inter.txt",
      },
    ]);
  });

  it("cubre justo los pesos declarados en la tipografia (P2-3, sin sinteticos)", () => {
    const weightsByFamily = new Map<string, number[]>();
    for (const f of fontFiles) {
      const list = weightsByFamily.get(f.family) ?? [];
      list.push(f.weight);
      weightsByFamily.set(f.family, list);
    }
    expect(weightsByFamily.get("Manrope")?.sort()).toEqual([...fonts.headingWeights].sort());
    expect(weightsByFamily.get("Inter")?.sort()).toEqual([...fonts.bodyWeights].sort());
  });

  it("no repite archivos ni nombres PostScript", () => {
    const files = fontFiles.map((f) => f.file);
    const ps = fontFiles.map((f) => f.postScriptName);
    expect(new Set(files).size).toBe(files.length);
    expect(new Set(ps).size).toBe(ps.length);
  });

  it("cada familia lleva su licencia OFL registrada", () => {
    expect(fontLicenses).toEqual({
      Manrope: { file: "LICENSE-Manrope.txt", spdx: "OFL-1.1" },
      Inter: { file: "LICENSE-Inter.txt", spdx: "OFL-1.1" },
    });
  });
});
