import { describe, expect, it } from "vitest";

import { createDeviceSecureLock, type LocalAuthLike } from "../../src/data/deviceSecureLock";

/**
 * F16 (RF-7) — `SecureLock` del dispositivo sobre `expo-local-authentication`.
 * La librería nativa se inyecta: aquí se prueba el mapeo, no el sistema.
 */

function fakeAuth(overrides: Partial<LocalAuthLike> = {}): LocalAuthLike & { prompts: string[] } {
  const prompts: string[] = [];
  return {
    prompts,
    hasHardwareAsync: async () => true,
    getEnrolledLevelAsync: async () => 1,
    authenticateAsync: async (options) => {
      prompts.push(options?.promptMessage ?? "");
      return { success: true };
    },
    ...overrides,
  };
}

describe("createDeviceSecureLock", () => {
  it("está disponible si hay un bloqueo enrolado (PIN, patrón o biometría)", async () => {
    const lock = createDeviceSecureLock(fakeAuth({ getEnrolledLevelAsync: async () => 1 }));

    expect(await lock.isAvailable()).toBe(true);
  });

  it("no está disponible si el dispositivo no tiene ningún bloqueo configurado", async () => {
    const lock = createDeviceSecureLock(fakeAuth({ getEnrolledLevelAsync: async () => 0 }));

    expect(await lock.isAvailable()).toBe(false);
  });

  it("no está disponible si la librería falla (no rompe la instalación)", async () => {
    const lock = createDeviceSecureLock(
      fakeAuth({
        getEnrolledLevelAsync: async () => {
          throw new Error("módulo nativo ausente");
        },
      }),
    );

    expect(await lock.isAvailable()).toBe(false);
  });

  it("autentica con el motivo como mensaje y devuelve true si el usuario lo consigue", async () => {
    const auth = fakeAuth();
    const lock = createDeviceSecureLock(auth);

    expect(await lock.authenticate("Confirma para instalar")).toBe(true);
    expect(auth.prompts).toEqual(["Confirma para instalar"]);
  });

  it("devuelve false si el usuario cancela o falla", async () => {
    const lock = createDeviceSecureLock(
      fakeAuth({ authenticateAsync: async () => ({ success: false, error: "user_cancel" }) }),
    );

    expect(await lock.authenticate("motivo")).toBe(false);
  });

  it("devuelve false si la autenticación lanza", async () => {
    const lock = createDeviceSecureLock(
      fakeAuth({
        authenticateAsync: async () => {
          throw new Error("boom");
        },
      }),
    );

    expect(await lock.authenticate("motivo")).toBe(false);
  });
});
