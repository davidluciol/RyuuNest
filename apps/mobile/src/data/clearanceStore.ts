import type { ClearanceStore } from "@ryuunest/core";

/** F100 — en web no hay verificación de Cloudflare (la red va por la extensión). */
export function createAppClearanceStore(): ClearanceStore | undefined {
  return undefined;
}
