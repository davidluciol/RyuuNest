import { describe, expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";

import { createFflateArchive } from "../../src/ports/fflateArchive";

/**
 * F16/F24 — adaptador del puerto `Archive` sobre `fflate` (compartido por móvil
 * y web). Solo descomprime; rutas y topes los comprueba `PackageInstaller` (T13).
 */
describe("createFflateArchive (puerto Archive sobre fflate)", () => {
  it("descomprime un .zip a entradas con ruta y bytes", async () => {
    const zip = zipSync({
      "manifest.json": strToU8("{}"),
      "bin/util.js": strToU8("export {};"),
    });
    const entries = await createFflateArchive().unzip(new Uint8Array(zip));

    expect(entries.map((e) => e.path).sort()).toEqual(["bin/util.js", "manifest.json"]);
    const manifest = entries.find((e) => e.path === "manifest.json");
    expect(manifest).toBeDefined();
    expect(new TextDecoder().decode(manifest?.data)).toBe("{}");
  });

  it("omite las entradas de directorio (rutas que terminan en /)", async () => {
    const zip = zipSync({ "bin/": new Uint8Array(0), "bin/a.js": strToU8("x") });
    const entries = await createFflateArchive().unzip(new Uint8Array(zip));
    expect(entries.map((e) => e.path)).toEqual(["bin/a.js"]);
  });
});
