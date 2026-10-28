import {
  ModuleError,
  RepoRegistry,
  SqliteStorage,
  type Clock,
  type Http,
  type SecureLock,
  type SqlDriver,
} from "@ryuunest/core";
import { validateRepoIndex } from "@ryuunest/module-sdk";

import {
  OFFICIAL_REPO_DISMISSAL_SETTING,
  OFFICIAL_REPO_URL,
} from "../../data/officialRepo";
import { INSTALL_PROTECTION_SETTING } from "../sources/sourcesData";

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
}

export interface SettingsService {
  load(): Promise<SettingsData>;
  /** Escribe `security.installProtection`; activarlo sin bloqueo falla cerrado. */
  setInstallProtection(on: boolean): Promise<void>;
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

  async function readFlag(key: string): Promise<boolean> {
    const row = await driver.get<{ value: string }>("SELECT value FROM setting WHERE key = ?", [
      key,
    ]);
    return row?.value === "true";
  }

  return {
    async load() {
      return {
        installProtection: await readFlag(INSTALL_PROTECTION_SETTING),
        lockAvailable: await secureLock.isAvailable(),
        officialRepoRegistered: (await repos.getRepo(OFFICIAL_REPO_URL)) !== undefined,
      };
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
      await driver.run("INSERT OR REPLACE INTO setting (key, value) VALUES (?, ?)", [
        INSTALL_PROTECTION_SETTING,
        on ? "true" : "false",
      ]);
    },

    async restoreOfficialRepo() {
      // Primera parte (P-85): no pide el bloqueo, igual que el auto-registro.
      await repos.addRepo(OFFICIAL_REPO_URL);
      await driver.run("DELETE FROM setting WHERE key = ?", [OFFICIAL_REPO_DISMISSAL_SETTING]);
    },
  };
}
