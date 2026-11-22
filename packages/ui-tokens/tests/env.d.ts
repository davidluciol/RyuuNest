/**
 * Declaraciones mínimas para las pruebas (precedente: `packages/core/src/globals.d.ts`).
 * Se usan solo en `tests/`; no se emiten a `dist/` y evitan arrastrar `@types/node`
 * al paquete (`AGENTS.md` §7: no añadir dependencias sin preguntar).
 */
declare module "node:fs" {
  export function readFileSync(path: string, encoding: string): string;
}

/** Carpeta del test (Node ≥ 20.11): las rutas no dependen del cwd de Vitest (T44). */
interface ImportMeta {
  readonly dirname: string;
}
