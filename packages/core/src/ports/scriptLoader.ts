/**
 * Puerto `ScriptLoader` (SPEC §5.3 y §6.5): convierte el **código fuente** de un módulo
 * script en su fábrica `create(host)`.
 *
 * El núcleo es TS puro: no puede importar un `.js` descargado (cada plataforma lo hace
 * a su manera: archivo temporal en Node, blob URL en web, etc.). Por eso la carga entra
 * inyectada. La implementación de plataforma es del cliente (Parte 2); aquí solo vive el
 * contrato.
 *
 * Limitación conocida (**D-5**): en la v1 **no hay aislamiento real**; el módulo corre en
 * el mismo contexto que la app y la única frontera es el `Host` que se le pasa.
 */
import type { Host, ModuleApi } from "../contract/types.js";

/** Fábrica que exporta un módulo script (SPEC §6.5). Puede ser síncrona o asíncrona. */
export type ScriptFactory = (host: Host) => ModuleApi | Promise<ModuleApi>;

/** Carga el código fuente de un módulo y devuelve su fábrica. */
export interface ScriptLoader {
  load(source: string): Promise<ScriptFactory>;
}
