/**
 * Declaraciones mínimas de Node para las pruebas (precedente:
 * `packages/core/src/globals.d.ts`). Solo en `tests/`; evitan arrastrar
 * `@types/node` al proyecto (`AGENTS.md` §7). `Buffer` y `process` ya los aporta
 * `@types/react-native`, así que aquí solo se declaran los módulos.
 */
declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
  export function readFileSync(path: string): Buffer;
  export function existsSync(path: string): boolean;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function resolve(...parts: string[]): string;
}

declare module "node:sqlite" {
  export interface StatementSync {
    run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
    all(...params: unknown[]): unknown[];
    get(...params: unknown[]): unknown;
  }
  export class DatabaseSync {
    constructor(path: string);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
