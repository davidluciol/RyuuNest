/**
 * Puerto `ScriptLoader` (SPEC §5.3 y §6.5): convierte el **paquete** de un módulo
 * script (ruta → texto) en la fábrica `create(host)` de su archivo de entrada.
 *
 * R1 (ADR-0003, D1-A): el cargador recibe el paquete completo y la ruta de
 * entrada, no solo el texto de la entrada, para poder resolver los `import`
 * relativos dentro del paquete (los módulos publicados son ES multi-archivo).
 *
 * El núcleo es TS puro: no puede importar un `.js` descargado (cada plataforma lo
 * hace a su manera: blob URLs + Web Worker en web, archivo temporal en Node…).
 * Por eso la carga entra inyectada. La implementación de plataforma es del
 * cliente (Parte 2); aquí solo vive el contrato.
 *
 * Limitación conocida (**D-5**): en la v1 **no hay aislamiento real**; el módulo
 * corre en el mismo contexto que la app y la única frontera es el `Host`.
 */
import type { Host, ModuleApi } from "../contract/types.js";

/** Fábrica que exporta un módulo script (SPEC §6.5). Puede ser síncrona o asíncrona. */
export type ScriptFactory = (host: Host) => ModuleApi | Promise<ModuleApi>;

/** Carga el paquete del módulo y devuelve la fábrica de su entrada. */
export interface ScriptLoader {
  /**
   * @param files Contenido de **todos** los archivos del paquete (ruta → texto).
   * @param entry Ruta del archivo de entrada (`manifest.entry`), dentro de `files`.
   */
  load(files: Record<string, string>, entry: string): Promise<ScriptFactory>;
}
