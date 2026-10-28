import {
  DEFAULT_LANGUAGE,
  DEFAULT_READER_MODE,
  type SettingsData,
} from "./settingsData";

/**
 * F16b — datos de ejemplo de Ajustes para la galería y Playwright en web
 * (galería y D1–D5). El estado normal lleva bloqueo y repo oficial; hay
 * variantes para el aviso de sin bloqueo y para la fila de restaurar.
 */

/** Estado normal: hay bloqueo y el repo oficial está registrado. */
export const SAMPLE_SETTINGS_DATA: SettingsData = {
  installProtection: false,
  lockAvailable: true,
  officialRepoRegistered: true,
  nsfwVisible: false,
  language: DEFAULT_LANGUAGE,
  defaultReaderMode: DEFAULT_READER_MODE,
};

/** Sin bloqueo en el dispositivo: el interruptor no se puede activar (RF-7). */
export const NO_LOCK_SETTINGS_DATA: SettingsData = {
  installProtection: false,
  lockAvailable: false,
  officialRepoRegistered: true,
  nsfwVisible: false,
  language: DEFAULT_LANGUAGE,
  defaultReaderMode: DEFAULT_READER_MODE,
};

/** El usuario quitó el repo oficial: Ajustes ofrece restaurarlo (P-85). */
export const OFFICIAL_DISMISSED_SETTINGS_DATA: SettingsData = {
  installProtection: true,
  lockAvailable: true,
  officialRepoRegistered: false,
  nsfwVisible: false,
  language: DEFAULT_LANGUAGE,
  defaultReaderMode: DEFAULT_READER_MODE,
};
