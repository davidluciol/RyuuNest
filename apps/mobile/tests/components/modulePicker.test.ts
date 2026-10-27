import { describe, expect, it } from "vitest";

import {
  modulePickerRowStyle,
  modulePickerRowTextStyle,
  modulePickerTitleStyle,
} from "../../src/components/modulePickerStyles";

/**
 * F15 — estilos puros del selector de módulo: filas con área táctil de 48 dp
 * (RNF-7), nombres en `text-primary` y título en `text-secondary`.
 */
describe("modulePickerStyles", () => {
  it("la fila mide 48 dp como mínimo y separa el check del nombre", () => {
    expect(modulePickerRowStyle()).toMatchObject({ minHeight: 48, gap: 12 });
  });

  it("el nombre del módulo va en texto principal", () => {
    expect(modulePickerRowTextStyle().color).toBe("#F2F0EA");
  });

  it("el título de la hoja va en texto secundario", () => {
    expect(modulePickerTitleStyle().color).toBe("#9BA5B5");
  });
});
