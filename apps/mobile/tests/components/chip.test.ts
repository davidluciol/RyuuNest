import { describe, expect, it } from "vitest";

import { CHIP_HEIGHT, chipColors, chipStyle } from "../../src/components/chipStyles";
import { BADGE_HEIGHT, badgeColors, badgeStyle } from "../../src/components/badgeStyles";

/**
 * F06 — chip de filtro (36 px, pill) e insignia de tipo/estado (24 px, neutra).
 * SPEC §11.10 y `DESIGN.md`. La insignia es **neutra** (elevated/text-secondary)
 * según `DESIGN_RULES.md` V1: gana la regla sobre el esmeralda del diseño.
 */
describe("chipStyle (chip de filtro, 36 px pill)", () => {
  it("inactivo: surface, borde border, texto text-secondary", () => {
    expect(chipStyle(false)).toMatchObject({
      height: CHIP_HEIGHT,
      backgroundColor: "#141923",
      borderColor: "#263147",
      borderWidth: 1,
    });
    expect(CHIP_HEIGHT).toBe(36);
    expect(chipColors(false)).toEqual({ bg: "#141923", text: "#9BA5B5", border: "#263147" });
  });

  it("seleccionado: badge-bg, borde y texto accent", () => {
    expect(chipStyle(true)).toMatchObject({
      backgroundColor: "#1C2E29",
      borderColor: "#35C98A",
    });
    expect(chipColors(true)).toEqual({ bg: "#1C2E29", text: "#35C98A", border: "#35C98A" });
  });

  it("es pill (radio completo)", () => {
    expect(chipStyle(false).borderRadius).toBe(9999);
  });
});

describe("badgeStyle (insignia neutra, 24 px pill)", () => {
  it("fondo elevated y texto text-secondary (neutra, V1)", () => {
    expect(badgeStyle()).toMatchObject({
      height: BADGE_HEIGHT,
      backgroundColor: "#1B2230",
      borderRadius: 9999,
    });
    expect(BADGE_HEIGHT).toBe(24);
    expect(badgeColors()).toEqual({ bg: "#1B2230", text: "#9BA5B5" });
  });
});
