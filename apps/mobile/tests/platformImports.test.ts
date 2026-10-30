import { describe, expect, it } from "vitest";

import {
  describePlatformIssue,
  findPlatformImportIssues,
  resolveForPlatform,
  type SourceTree,
} from "./platformImports";

/**
 * F34.1 — detector de resolución por plataforma. Metro resuelve `./x` a
 * `x.native.ts` en Android e iOS; `tsc` y Vitest solo ven `x.ts`. Un defecto de
 * resolución no falla en ninguno de los dos y revienta en el dispositivo (F21:
 * Inicio caía al renderizar). Aquí se fija el detector sobre árboles virtuales;
 * `platformResolution.test.ts` lo ejecuta sobre `apps/mobile/src`.
 */

describe("resolveForPlatform (orden de Metro)", () => {
  const tree: SourceTree = {
    "data/x.ts": "",
    "data/x.native.ts": "",
    "data/x.android.ts": "",
    "data/y.ts": "",
    "data/y.native.ts": "",
    "data/z.ts": "",
    "data/dir/index.ts": "",
    "data/dir/index.native.ts": "",
    "screens/a.ts": "",
  };

  it("en Android prefiere `.android`, luego `.native` y al final el archivo sin sufijo", () => {
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/x", "android")).toBe(
      "data/x.android.ts",
    );
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/y", "android")).toBe(
      "data/y.native.ts",
    );
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/z", "android")).toBe("data/z.ts");
  });

  it("en iOS `.android` no cuenta y `.native` sí", () => {
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/x", "ios")).toBe("data/x.native.ts");
  });

  it("en web ignora `.native` y `.android`", () => {
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/x", "web")).toBe("data/x.ts");
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/y", "web")).toBe("data/y.ts");
  });

  it("una ruta con `.native` explícita resuelve al archivo nativo", () => {
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/y.native", "android")).toBe(
      "data/y.native.ts",
    );
  });

  it("resuelve carpetas por su `index`, también con variante nativa", () => {
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/dir", "android")).toBe(
      "data/dir/index.native.ts",
    );
    expect(resolveForPlatform(tree, "screens/a.ts", "../data/dir", "web")).toBe(
      "data/dir/index.ts",
    );
  });

  it("ignora paquetes y archivos que no son fuentes (recursos)", () => {
    expect(resolveForPlatform(tree, "screens/a.ts", "react", "android")).toBeNull();
    expect(resolveForPlatform(tree, "screens/a.ts", "../../assets/logo.png", "android")).toBeNull();
  });
});

/** La forma del defecto F21: el hermano `.native` importa del hermano web. */
const BROKEN: SourceTree = {
  "data/files.ts": [
    "export interface Files { share(): void }",
    "export function fileName(): string { return 'a'; }",
    "export function isNative(): boolean { return false; }",
    "export function createWebFiles(): Files { return { share() {} }; }",
  ].join("\n"),
  "data/files.native.ts": [
    'import { fileName, type Files } from "./files";',
    "export function createNativeFiles(): Files { return { share() { fileName(); } }; }",
  ].join("\n"),
  "screens/useFiles.ts": [
    'import { createWebFiles, isNative } from "../data/files";',
    "export const used = [createWebFiles, isNative];",
  ].join("\n"),
};

/** El arreglo: lo compartido en un módulo sin hermano de plataforma y la misma fábrica en ambos. */
const FIXED: SourceTree = {
  "data/filesPort.ts": [
    "export interface Files { share(): void }",
    "export function fileName(): string { return 'a'; }",
    "export function isNative(): boolean { return false; }",
  ].join("\n"),
  "data/files.ts": [
    'import { type Files } from "./filesPort";',
    "export function createFiles(): Files { return { share() {} }; }",
  ].join("\n"),
  "data/files.native.ts": [
    'import { fileName, type Files } from "./filesPort";',
    "export function createFiles(): Files { return { share() { fileName(); } }; }",
  ].join("\n"),
  "screens/useFiles.ts": [
    'import { createFiles } from "../data/files";',
    'import { isNative, type Files } from "../data/filesPort";',
    "export const used: Files[] = isNative() ? [] : [createFiles()];",
  ].join("\n"),
};

describe("findPlatformImportIssues", () => {
  it("detecta el hermano `.native` que importa de su hermano web (se importa a sí mismo)", () => {
    const issues = findPlatformImportIssues(BROKEN).filter((issue) => issue.kind === "self-import");
    expect(issues).toEqual([
      {
        kind: "self-import",
        file: "data/files.native.ts",
        specifier: "./files",
        resolved: "data/files.native.ts",
        platforms: ["android", "ios"],
        names: [],
      },
    ]);
  });

  it("detecta al consumidor que pide nombres que la variante nativa no exporta", () => {
    const issues = findPlatformImportIssues(BROKEN).filter(
      (issue) => issue.kind === "missing-export",
    );
    expect(issues).toEqual([
      {
        kind: "missing-export",
        file: "screens/useFiles.ts",
        specifier: "../data/files",
        resolved: "data/files.native.ts",
        platforms: ["android", "ios"],
        names: ["createWebFiles", "isNative"],
      },
    ]);
  });

  it("no avisa de la web: allí `./files` es el archivo web y exporta todo", () => {
    for (const issue of findPlatformImportIssues(BROKEN)) {
      expect(issue.platforms).not.toContain("web");
    }
  });

  it("no avisa cuando lo compartido vive en un módulo sin hermano de plataforma", () => {
    expect(findPlatformImportIssues(FIXED)).toEqual([]);
  });

  it("detecta también `import()` y `require()` de su propio hermano", () => {
    const tree: SourceTree = {
      "data/x.ts": "export const a = 1;",
      "data/x.native.ts": 'export const lazy = () => import("./x");',
      "data/y.ts": "export const b = 1;",
      "data/y.native.ts": 'export const eager = () => require("./y");',
    };
    expect(findPlatformImportIssues(tree).map((issue) => `${issue.kind}: ${issue.file}`)).toEqual([
      "self-import: data/x.native.ts",
      "self-import: data/y.native.ts",
    ]);
  });

  it("informa una sola vez la misma importación repetida", () => {
    const tree: SourceTree = {
      "data/x.ts": "export const a = 1;",
      "data/x.native.ts": 'import "./x";\nimport "./x";',
    };
    expect(findPlatformImportIssues(tree)).toHaveLength(1);
  });

  it("ignora las importaciones de solo tipos: Babel las borra", () => {
    const tree: SourceTree = {
      "data/x.ts": "export type A = string;",
      "data/x.native.ts": [
        'import type { A } from "./x";',
        'import { type A as B } from "./x";',
        "export const v: A | B = 'a';",
      ].join("\n"),
    };
    expect(findPlatformImportIssues(tree)).toEqual([]);
  });

  it("comprueba el valor de un import mixto y no el tipo", () => {
    const tree: SourceTree = {
      "data/x.ts": "export type A = string;\nexport const value = 1;",
      "data/x.native.ts": "export type A = string;",
      "screens/a.ts":
        'import { type A, value } from "../data/x";\nexport const v: A = String(value);',
    };
    expect(findPlatformImportIssues(tree).map((issue) => issue.names)).toEqual([["value"]]);
  });

  it("sigue `export *` para saber qué exporta la variante", () => {
    const tree: SourceTree = {
      "data/port.ts": "export const shared = 1;\nexport default 2;",
      "data/x.ts": 'export * from "./port";\nexport const web = 1;',
      "data/x.native.ts": 'export * from "./port";\nexport const native = 1;',
      "screens/a.ts": 'import { shared } from "../data/x";\nexport const v = shared;',
    };
    expect(findPlatformImportIssues(tree)).toEqual([]);
  });

  it("no acusa si la variante reexporta un paquete entero: sus nombres no se conocen", () => {
    const tree: SourceTree = {
      "data/icons.ts": 'export * from "lucide-react-native";',
      "screens/a.ts":
        'import { Play, Pause } from "../data/icons";\nexport const v = [Play, Pause];',
    };
    expect(findPlatformImportIssues(tree)).toEqual([]);
  });

  it("`export *` no reexporta el `default`", () => {
    const tree: SourceTree = {
      "data/port.ts": "export const shared = 1;\nexport default 2;",
      "data/x.ts": 'export * from "./port";\nexport default 3;',
      "data/x.native.ts": 'export * from "./port";',
      "screens/a.ts": 'import value from "../data/x";\nexport const v = value;',
    };
    expect(findPlatformImportIssues(tree).map((issue) => issue.names)).toEqual([["default"]]);
  });

  it("entiende exportaciones con nombre, `export { a as b }`, enum, clase y variables desestructuradas", () => {
    const tree: SourceTree = {
      "data/x.native.ts": [
        "const inner = 1;",
        "export { inner as renamed };",
        "export enum Mode { A }",
        "export class Thing {}",
        "export const { first, second: [third] } = { first: 1, second: [2] };",
        "export default function () {}",
      ].join("\n"),
      "screens/a.ts": [
        'import Default, { renamed, Mode, Thing, first, third } from "../data/x";',
        "export const v = [Default, renamed, Mode, Thing, first, third];",
      ].join("\n"),
    };
    expect(findPlatformImportIssues(tree)).toEqual([]);
  });

  it("comprueba las reexportaciones con nombre `export { a } from`", () => {
    const tree: SourceTree = {
      "data/x.ts": "export const a = 1;",
      "data/x.native.ts": "export const b = 1;",
      "screens/a.ts": 'export { a } from "../data/x";',
    };
    expect(findPlatformImportIssues(tree).map((issue) => issue.names)).toEqual([["a"]]);
  });

  it("no pide nombres a los imports de espacio de nombres ni de efecto", () => {
    const tree: SourceTree = {
      "data/x.ts": "export const a = 1;",
      "data/x.native.ts": "export const b = 1;",
      "screens/a.ts":
        'import * as everything from "../data/x";\nimport "../data/x";\nexport { everything };',
    };
    expect(findPlatformImportIssues(tree)).toEqual([]);
  });

  it("resuelve `./carpeta` a su `index` también en la comprobación de nombres", () => {
    const tree: SourceTree = {
      "data/dir/index.ts": "export const a = 1;",
      "data/dir/index.native.ts": "export const b = 1;",
      "screens/a.ts": 'import { a } from "../data/dir";\nexport const v = a;',
    };
    expect(findPlatformImportIssues(tree).map((issue) => issue.names)).toEqual([["a"]]);
  });

  it("describe cada aviso con el archivo, el nombre y la plataforma", () => {
    const [selfImport, missing] = findPlatformImportIssues(BROKEN);
    expect(describePlatformIssue(selfImport)).toBe(
      "data/files.native.ts importa «./files» y en android, ios Metro lo resuelve a sí mismo",
    );
    expect(describePlatformIssue(missing)).toBe(
      "screens/useFiles.ts importa {createWebFiles, isNative} de «../data/files», pero en android, ios Metro resuelve data/files.native.ts, que no lo exporta",
    );
  });
});
