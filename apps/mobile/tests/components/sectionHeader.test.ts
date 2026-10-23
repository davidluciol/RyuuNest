import { describe, expect, it } from "vitest";

import {
  SECTION_HEADER_MIN_HEIGHT,
  sectionHeaderColors,
  sectionHeaderStyle,
} from "../../src/components/sectionHeaderStyles";

/**
 * F13 — encabezado de sección (SPEC §11.10, `DESIGN_RULES.md` V1/V4):
 * icono opcional a la izquierda, título en `title-lg`, acción secundaria
 * a la derecha ("Ver todas" en `text-primary` con chevron). Sin colores
 * de acento en el título ni en la acción secundaria (V1).
 */
describe("sectionHeaderStyle (encabezado de sección)", () => {
  it("alto mínimo de área táctil cuando hay acción (48 dp, RNF-7)", () => {
    expect(SECTION_HEADER_MIN_HEIGHT).toBe(48);
    expect(sectionHeaderStyle().minHeight).toBe(48);
  });

  it("relleno horizontal de 16 px (mismo que filas y cabecera)", () => {
    expect(sectionHeaderStyle().paddingHorizontal).toBe(16);
  });

  it("separación interna entre icono, título y acción (12 px)", () => {
    expect(sectionHeaderStyle().gap).toBe(12);
  });
});

describe("sectionHeaderColors (paleta, V1)", () => {
  it("título en text-primary, icono en text-secondary", () => {
    const colors = sectionHeaderColors();
    expect(colors.title).toBe("#F2F0EA");
    expect(colors.icon).toBe("#9BA5B5");
  });

  it("acción secundaria en text-primary con chevron (no en accent, V1)", () => {
    const colors = sectionHeaderColors();
    expect(colors.action).toBe("#F2F0EA");
    expect(colors.action).not.toBe("#35C98A");
  });
});
