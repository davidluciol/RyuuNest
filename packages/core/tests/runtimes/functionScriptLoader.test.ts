import { describe, expect, it } from "vitest";

import { ModuleError } from "../../src/contract/errors.js";
import type { Host } from "../../src/contract/types.js";
import { createFunctionScriptLoader } from "../../src/runtimes/functionScriptLoader.js";

/**
 * T40 — `ScriptLoader` basado en `new Function` (Hermes lo admite: spike del
 * 2026-11-06 en Expo Go). Convierte el paquete ES (varios archivos, solo
 * imports relativos) en una función y devuelve la fábrica `export default`.
 */

const host = { log: () => undefined } as unknown as Host;

const PACKAGE: Record<string, string> = {
  "module.js": [
    "/** Fábrica. */",
    'import { popular, latest } from "./bin/home.js";',
    'import * as text from "./bin/utils/text.js";',
    'import greet, { BASE as origin } from "./bin/config.js";',
    "",
    "export default function create(host) {",
    "  return {",
    "    popular: (page) => popular(host, page),",
    "    latest: (page) => latest(host, page),",
    "    shout: (value) => text.upper(value),",
    "    hello: () => greet() + origin,",
    "  };",
    "}",
  ].join("\n"),
  "bin/home.js": [
    'import {',
    "  collapse,",
    "  upper as up,",
    '} from "./utils/text.js";',
    'import { BASE } from "./config.js";',
    "",
    "export async function popular(host, page) {",
    "  return [`${BASE}/p${page}`, collapse(' a   b '), up('x')];",
    "}",
    "export function latest(host, page) { return [`late${page}`]; }",
  ].join("\n"),
  "bin/utils/text.js": [
    "export function collapse(text) { return text.replace(/\\s+/gu, ' ').trim(); }",
    "export const upper = (value) => value.toUpperCase();",
    "export const LABEL = 'import x from \"./nada.js\"';",
  ].join("\n"),
  "bin/config.js": [
    'export const BASE = "https://sitio.test";',
    "function greeting() { return 'hola '; }",
    "export { greeting as default };",
  ].join("\n"),
};

describe("createFunctionScriptLoader", () => {
  it("carga un paquete de varios archivos y devuelve la fábrica del export default", async () => {
    const factory = await createFunctionScriptLoader().load(PACKAGE, "module.js");
    const api = (await factory(host)) as unknown as Record<
      string,
      (...args: unknown[]) => unknown
    >;

    expect(await api["popular"]?.(2)).toEqual(["https://sitio.test/p2", "a b", "X"]);
    expect(api["latest"]?.(3)).toEqual(["late3"]);
    expect(api["shout"]?.("ab")).toBe("AB");
    expect(api["hello"]?.()).toBe("hola https://sitio.test");
  });

  it("no toca un literal de texto que parece un import", async () => {
    const files = {
      "m.js": [
        'import { LABEL } from "./t.js";',
        "export default function create() { return { label: () => LABEL }; }",
      ].join("\n"),
      "t.js": "export const LABEL = 'import x from \"./nada.js\"';",
    };
    const factory = await createFunctionScriptLoader().load(files, "m.js");
    const api = (await factory(host)) as unknown as { label(): string };

    expect(api.label()).toBe('import x from "./nada.js"');
  });

  it("falla con UNSUPPORTED si falta un archivo importado", async () => {
    const files = { "m.js": 'import { a } from "./falta.js";\nexport default function c() {}' };

    await expect(createFunctionScriptLoader().load(files, "m.js")).rejects.toMatchObject({
      code: "UNSUPPORTED",
    });
  });

  it("falla con UNSUPPORTED ante un ciclo de imports", async () => {
    const files = {
      "a.js": 'import { b } from "./b.js";\nexport const a = 1;\nexport default function c() {}',
      "b.js": 'import { a } from "./a.js";\nexport const b = 2;',
    };

    await expect(createFunctionScriptLoader().load(files, "a.js")).rejects.toBeInstanceOf(
      ModuleError,
    );
  });

  it("rechaza imports de paquetes externos", async () => {
    const files = { "m.js": 'import x from "lodash";\nexport default function c() {}' };

    await expect(createFunctionScriptLoader().load(files, "m.js")).rejects.toMatchObject({
      code: "UNSUPPORTED",
    });
  });

  it("falla si la entrada no exporta una función por defecto", async () => {
    const files = { "m.js": "export const x = 1;" };

    await expect(createFunctionScriptLoader().load(files, "m.js")).rejects.toMatchObject({
      code: "UNSUPPORTED",
    });
  });

  it("convierte un error de sintaxis del módulo en un ModuleError", async () => {
    const files = { "m.js": "export default function c( {" };

    await expect(createFunctionScriptLoader().load(files, "m.js")).rejects.toBeInstanceOf(
      ModuleError,
    );
  });
});
