import { describe, expect, it } from "vitest";

import {
  CHECKBOX_SIZE,
  checkboxStyle,
  radioStyle,
  textFieldColors,
  textFieldStyle,
} from "../../src/components/fieldStyles";

/**
 * F06 — campo de texto/búsqueda y casilla/radio (SPEC §11.10, `DESIGN.md`).
 * Campo: surface, borde border, 48 px, radio 8; en foco borde accent sin brillo.
 * Casilla/radio: 20×20, borde 1,5 px; marcado con relleno accent y glifo bg.
 */
describe("textFieldStyle (campo de texto, 48 px)", () => {
  it("reposo: surface, borde border, radio 8", () => {
    expect(textFieldStyle()).toMatchObject({
      height: 48,
      backgroundColor: "#141923",
      borderColor: "#263147",
      borderWidth: 1,
      borderRadius: 8,
    });
  });

  it("en foco: borde accent sin brillo", () => {
    expect(textFieldStyle({ focused: true }).borderColor).toBe("#35C98A");
    expect(textFieldColors({ focused: true })).toEqual({
      bg: "#141923",
      border: "#35C98A",
      text: "#F2F0EA",
      placeholder: "#9BA5B5",
    });
  });
});

describe("checkboxStyle / radioStyle (20×20)", () => {
  it("casilla sin marcar: 20×20, borde 1,5 px border, radio 4", () => {
    expect(checkboxStyle(false)).toMatchObject({
      width: CHECKBOX_SIZE,
      height: CHECKBOX_SIZE,
      borderWidth: 1.5,
      borderColor: "#263147",
      borderRadius: 4,
      backgroundColor: "transparent",
    });
    expect(CHECKBOX_SIZE).toBe(20);
  });

  it("casilla marcada: relleno accent y borde accent (glifo bg lo pone el icono)", () => {
    expect(checkboxStyle(true)).toMatchObject({
      backgroundColor: "#35C98A",
      borderColor: "#35C98A",
    });
  });

  it("radio es círculo completo; marcado con relleno accent", () => {
    expect(radioStyle(false).borderRadius).toBe(9999);
    expect(radioStyle(true)).toMatchObject({
      backgroundColor: "#35C98A",
      borderColor: "#35C98A",
      borderRadius: 9999,
    });
  });
});
