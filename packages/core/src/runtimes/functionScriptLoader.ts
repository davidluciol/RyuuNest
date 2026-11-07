/**
 * T40 — `ScriptLoader` de dispositivo basado en `new Function` (SPEC §6.5).
 *
 * El spike del 2026-11-06 en Hermes (Expo Go, S25 Ultra) confirmó que `eval` y
 * `new Function` funcionan, así que no hacen falta blob URLs ni Web Worker: el
 * paquete ES (varios archivos, solo imports relativos) se compila a **una**
 * función cuyo cuerpo ejecuta los archivos en orden de dependencias y devuelve
 * el `export default` de la entrada.
 *
 * Sin aislamiento (D-5): el módulo corre en el contexto de la app y su única
 * frontera es el `Host`. Es TS puro: vale igual en Node (pruebas) que en Hermes.
 *
 * Formas admitidas (las que usan los módulos publicados): `import { a, b as c }`,
 * `import d`, `import d, { a }`, `import * as n`, `import "x"`, `export const|let|
 * var|function|async function|class`, `export default …` y `export { a as b }`.
 * No se admiten `export … from`, `export *`, `import()` ni paquetes externos.
 */
import { ModuleError } from "../contract/errors.js";
import type { ScriptFactory, ScriptLoader } from "../ports/scriptLoader.js";

/** `import <cláusula> from "<ruta>"` (la cláusula puede ocupar varias líneas). */
const IMPORT_FROM = /^[ \t]*import\s+([^"';]*?)\s*from\s*(["'])([^"'\n]+)\2[ \t]*;?/gm;
/** `import "<ruta>"` (solo efectos). */
const IMPORT_BARE = /^[ \t]*import\s*(["'])([^"'\n]+)\1[ \t]*;?/gm;
/** `export … from "…"` y `export * …`: no admitidos. */
const REEXPORT = /^[ \t]*export\s+(?:\*|[^"';]*?\bfrom\b\s*["'])/gm;

function unsupported(message: string): ModuleError {
  return new ModuleError("UNSUPPORTED", message);
}

/** Resuelve un especificador relativo contra la ruta POSIX del archivo que importa. */
function resolveImport(fromPath: string, specifier: string): string {
  const base = fromPath.split("/").slice(0, -1);
  for (const segment of specifier.split("/")) {
    if (segment === "." || segment === "") continue;
    if (segment === "..") base.pop();
    else base.push(segment);
  }
  return base.join("/");
}

function importsOf(code: string, path: string): string[] {
  const found: string[] = [];
  for (const regex of [IMPORT_FROM, IMPORT_BARE]) {
    regex.lastIndex = 0;
    for (const match of code.matchAll(regex)) {
      const specifier = (regex === IMPORT_FROM ? match[3] : match[2]) ?? "";
      if (!specifier.startsWith(".")) {
        throw unsupported(
          `El módulo importa «${specifier}» desde ${path}: solo se admiten rutas relativas del paquete`,
        );
      }
      found.push(resolveImport(path, specifier));
    }
  }
  return found;
}

/** Orden de carga (post-orden DFS desde `entry`); falla si falta un archivo o hay ciclo. */
function loadOrder(files: Record<string, string>, entry: string): string[] {
  const order: string[] = [];
  const state = new Map<string, "visiting" | "done">();

  function visit(path: string): void {
    const current = state.get(path);
    if (current === "done") return;
    if (current === "visiting") throw unsupported(`Ciclo de imports en «${path}»`);
    const code = files[path];
    if (code === undefined) throw unsupported(`El paquete no trae el archivo «${path}»`);
    state.set(path, "visiting");
    for (const dependency of importsOf(code, path)) visit(dependency);
    state.set(path, "done");
    order.push(path);
  }

  visit(entry);
  return order;
}

/** Cláusula de import → declaraciones sobre `source` (la expresión del módulo importado). */
function importDeclarations(clause: string, source: string, path: string): string {
  const text = clause.trim();
  const declarations: string[] = [];
  const named = /\{([\s\S]*?)\}/.exec(text);
  const head = (named === null ? text : text.slice(0, named.index)).replace(/,\s*$/, "").trim();

  const namespace = /^\*\s*as\s+([\w$]+)$/.exec(head);
  if (namespace !== null) {
    declarations.push(`const ${namespace[1]} = ${source};`);
  } else if (head !== "") {
    declarations.push(`const ${head} = ${source}.default;`);
  }
  if (named !== null) {
    const bindings = (named[1] ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part !== "")
      .map((part) => part.replace(/\s+as\s+/, ": "));
    if (bindings.length > 0) declarations.push(`const { ${bindings.join(", ")} } = ${source};`);
  }
  if (declarations.length === 0) {
    throw unsupported(`Import no reconocido en ${path}: «${text}»`);
  }
  return declarations.join(" ");
}

/** Convierte un archivo ES en el cuerpo de una función que rellena `__exports`. */
function transformFile(code: string, path: string): string {
  REEXPORT.lastIndex = 0;
  if (REEXPORT.test(code)) {
    throw unsupported(`${path} usa «export … from»/«export *», que no se admite`);
  }

  const tail: string[] = [];
  let body = code
    .replace(IMPORT_FROM, (_whole, clause: string, _q: string, specifier: string) =>
      importDeclarations(clause, `__mods[${JSON.stringify(resolveImport(path, specifier))}]`, path),
    )
    .replace(IMPORT_BARE, () => "");

  // export { a, b as c };
  body = body.replace(/^[ \t]*export\s*\{([^}]*)\}[ \t]*;?/gm, (_whole, list: string) => {
    for (const part of list.split(",")) {
      const [local, exported] = part
        .trim()
        .split(/\s+as\s+/)
        .map((item) => item.trim());
      if (local !== undefined && local !== "") tail.push(`__exports.${exported ?? local} = ${local};`);
    }
    return "";
  });

  // export default function nombre(…) / export default async function nombre(…)
  body = body.replace(
    /^[ \t]*export\s+default\s+((?:async\s+)?function\s*\*?\s*)([\w$]+)/gm,
    (_whole, keyword: string, name: string) => {
      tail.push(`__exports.default = ${name};`);
      return `${keyword}${name}`;
    },
  );
  // export default <expresión> (incluye funciones anónimas)
  body = body.replace(/^[ \t]*export\s+default\s+/gm, "__exports.default = ");

  // export const|let|var|function|async function|class nombre
  body = body.replace(
    /^[ \t]*export\s+((?:async\s+function\s*\*?|function\s*\*?|class|const|let|var)\s*)([\w$]+)/gm,
    (_whole, keyword: string, name: string) => {
      tail.push(`__exports.${name} = ${name};`);
      return `${keyword}${name}`;
    },
  );

  return `${body}\n${tail.join("\n")}`;
}

/** Fuente de la función que ejecuta el paquete y devuelve su `export default`. */
export function compileScriptPackage(files: Record<string, string>, entry: string): string {
  const parts = ['"use strict";', "const __mods = Object.create(null);"];
  for (const path of loadOrder(files, entry)) {
    const code = transformFile(files[path] as string, path);
    parts.push(
      `__mods[${JSON.stringify(path)}] = (function () {`,
      "const __exports = {};",
      code,
      "return __exports;",
      "})();",
    );
  }
  parts.push(`return __mods[${JSON.stringify(entry)}].default;`);
  return parts.join("\n");
}

export function createFunctionScriptLoader(): ScriptLoader {
  return {
    async load(files, entry) {
      const source = compileScriptPackage(files, entry);
      let factory: unknown;
      try {
        factory = (new Function(source) as () => unknown)();
      } catch (error) {
        if (error instanceof ModuleError) throw error;
        throw new ModuleError(
          "UNSUPPORTED",
          `No se pudo cargar el módulo script: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
      if (typeof factory !== "function") {
        throw unsupported(`La entrada «${entry}» no exporta por defecto una función create(host)`);
      }
      return factory as ScriptFactory;
    },
  };
}
