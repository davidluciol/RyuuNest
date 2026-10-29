import { describe, expect, it } from "vitest";

import {
  installProtectionHintKey,
  READER_MODE_OPTIONS,
} from "../../src/screens/settings/settingsView";

/**
 * F16b — la fila de protección elige su texto secundario según haya bloqueo en
 * el dispositivo: sin bloqueo avisa en la fila en vez de quedar activable sin
 * efecto (tarea F16b, RF-7).
 */
describe("installProtectionHintKey (fila de protección, F16b)", () => {
  it("con bloqueo describe la protección; sin bloqueo avisa de que no se puede activar", () => {
    expect(installProtectionHintKey(true)).toBe("settings.security.installProtection.hint");
    expect(installProtectionHintKey(false)).toBe("settings.security.installProtection.noLock");
  });
});

describe("opciones de modo global de lectura (F20, RF-39)", () => {
  it("expone los tres modos del contrato en el orden de la interfaz", () => {
    expect(READER_MODE_OPTIONS.map((option) => option.mode)).toEqual([
      "vertical",
      "paged-rtl",
      "paged-ltr",
    ]);
  });
});
