/**
 * Declaraciones mínimas de las API de Node que usa el CLI del SDK.
 *
 * El proyecto evita añadir dependencias sin preguntar (`AGENTS.md` §7) y ya tiene el
 * precedente de `packages/core/src/globals.d.ts`: aquí se declara solo la superficie
 * que el CLI necesita (`fs/promises`, `path`, `url`, `os` y `process`). Si el humano
 * prefiere `@types/node`, se cambia (ver `MEMORY.md`, pregunta abierta 9).
 */

declare module "node:fs/promises" {
  export function readFile(path: string): Promise<Uint8Array>;
  export function readFile(path: string, encoding: "utf8"): Promise<string>;
  export function writeFile(
    path: string,
    data: string | Uint8Array,
    encoding?: "utf8",
  ): Promise<void>;
  export function mkdir(path: string, options: { recursive: true }): Promise<string | undefined>;
  export function readdir(path: string): Promise<string[]>;
  export function stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }>;
  export function rm(
    path: string,
    options: { recursive?: boolean; force?: boolean },
  ): Promise<void>;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function dirname(path: string): string;
  export function resolve(...parts: string[]): string;
  export function relative(from: string, to: string): string;
}

declare module "node:url" {
  export function fileURLToPath(url: string | { href: string }): string;
  export function pathToFileURL(path: string): { href: string };
}

declare module "node:os" {
  export function tmpdir(): string;
}

declare const process: {
  argv: string[];
  cwd(): string;
  exitCode: number | undefined;
  stdout: { write(text: string): void };
  stderr: { write(text: string): void };
};

/** `import.meta.url` (la lib `ES2022` no lo declara). */
interface ImportMeta {
  readonly url: string;
}
