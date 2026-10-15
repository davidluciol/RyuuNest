/**
 * CLI del SDK de módulos (SPEC §13): crear un módulo desde plantilla, validarlo,
 * probarlo contra las fixtures de `@ryuunest/test-site` y empaquetarlo con su hash.
 *
 * Toda la lógica vive en funciones con la E/S inyectada (`CliIo`), así que se prueba
 * sin arrancar un proceso. `node dist/cli.js` ejecuta `main` directamente.
 */
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { CORE_VERSION, ModuleHost, type ModuleManifest } from "@ryuunest/core";
import {
  createHtmlSite,
  createSiteHttp,
  HTML_SITE_BASE_URL,
  runContract,
} from "@ryuunest/test-site";
import { zipSync } from "fflate";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { validateManifest } from "./manifest.js";
import { ID_PATTERN } from "./validation.js";

export const CLI_NAME = "ryuunest-module";

/** Entrada y salida del CLI (inyectables para las pruebas). */
export interface CliIo {
  cwd: string;
  out(text: string): void;
  err(text: string): void;
}

export function createProcessIo(): CliIo {
  return {
    cwd: process.cwd(),
    out: (text) => {
      process.stdout.write(text);
    },
    err: (text) => {
      process.stderr.write(text);
    },
  };
}

const HELP = `Uso: ${CLI_NAME} <comando> [opciones]

Comandos:
  create <id>     Crea un módulo desde plantilla.
                  --template declarative|script (por defecto: declarative)
                  --dir <ruta>  --name <nombre>  --base-url <url>
                  --domain <dominio>  --force
  validate <dir>  Valida el manifest.json (SPEC §6.1). --app-version <versión>
  test <dir>      Ejecuta el arnés de contrato contra el sitio falso de pruebas.
  pack <dir>      Empaqueta el módulo en .zip y calcula sha256 y tamaño.
                  --out <archivo.zip>

Ejemplos:
  ${CLI_NAME} create mi-sitio
  ${CLI_NAME} validate mi-sitio && ${CLI_NAME} test mi-sitio && ${CLI_NAME} pack mi-sitio
`;

export async function main(argv: readonly string[], io: CliIo): Promise<number> {
  const [command, ...rest] = argv;

  switch (command) {
    case "create":
      return createCommand(rest, io);
    case "validate":
      return validateCommand(rest, io);
    case "test":
      return testCommand(rest, io);
    case "pack":
      return packCommand(rest, io);
    case undefined:
    case "help":
    case "--help":
    case "-h":
      io.out(HELP);
      return 0;
    default:
      io.err(`Comando desconocido: "${command}".\n\n${HELP}`);
      return 1;
  }
}

/* ------------------------------------------------------------------ */
/* Argumentos                                                          */
/* ------------------------------------------------------------------ */

/** Modificadores que no llevan valor. */
const BOOLEAN_FLAGS = new Set(["force", "help"]);

interface ParsedArgs {
  positional: string[];
  flags: Map<string, string | true>;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const positional: string[] = [];
  const flags = new Map<string, string | true>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === undefined) {
      continue;
    }
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const name = token.slice(2);
    const equals = name.indexOf("=");
    if (equals !== -1) {
      flags.set(name.slice(0, equals), name.slice(equals + 1));
      continue;
    }

    const next = argv[index + 1];
    if (!BOOLEAN_FLAGS.has(name) && next !== undefined && !next.startsWith("--")) {
      flags.set(name, next);
      index += 1;
      continue;
    }

    flags.set(name, true);
  }

  return { positional, flags };
}

function flagValue(flags: Map<string, string | true>, name: string): string | undefined {
  const value = flags.get(name);
  return typeof value === "string" ? value : undefined;
}

function isFlagSet(flags: Map<string, string | true>, name: string): boolean {
  return flags.get(name) === true;
}

/* ------------------------------------------------------------------ */
/* Comandos                                                            */
/* ------------------------------------------------------------------ */

async function createCommand(argv: readonly string[], io: CliIo): Promise<number> {
  const { positional, flags } = parseArgs(argv);

  const id = positional[0];
  if (id === undefined) {
    io.err(`Falta el identificador del módulo.\n\n${HELP}`);
    return 1;
  }
  if (!ID_PATTERN.test(id)) {
    io.err(`Identificador inválido: "${id}". Solo minúsculas, dígitos y guiones ([a-z0-9-]).\n`);
    return 1;
  }

  const templateName = flagValue(flags, "template") ?? "declarative";
  if (templateName !== "declarative" && templateName !== "script") {
    io.err(`Plantilla desconocida: "${templateName}". Usa "declarative" o "script".\n`);
    return 1;
  }

  const targetDir = resolve(io.cwd, flagValue(flags, "dir") ?? id);
  const baseUrl = flagValue(flags, "base-url") ?? HTML_SITE_BASE_URL;
  const values: Record<string, string> = {
    id,
    name: flagValue(flags, "name") ?? id,
    baseUrl,
    domain: flagValue(flags, "domain") ?? domainOf(baseUrl),
  };

  if (!isFlagSet(flags, "force") && (await pathExists(targetDir))) {
    io.err(
      `El destino ya existe: ${targetDir}. Usa --force para sobrescribir los archivos de la plantilla.\n`,
    );
    return 1;
  }

  const templateDir = join(templateRoot(), templateName);
  let templateFiles: string[];
  try {
    templateFiles = (await collectFiles(templateDir, [])).sort();
  } catch {
    io.err(`No se encontró la plantilla "${templateName}" en ${templateDir}.\n`);
    return 1;
  }

  for (const file of templateFiles) {
    const content = await readFile(join(templateDir, file), "utf8");
    const outputPath = join(targetDir, file);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, applyPlaceholders(content, values));
  }

  io.out(`Módulo "${id}" creado en ${targetDir} (plantilla ${templateName}).\n`);
  for (const file of templateFiles) {
    io.out(`  - ${file}\n`);
  }
  io.out(`\nSiguiente: ${CLI_NAME} validate "${targetDir}"\n`);
  return 0;
}

async function validateCommand(argv: readonly string[], io: CliIo): Promise<number> {
  const { positional, flags } = parseArgs(argv);
  const dir = resolve(io.cwd, positional[0] ?? ".");
  const loaded = await loadManifest(dir, flags);
  if (!loaded.ok) {
    io.err(`${loaded.message}\n`);
    return 1;
  }

  const manifest = loaded.manifest;
  io.out(`Manifest válido: ${manifest.id} ${manifest.version} (${manifest.runtime}).\n`);
  return 0;
}

async function testCommand(argv: readonly string[], io: CliIo): Promise<number> {
  const { positional, flags } = parseArgs(argv);
  const dir = resolve(io.cwd, positional[0] ?? ".");
  const loaded = await loadManifest(dir, flags);
  if (!loaded.ok) {
    io.err(`${loaded.message}\n`);
    return 1;
  }

  const manifest = loaded.manifest;
  if (manifest.runtime === "declarative") {
    io.out(
      "Módulo declarativo: el runtime declarativo llega en T16; se omite la ejecución del contrato.\n",
    );
    return 0;
  }

  try {
    const create = await loadScriptFactory(join(dir, manifest.entry), dir);
    const host = new ModuleHost({
      http: createSiteHttp(createHtmlSite()),
      clock: { now: () => Date.now() },
      permissions: manifest.permissions,
      minDelayMs: 0,
    });
    const api = await create(host);
    const report = await runContract(api, { capabilities: manifest.capabilities });

    io.out(`Contrato OK (${report.seriesId}): ${report.methods.join(", ")}\n`);
    return 0;
  } catch (error) {
    io.err(`Contrato fallido: ${describe(error)}\n`);
    return 1;
  }
}

async function packCommand(argv: readonly string[], io: CliIo): Promise<number> {
  const { positional, flags } = parseArgs(argv);
  const dir = resolve(io.cwd, positional[0] ?? ".");
  const loaded = await loadManifest(dir, flags);
  if (!loaded.ok) {
    io.err(`${loaded.message}\n`);
    return 1;
  }

  const manifest = loaded.manifest;
  const outPath = resolve(
    io.cwd,
    flagValue(flags, "out") ?? `${manifest.id}-${manifest.version}.zip`,
  );
  const files = (await collectFiles(dir, [outPath])).sort();
  if (files.length === 0) {
    io.err("No hay archivos que empaquetar.\n");
    return 1;
  }

  const entries: Record<string, Uint8Array> = {};
  for (const file of files) {
    entries[file] = await readFile(join(dir, file));
  }

  const archive = zipSync(entries, { level: 6 });
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, archive);

  io.out(
    `${JSON.stringify(
      { file: outPath, sha256: bytesToHex(sha256(archive)), size: archive.length, files },
      null,
      2,
    )}\n`,
  );
  return 0;
}

/* ------------------------------------------------------------------ */
/* Ayudas                                                              */
/* ------------------------------------------------------------------ */

type LoadedManifest = { ok: true; manifest: ModuleManifest } | { ok: false; message: string };

async function loadManifest(
  dir: string,
  flags: Map<string, string | true>,
): Promise<LoadedManifest> {
  const manifestPath = join(dir, "manifest.json");

  let text: string;
  try {
    text = await readFile(manifestPath, "utf8");
  } catch {
    return { ok: false, message: `No se pudo leer ${manifestPath}` };
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch (error) {
    return { ok: false, message: `${manifestPath} no es JSON válido: ${describe(error)}` };
  }

  const appVersion = flagValue(flags, "app-version") ?? CORE_VERSION;
  const result = validateManifest(value, { appVersion });
  if (!result.ok) {
    const lines = result.issues.map(
      (issue) => `  ${issue.path === "" ? "(raíz)" : issue.path}: ${issue.message}`,
    );
    return { ok: false, message: `Manifest inválido (${manifestPath}):\n${lines.join("\n")}` };
  }

  return { ok: true, manifest: result.value };
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Carga la fábrica de un módulo script.
 *
 * El archivo de entrada es un módulo ES dentro de un `.js` que no tiene un
 * `package.json` al lado, así que Node lo tomaría como CommonJS. Se evalúa desde una
 * copia `.mjs` temporal, en la misma carpeta para que resuelvan los `import`
 * relativos, y se borra siempre. (El runtime del núcleo, T18, cerrará esta
 * estrategia.)
 */
async function loadScriptFactory(
  entryPath: string,
  workDir: string,
): Promise<(host: ModuleHost) => Promise<unknown>> {
  let source: string;
  try {
    source = await readFile(entryPath, "utf8");
  } catch {
    throw new Error(`No se pudo leer el archivo de entrada: ${entryPath}`);
  }

  const temporaryPath = join(
    workDir,
    `.ryuunest-eval-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`,
  );

  try {
    await writeFile(temporaryPath, source, "utf8");
    const namespace = (await import(/* @vite-ignore */ pathToFileURL(temporaryPath).href)) as {
      default?: unknown;
      create?: unknown;
    };

    const factory = typeof namespace.default === "function" ? namespace.default : namespace.create;
    if (typeof factory !== "function") {
      throw new Error(`${entryPath} debe exportar \`create(host)\``);
    }

    return factory as (host: ModuleHost) => Promise<unknown>;
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

function templateRoot(): string {
  return join(dirname(fileURLToPath(import.meta.url)), "..", "templates");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

/** Rutas de archivo (relativas, con `/`) dentro de `root`. */
async function collectFiles(
  root: string,
  exclude: readonly string[],
  prefix = "",
): Promise<string[]> {
  const names = await readdir(prefix === "" ? root : join(root, prefix));
  const files: string[] = [];

  for (const name of names) {
    if (name.startsWith(".") || name === "node_modules") {
      continue;
    }
    const relativePath = prefix === "" ? name : `${prefix}/${name}`;
    const absolutePath = join(root, relativePath);
    if (exclude.includes(resolve(absolutePath))) {
      continue;
    }

    if ((await stat(absolutePath)).isDirectory()) {
      files.push(...(await collectFiles(root, exclude, relativePath)));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function applyPlaceholders(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => values[key] ?? match);
}

function domainOf(url: string): string {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#\s]+)/i.exec(url);
  return (match?.[1] ?? url).replace(/:\d+$/, "");
}

/* ------------------------------------------------------------------ */
/* Arranque                                                            */
/* ------------------------------------------------------------------ */

const invokedDirectly =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  void main(process.argv.slice(2), createProcessIo()).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      process.stderr.write(`Error inesperado: ${describe(error)}\n`);
      process.exitCode = 1;
    },
  );
}
