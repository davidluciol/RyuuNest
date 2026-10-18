import { describe, expect, it } from "vitest";

import {
  BUTTON_MIN_HEIGHT,
  type ButtonVariant,
  buttonColors,
  buttonStyle,
  buttonTextColor,
} from "../../src/components/buttonStyles";

/**
 * F06 — botón primario/secundario/destructivo (SPEC §11.10). Reglas de color
 * y forma que luego monta el componente `Button`. La contraste de cada par
 * ya lo cubre la puerta AA de `ui-tokens` (F02); aquí se fija la elección
 * de tokens por variante y estado.
 */
describe("buttonStyle (variantes, SPEC §11.10)", () => {
  it("primario: 48 px de alto, radio 8, relleno accent", () => {
    expect(buttonStyle("primary")).toMatchObject({
      height: BUTTON_MIN_HEIGHT,
      borderRadius: 8,
      backgroundColor: "#35C98A",
      borderWidth: 0,
    });
  });

  it("secundario: relleno elevated, borde border", () => {
    expect(buttonStyle("secondary")).toMatchObject({
      backgroundColor: "#1B2230",
      borderColor: "#263147",
      borderWidth: 1,
    });
  });

  it("destructivo: borde y texto error, sin relleno", () => {
    expect(buttonStyle("destructive")).toMatchObject({
      backgroundColor: "transparent",
      borderColor: "#F06A6A",
      borderWidth: 1,
    });
  });

  it("el relleno accent/progress lleva texto bg (inversión, SPEC §11.9)", () => {
    expect(buttonTextColor("primary")).toBe("#0B0E14");
    expect(buttonTextColor("secondary")).toBe("#F2F0EA");
    expect(buttonTextColor("destructive")).toBe("#F06A6A");
  });

  it("el estado presionado del secundario aplica capa accent al 10 % (SPEC §11.10)", () => {
    const pressed = buttonStyle("secondary", { pressed: true });
    expect(pressed.backgroundColor).toBe("rgba(53, 201, 138, 0.1)");
  });

  it("deshabilitado baja la opacidad y no cambia el color de fondo", () => {
    const normal = buttonStyle("primary");
    const disabled = buttonStyle("primary", { disabled: true });
    expect(disabled.opacity).toBeLessThan(1);
    expect(disabled.backgroundColor).toBe(normal.backgroundColor);
  });

  it("buttonColors expone los pares para la puerta de contraste", () => {
    const variants: ButtonVariant[] = ["primary", "secondary", "destructive"];
    for (const variant of variants) {
      const pair = buttonColors(variant);
      expect(pair.bg).toBeTruthy();
      expect(pair.text).toBeTruthy();
    }
  });
});
