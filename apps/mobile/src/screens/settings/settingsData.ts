import {
  ModuleError,
  RepoRegistry,
  SqliteStorage,
  type Clock,
  type Http,
  type ReaderMode,
  type SecureLock,
  type SqlDriver,
} from "@ryuunest/core";
import { validateRepoIndex } from "@ryuunest/module-sdk";

import {
  OFFICIAL_REPO_DISMISSAL_SETTING,
  OFFICIAL_REPO_URL,
} from "../../data/officialRepo";
import { INSTALL_PROTECTION_SETTING } from "../sources/sourcesData";

/** Ajustes globales persistentes de F20 (SPEC §8.1, RF-34 y RF-39). */
export const CONTENT_VISIBLE_SETTING = "settings.nsfwVisible";
export const LANGUAGE_SETTING = "settings.language";
export const DEFAULT_READER_MODE_SETTING = "settings.defaultReaderMode";

export const DEFAULT_LANGUAGE = "es" as const;
export const DEFAULT_READER_MODE: ReaderMode = "vertical";

const READER_MODES: readonly ReaderMode[] = ["vertical", "paged-rtl", "paged-ltr"];

export interface SettingsListener {
  (): void;
}

/**
 * F16b — capa de datos de Ajustes. El contenido de la pantalla es cosa de F20;
 * esto nace del interruptor de «Protección de instalación» (RF-7) y del botón
 * de restaurar el repo oficial (P-85). La pantalla no importa el núcleo:
 * habla con `SettingsService` (patrón de F14c, F15b y F16).
 */

export interface SettingsData {
  /** Ajuste `security.installProtection` (RF-7), apagado por defecto. */
  installProtection: boolean;
  /** El dispositivo tiene PIN o biometría: sin esto el interruptor no se activa. */
  lockAvailable: boolean;
  /** El repo oficial está registrado (si no, Ajustes ofrece restaurarlo, P-85). */
  officialRepoRegistered: boolean;
  /** Mostrar obras NSFW en Biblioteca y Descubrir; apagado por defecto. */
  nsfwVisible: boolean;
  /** Idioma disponible en la v1; se persiste para preparar futuras traducciones. */
  language: typeof DEFAULT_LANGUAGE;
  /** Modo global cuando la serie no tiene preferencia ni tipo que lo determine. */
  defaultReaderMode: ReaderMode;
}

export interface SettingsService {
  load(): Promise<SettingsData>;
  subscribe(listener: SettingsListener): () => void;
  /** Escribe `security.installProtection`; activarlo sin bloqueo falla cerrado. */
  setInstallProtection(on: boolean): Promise<void>;
  setNsfwVisible(on: boolean): Promise<void>;
  setDefaultReaderMode(mode: ReaderMode): Promise<void>;
  /** Vuelve a registrar el repo oficial y limpia el descarte (P-85). */
  restoreOfficialRepo(): Promise<void>;
}

export interface SettingsServiceDeps {
  driver: SqlDriver;
  http: Http;
  clock: Clock;
  secureLock: SecureLock;
}

export function createSettingsService(deps: SettingsServiceDeps): SettingsService {
  const { driver, http, clock, secureLock } = deps;
  const storage = new SqliteStorage(driver);
  const repos = new RepoRegistry({ storage, http, clock, validateIndex: validateRepoIndex });
  const listeners = new Set<SettingsListener>();

  async function readFlag(key: string): Promise<boolean> {
    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      key,
    ]);
    return row?.value === "true";
  }

  async function readReaderMode(): Promise<ReaderMode> {
    const row = await driver.get<{ value: string }>(
      "SELECT value FROM setting WHERE key = ?",
      [DEFAULT_READER_MODE_SETTING],
    );
    if (row === undefined) return DEFAULT_READER_MODE;
    if (!READER_MODES.includes(row.value as ReaderMode)) {
      throw new ModuleError("PARSE", `Preferencia de lectura inválida en los ajustes: ${row.value}`);
    }
    return row.value as ReaderMode;
  }

  async function writeSetting(key: string, value: string): Promise<void> {
    await driver.run(
      "INSERT INTO setting (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
      [key, value],
    );
  }

  function notify(): void {
    for (const listener of listeners) listener();
  }

  return {
    async load() {
      return {
        installProtection: await readFlag(INSTALL_PROTECTION_SETTING),
        lockAvailable: await secureLock.isAvailable(),
        officialRepoRegistered: (await repos.getRepo(OFFICIAL_REPO_URL)) !== undefined,
        nsfwVisible: await readFlag(CONTENT_VISIBLE_SETTING),
        language: DEFAULT_LANGUAGE,
        defaultReaderMode: await readReaderMode(),
      };
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    async setInstallProtection(on) {
      if (on && !(await secureLock.isAvailable())) {
        // F16b: sin bloqueo no se deja activar (la fila avisa y deshabilita);
        // si algo llega aquí igual, falla cerrado como el resto de RF-7.
        throw new ModuleError(
          "UNSUPPORTED",
          "Este dispositivo no tiene bloqueo configurado y la protección no se puede activar",
        );
      }
      await writeSetting(INSTALL_PROTECTION_SETTING, on ? "true" : "false");
      notify();
    },

    async setNsfwVisible(on) {
      await writeSetting(CONTENT_VISIBLE_SETTING, on ? "true" : "false");
      notify();
    },

    async setDefaultReaderMode(mode) {
      if (!READER_MODES.includes(mode)) {
        throw new ModuleError("INTERNAL", `Preferencia de lectura inválida: ${String(mode)}`);
      }
      await writeSetting(DEFAULT_READER_MODE_SETTING, mode);
      notify();
    },

    async restoreOfficialRepo() {
      // Primera parte (P-85): no pide el bloqueo, igual que el auto-registro.
      await repos.addRepo(OFFICIAL_REPO_URL);
      await driver.run("DELETE FROM setting WHERE key = ?", [OFFICIAL_REPO_DISMISSAL_SETTING]);
      notify();
    },
  };
}
