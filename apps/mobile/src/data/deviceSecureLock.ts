import type { SecureLock } from "@ryuunest/core";

/**
 * F16 (RF-7) — `SecureLock` (SPEC §5.3) sobre `expo-local-authentication`.
 * La librería se inyecta para probar el mapeo sin dispositivo; la selección
 * por plataforma vive en `secureLock.ts` / `secureLock.native.ts`.
 */

/** `SecurityLevel.NONE` de expo-local-authentication: sin bloqueo enrolado. */
const SECURITY_LEVEL_NONE = 0;

/** Lo que usamos de `expo-local-authentication`. */
export interface LocalAuthLike {
  hasHardwareAsync: () => Promise<boolean>;
  getEnrolledLevelAsync: () => Promise<number>;
  authenticateAsync: (options?: {
    promptMessage?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

export function createDeviceSecureLock(auth: LocalAuthLike): SecureLock {
  return {
    async isAvailable() {
      try {
        return (await auth.getEnrolledLevelAsync()) !== SECURITY_LEVEL_NONE;
      } catch {
        return false;
      }
    },
    async authenticate(reason: string) {
      try {
        const result = await auth.authenticateAsync({ promptMessage: reason });
        return result.success;
      } catch {
        return false;
      }
    },
  };
}
