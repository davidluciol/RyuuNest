import { touchTarget } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import {
  SETTINGS_ROW_MIN_HEIGHT,
  SETTINGS_ROW_STACK_BELOW,
  settingsRowLayout,
} from "../../src/components/sheetStyles";
import { t } from "../../src/i18n";

/**
 * F34.2 — filas de Ajustes: la fila mide ≥ 56 dp, el control se apila bajo el
 * texto en anchos estrechos (< 400 dp, para que la etiqueta no se aplaste a 3
 * líneas) y los botones llevan un verbo corto en vez de repetir la etiqueta.
 */
describe("settingsRowLayout", () => {
  it("apila el control bajo el texto por debajo de 400 dp", () => {
    expect(SETTINGS_ROW_STACK_BELOW).toBe(400);
    expect(settingsRowLayout(399)).toBe("stacked");
    expect(settingsRowLayout(360)).toBe("stacked");
  });

  it("deja el control a la derecha desde 400 dp", () => {
    expect(settingsRowLayout(400)).toBe("inline");
    expect(settingsRowLayout(1440)).toBe("inline");
  });

  it("la fila mide al menos 56 dp y supera el área táctil mínima", () => {
    expect(SETTINGS_ROW_MIN_HEIGHT).toBeGreaterThanOrEqual(56);
    expect(SETTINGS_ROW_MIN_HEIGHT).toBeGreaterThanOrEqual(touchTarget.min);
  });
});

describe("verbos cortos de los botones de Ajustes", () => {
  it("existen en el catálogo y no repiten la etiqueta de la fila", () => {
    expect(t("settings.backup.exportAction")).toBe("Exportar");
    expect(t("settings.backup.importAction")).toBe("Importar");
    expect(t("settings.cache.clearAction")).toBe("Vaciar");
    expect(t("settings.backup.exportAction")).not.toBe(t("settings.backup.export"));
  });
});
