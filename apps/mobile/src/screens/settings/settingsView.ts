/**
 * F16b — lógica de vista de Ajustes: qué texto secundario lleva la fila de
 * «Protección de instalación» según el dispositivo tenga bloqueo (RF-7).
 * Claves de traducción, sin cadenas literales (RF-40).
 */

/** Clave del texto secundario de la fila según haya bloqueo en el dispositivo. */
export const INSTALL_PROTECTION_HINT_KEYS = {
  withLock: "settings.security.installProtection.hint",
  noLock: "settings.security.installProtection.noLock",
} as const;

/** Opciones visibles del ajuste global (RF-18/RF-39), sin duplicar copy. */
export const READER_MODE_OPTIONS: readonly {
  mode: ReaderMode;
  labelKey: string;
  hintKey: string;
}[] = [
  {
    mode: "vertical",
    labelKey: "reader.mode.vertical",
    hintKey: "reader.mode.vertical.hint",
  },
  {
    mode: "paged-rtl",
    labelKey: "reader.mode.pagedRtl",
    hintKey: "reader.mode.pagedRtl.hint",
  },
  {
    mode: "paged-ltr",
    labelKey: "reader.mode.pagedLtr",
    hintKey: "reader.mode.pagedLtr.hint",
  },
];

export function installProtectionHintKey(
  lockAvailable: boolean,
): (typeof INSTALL_PROTECTION_HINT_KEYS)["withLock" | "noLock"] {
  return lockAvailable
    ? INSTALL_PROTECTION_HINT_KEYS.withLock
    : INSTALL_PROTECTION_HINT_KEYS.noLock;
}
import type { ReaderMode } from "@ryuunest/core";
