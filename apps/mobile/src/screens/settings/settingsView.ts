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

export function installProtectionHintKey(
  lockAvailable: boolean,
): (typeof INSTALL_PROTECTION_HINT_KEYS)["withLock" | "noLock"] {
  return lockAvailable
    ? INSTALL_PROTECTION_HINT_KEYS.withLock
    : INSTALL_PROTECTION_HINT_KEYS.noLock;
}
