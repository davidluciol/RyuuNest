import { ModuleError } from "@ryuunest/core";

import {
  DEFAULT_LANGUAGE,
  DEFAULT_READER_MODE,
  type SettingsData,
  type SettingsListener,
  type SettingsService,
} from "./settingsData";

/**
 * F16b — `SettingsService` en memoria para la web (sin SQLite, P-79) y la
 * galería. En web no hay bloqueo del dispositivo (SPEC §5.3): activar la
 * protección falla igual que en el núcleo. La galería puede montar el estado
 * con bloqueo para enseñar el interruptor activable.
 */

export function createSampleSettingsService(initial: Partial<SettingsData> = {}): SettingsService {
  let state: SettingsData = {
    installProtection: false,
    lockAvailable: false,
    officialRepoRegistered: true,
    nsfwVisible: false,
    language: DEFAULT_LANGUAGE,
    defaultReaderMode: DEFAULT_READER_MODE,
    ...initial,
  };
  const listeners = new Set<SettingsListener>();

  function notify(): void {
    for (const listener of listeners) listener();
  }

  return {
    async load() {
      return { ...state };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async setInstallProtection(on) {
      if (on && !state.lockAvailable) {
        throw new ModuleError(
          "UNSUPPORTED",
          "Este dispositivo no tiene bloqueo configurado y la protección no se puede activar",
        );
      }
      state = { ...state, installProtection: on };
      notify();
    },

    async setNsfwVisible(on) {
      state = { ...state, nsfwVisible: on };
      notify();
    },

    async setDefaultReaderMode(mode) {
      state = { ...state, defaultReaderMode: mode };
      notify();
    },

    async clearCache() {},

    async restoreOfficialRepo() {
      state = { ...state, officialRepoRegistered: true };
      notify();
    },
  };
}
