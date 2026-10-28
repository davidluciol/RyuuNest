import { ModuleError } from "@ryuunest/core";

import type { SettingsData, SettingsService } from "./settingsData";

/**
 * F16b — `SettingsService` en memoria para la web (sin SQLite, P-79) y la
 * galería. En web no hay bloqueo del dispositivo (SPEC §5.3): activar la
 * protección falla igual que en el núcleo. La galería puede montar el estado
 * con bloqueo para enseñar el interruptor activable.
 */

export function createSampleSettingsService(
  initial: Partial<SettingsData> = {},
): SettingsService {
  let state: SettingsData = {
    installProtection: false,
    lockAvailable: false,
    officialRepoRegistered: true,
    ...initial,
  };

  return {
    async load() {
      return { ...state };
    },

    async setInstallProtection(on) {
      if (on && !state.lockAvailable) {
        throw new ModuleError(
          "UNSUPPORTED",
          "Este dispositivo no tiene bloqueo configurado y la protección no se puede activar",
        );
      }
      state = { ...state, installProtection: on };
    },

    async restoreOfficialRepo() {
      state = { ...state, officialRepoRegistered: true };
    },
  };
}
