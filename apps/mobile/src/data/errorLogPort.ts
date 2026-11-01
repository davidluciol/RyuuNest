/**
 * Re-export del contrato compartido en el núcleo (P-114): ver
 * `@ryuunest/core` → `createErrorReporter` / `ErrorReporter`. La resolución real
 * del `LogStore` vive en `errorLog.ts`.
 */
export { createErrorReporter, type ErrorReporter } from "@ryuunest/core";
