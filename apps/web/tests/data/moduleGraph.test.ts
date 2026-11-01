import { describe, expect, it } from "vitest";

import {
  buildLoadOrder,
  packageImports,
  resolveImport,
  rewriteImports,
} from "../../src/data/moduleGraph";

/**
 * F25/F27 — grafo del paquete ES de un módulo `script` (D1-A): el cargador web
 * crea un blob URL por archivo (en orden de dependencias) reescribiendo los
 * `import` relativos a la URL del archivo destino.
 */
describe("resolveImport (rutas POSIX del paquete)", () => {
  it("resuelve relativos contra el directorio del archivo que importa", () => {
    expect(resolveImport("module.js", "./bin/util.js")).toBe("bin/util.js");
    expect(resolveImport("bin/a.js", "../module.js")).toBe("module.js");
    expect(resolveImport("bin/deep/b.js", "./c.js")).toBe("bin/deep/c.js");
    expect(resolveImport("module.js", "./bin/../lib/x.js")).toBe("lib/x.js");
  });
});

describe("packageImports", () => {
  it("encuentra import estático, export-from, import bare e import dinámico", () => {
    const code = [
      'import { a } from "./a.js";',
      'import "./side.js";',
      'export { b } from "../lib/b.js";',
      'const m = await import("./lazy.js");',
      'const texto = "from \\"no-es-import\\"";',
      'fetch("https://x.test/./no-import.js");',
    ].join("\n");
    expect(packageImports(code).sort()).toEqual(["../lib/b.js", "./a.js", "./lazy.js", "./side.js"]);
  });

  it("ignora los especificadores de paquete (no relativos)", () => {
    expect(packageImports('import { unzip } from "fflate";')).toEqual([]);
  });
});

describe("buildLoadOrder (topológico desde la entrada)", () => {
  const files = {
    "module.js": 'import { u } from "./bin/util.js"; export default u;',
    "bin/util.js": 'import { h } from "../lib/helper.js"; export const u = h;',
    "lib/helper.js": "export const h = 1;",
    "suelto.js": "export const x = 1;", // no referenciado: no entra
  };

  it("devuelve las dependencias antes que sus importadores, desde la entrada", () => {
    const order = buildLoadOrder(files, "module.js");
    expect(order).toEqual(["lib/helper.js", "bin/util.js", "module.js"]);
  });

  it("falla con aviso claro si falta un archivo importado", () => {
    expect(() => buildLoadOrder({ "module.js": 'import "./falta.js";' }, "module.js")).toThrow(
      /falta\.js/,
    );
  });

  it("falla con aviso claro ante un ciclo de imports", () => {
    const cyclic = { "a.js": 'import "./b.js";', "b.js": 'import "./a.js";' };
    expect(() => buildLoadOrder(cyclic, "a.js")).toThrow(/ciclo/i);
  });
});

describe("rewriteImports", () => {
  it("reescribe los relativos con urlFor y deja intactos paquetes y literales", () => {
    const urlFor = (path: string) => `blob:fake/${encodeURIComponent(path)}`;
    const code = [
      'import { a } from "./a.js";',
      'export * from "../lib/b.js";',
      'import("./lazy.js");',
      'import "fflate";',
      'const s = "./no-tocar.js";',
    ].join("\n");
    const out = rewriteImports(code, "bin/mod.js", urlFor);
    expect(out).toContain(`from "blob:fake/${encodeURIComponent("bin/a.js")}"`);
    expect(out).toContain(`from "blob:fake/${encodeURIComponent("lib/b.js")}"`);
    expect(out).toContain(`import("blob:fake/${encodeURIComponent("bin/lazy.js")}")`);
    expect(out).toContain('import "fflate";');
    expect(out).toContain('"./no-tocar.js"');
  });
});
