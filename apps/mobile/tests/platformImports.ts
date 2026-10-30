import path from "node:path";

import ts from "typescript";

/**
 * F34.1 — resolución de módulos por plataforma, como la hace Metro.
 *
 * Metro resuelve `./x` probando `x.<plataforma>.ts`, `x.native.ts` (solo en
 * Android e iOS) y `x.ts`, en ese orden. `tsc` y Vitest solo ven `x.ts`, así que
 * un defecto de resolución no falla en ninguno de los dos y revienta en el
 * dispositivo. Este módulo repite la resolución de Metro sobre un árbol de
 * fuentes y detecta dos defectos:
 *
 * - `self-import`: un `x.native.ts` que importa `./x` se importa a sí mismo en el
 *   dispositivo (F21: `backupFileName` quedaba sin definir).
 * - `missing-export`: un archivo pide un nombre que la variante de su plataforma
 *   no exporta (F21: `isNativePlatform` vivía solo en `backupFiles.ts` y Inicio
 *   caía al renderizar).
 *
 * Las importaciones de solo tipos se ignoran: Babel las borra y no llegan a Metro.
 */

export type Platform = "android" | "ios" | "web";

export const PLATFORMS: readonly Platform[] = ["android", "ios", "web"];

/** Árbol virtual de fuentes: ruta relativa con `/` → texto. */
export type SourceTree = Readonly<Record<string, string>>;

export interface PlatformImportIssue {
  kind: "self-import" | "missing-export";
  /** Archivo que importa. */
  file: string;
  specifier: string;
  /** Archivo al que Metro resuelve `specifier` desde `file`. */
  resolved: string;
  platforms: Platform[];
  /** Solo en `missing-export`: los nombres que `resolved` no exporta. */
  names: string[];
}

const EXTENSIONS = [".ts", ".tsx"];

/** Sufijos en el orden de Metro: la plataforma, `.native` (solo móvil) y ninguno. */
function suffixesFor(platform: Platform): string[] {
  return platform === "web" ? [".web", ""] : [`.${platform}`, ".native", ""];
}

function probe(tree: SourceTree, base: string, platform: Platform): string | null {
  for (const suffix of suffixesFor(platform)) {
    for (const extension of EXTENSIONS) {
      const candidate = `${base}${suffix}${extension}`;
      if (Object.hasOwn(tree, candidate)) return candidate;
    }
  }
  return null;
}

/**
 * Archivo al que Metro resuelve `specifier` desde `from` en `platform`, o `null`
 * si no es una ruta relativa a una fuente del árbol (paquetes, recursos).
 */
export function resolveForPlatform(
  tree: SourceTree,
  from: string,
  specifier: string,
  platform: Platform,
): string | null {
  if (!specifier.startsWith(".")) return null;
  const base = path.posix.join(path.posix.dirname(from), specifier);
  return probe(tree, base, platform) ?? probe(tree, `${base}/index`, platform);
}

interface Reference {
  specifier: string;
  /** Nombres de valor que se piden; vacío si solo importa que resuelva. */
  names: string[];
}

function importedNames(clause: ts.ImportClause | undefined): string[] {
  if (clause === undefined) return [];
  const names = clause.name === undefined ? [] : ["default"];
  const bindings = clause.namedBindings;
  if (bindings !== undefined && ts.isNamedImports(bindings)) {
    for (const element of bindings.elements) {
      if (!element.isTypeOnly) names.push((element.propertyName ?? element.name).text);
    }
  }
  return names;
}

/** Babel borra `import type …` y las declaraciones en las que todos los nombres son `type`. */
function isErasedImport(declaration: ts.ImportDeclaration): boolean {
  const clause = declaration.importClause;
  if (clause === undefined) return false;
  if (clause.phaseModifier === ts.SyntaxKind.TypeKeyword) return true;
  const bindings = clause.namedBindings;
  return (
    clause.name === undefined &&
    bindings !== undefined &&
    ts.isNamedImports(bindings) &&
    bindings.elements.length > 0 &&
    bindings.elements.every((element) => element.isTypeOnly)
  );
}

function reexportedNames(declaration: ts.ExportDeclaration): string[] {
  const clause = declaration.exportClause;
  if (clause === undefined || !ts.isNamedExports(clause)) return [];
  return clause.elements
    .filter((element) => !element.isTypeOnly)
    .map((element) => (element.propertyName ?? element.name).text);
}

/** `import("x")` y `require("x")` con ruta literal. */
function dynamicSpecifier(node: ts.CallExpression): string | null {
  const [first] = node.arguments;
  if (first === undefined || !ts.isStringLiteralLike(first)) return null;
  const callee = node.expression;
  const isImport = callee.kind === ts.SyntaxKind.ImportKeyword;
  const isRequire = ts.isIdentifier(callee) && callee.text === "require";
  return isImport || isRequire ? first.text : null;
}

function referencesIn(source: ts.SourceFile): Reference[] {
  const found: Reference[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteralLike(node.moduleSpecifier)) {
      if (!isErasedImport(node)) {
        found.push({
          specifier: node.moduleSpecifier.text,
          names: importedNames(node.importClause),
        });
      }
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      if (!node.isTypeOnly) {
        found.push({ specifier: node.moduleSpecifier.text, names: reexportedNames(node) });
      }
    } else if (ts.isCallExpression(node)) {
      const specifier = dynamicSpecifier(node);
      if (specifier !== null) found.push({ specifier, names: [] });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return (
    ts.canHaveModifiers(node) &&
    (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === kind)
  );
}

function bindingNames(name: ts.BindingName): string[] {
  if (ts.isIdentifier(name)) return [name.text];
  const elements: readonly ts.ArrayBindingElement[] = name.elements;
  return elements.flatMap((element) =>
    ts.isOmittedExpression(element) ? [] : bindingNames(element.name),
  );
}

/** Nombres que una declaración con `export` añade al módulo. */
function declaredNames(statement: ts.Statement): string[] {
  if (hasModifier(statement, ts.SyntaxKind.DefaultKeyword)) return ["default"];
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.flatMap((declaration) =>
      bindingNames(declaration.name),
    );
  }
  if (ts.isImportEqualsDeclaration(statement)) return [statement.name.text];
  if (
    ts.isFunctionDeclaration(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement) ||
    ts.isModuleDeclaration(statement)
  ) {
    return statement.name === undefined ? [] : [statement.name.text];
  }
  return [];
}

/**
 * Lo que exporta un módulo. `open` marca un `export *` de algo que no es una
 * fuente del árbol (un paquete): sus nombres no se conocen y no se acusa a nadie.
 */
interface ExportSet {
  names: Set<string>;
  open: boolean;
}

function createAnalysis(tree: SourceTree) {
  const sources = new Map<string, ts.SourceFile>();
  const exportsCache = new Map<string, ExportSet>();

  const sourceOf = (file: string): ts.SourceFile => {
    let source = sources.get(file);
    if (source === undefined) {
      const kind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      source = ts.createSourceFile(file, tree[file], ts.ScriptTarget.Latest, false, kind);
      sources.set(file, source);
    }
    return source;
  };

  /** Nombres que exporta `file` visto desde `platform` (valores y tipos). */
  const exportsOf = (
    file: string,
    platform: Platform,
    visiting: Set<string> = new Set(),
  ): ExportSet => {
    const key = `${platform}:${file}`;
    const cached = exportsCache.get(key);
    if (cached !== undefined) return cached;
    const exported: ExportSet = { names: new Set(), open: false };
    if (visiting.has(file)) return exported;
    visiting.add(file);
    for (const statement of sourceOf(file).statements) {
      if (ts.isExportDeclaration(statement)) {
        const clause = statement.exportClause;
        if (clause === undefined) {
          const specifier =
            statement.moduleSpecifier !== undefined &&
            ts.isStringLiteralLike(statement.moduleSpecifier)
              ? statement.moduleSpecifier.text
              : null;
          const target =
            specifier === null ? null : resolveForPlatform(tree, file, specifier, platform);
          if (target === null) {
            exported.open = true;
          } else {
            const inner = exportsOf(target, platform, visiting);
            for (const name of inner.names) {
              if (name !== "default") exported.names.add(name);
            }
            exported.open ||= inner.open;
          }
        } else if (ts.isNamespaceExport(clause)) {
          exported.names.add(clause.name.text);
        } else {
          for (const element of clause.elements) exported.names.add(element.name.text);
        }
      } else if (ts.isExportAssignment(statement)) {
        exported.names.add("default");
      } else if (hasModifier(statement, ts.SyntaxKind.ExportKeyword)) {
        for (const name of declaredNames(statement)) exported.names.add(name);
      }
    }
    visiting.delete(file);
    exportsCache.set(key, exported);
    return exported;
  };

  return { referencesOf: (file: string) => referencesIn(sourceOf(file)), exportsOf };
}

/**
 * Recorre el árbol y devuelve, por archivo y ruta, los defectos de resolución en
 * Android, iOS y web. Una misma importación que falla en varias plataformas se
 * informa una sola vez, con todas ellas.
 */
export function findPlatformImportIssues(tree: SourceTree): PlatformImportIssue[] {
  const analysis = createAnalysis(tree);
  const grouped = new Map<string, PlatformImportIssue>();

  const report = (issue: PlatformImportIssue): void => {
    const key = [issue.kind, issue.file, issue.specifier, issue.resolved, ...issue.names].join("|");
    const existing = grouped.get(key);
    if (existing === undefined) grouped.set(key, issue);
    else existing.platforms.push(...issue.platforms);
  };

  for (const file of Object.keys(tree).sort()) {
    for (const reference of analysis.referencesOf(file)) {
      for (const platform of PLATFORMS) {
        const resolved = resolveForPlatform(tree, file, reference.specifier, platform);
        if (resolved === null) continue;
        const base = { file, specifier: reference.specifier, resolved, platforms: [platform] };
        if (resolved === file) {
          report({ kind: "self-import", ...base, names: [] });
          continue;
        }
        const exported = analysis.exportsOf(resolved, platform);
        if (exported.open) continue;
        const missing = reference.names.filter((name) => !exported.names.has(name));
        if (missing.length > 0) report({ kind: "missing-export", ...base, names: missing });
      }
    }
  }
  return [...grouped.values()];
}

export function describePlatformIssue(issue: PlatformImportIssue): string {
  const where = issue.platforms.join(", ");
  if (issue.kind === "self-import") {
    return `${issue.file} importa «${issue.specifier}» y en ${where} Metro lo resuelve a sí mismo`;
  }
  return `${issue.file} importa {${issue.names.join(", ")}} de «${issue.specifier}», pero en ${where} Metro resuelve ${issue.resolved}, que no lo exporta`;
}
