import type { Clearance, ClearanceStore } from "@ryuunest/core";

/**
 * F100 — `ClearanceStore` sobre `expo-secure-store` (Keystore de Android). La
 * librería se inyecta para probar sin dispositivo; la selección por plataforma
 * vive en `clearanceStore.ts` / `clearanceStore.native.ts`. La verificación
 * nunca entra en respaldos ni en diagnóstico: solo vive aquí.
 */

/** Lo que usamos de `expo-secure-store`. */
export interface SecureStoreLike {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
}

// SecureStore solo admite claves con letras, números, «.», «-» y «_»: un hostname cabe tal cual.
const keyOf = (host: string) => `cf_clearance.${host}`;

function parse(raw: string | null): Clearance | undefined {
  if (raw === null) return undefined;
  try {
    const value = JSON.parse(raw) as Partial<Clearance>;
    if (
      (typeof value.cfClearance === "string" || value.cfClearance === null) &&
      typeof value.userAgent === "string" &&
      typeof value.expiresAt === "number"
    ) {
      return {
        cfClearance: value.cfClearance,
        userAgent: value.userAgent,
        expiresAt: value.expiresAt,
      };
    }
  } catch {
    // Valor corrupto: cuenta como ausente.
  }
  return undefined;
}

export function createSecureClearanceStore(secure: SecureStoreLike): ClearanceStore {
  return {
    async get(host) {
      try {
        return parse(await secure.getItemAsync(keyOf(host)));
      } catch {
        return undefined;
      }
    },
    set: (host, clearance) => secure.setItemAsync(keyOf(host), JSON.stringify(clearance)),
    delete: (host) => secure.deleteItemAsync(keyOf(host)),
  };
}
