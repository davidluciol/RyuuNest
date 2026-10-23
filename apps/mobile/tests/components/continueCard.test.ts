import { describe, expect, it } from "vitest";

import {
  CONTINUE_CARD_COVER_WIDTH,
  continueCardColors,
  continueCardStyle,
} from "../../src/components/continueCardStyles";

/**
 * F13 — tarjeta hero "Continuar la Aventura" (SPEC §11.10, RF-14, RF-41):
 * portada grande a la izquierda con badge de tipo y barra de progreso,
 * contenido a la derecha con título, capítulo, progreso y botón primario.
 * Fondo `surface`, radio 12, borde `border`, sin sombra (RNF-12).
 */
describe("continueCardStyle (tarjeta hero)", () => {
  it("fondo surface, radio 12, borde border, sin sombra", () => {
    const style = continueCardStyle();
    expect(style.backgroundColor).toBe("#141923");
    expect(style.borderRadius).toBe(12);
    expect(style.borderWidth).toBe(1);
    expect(style.borderColor).toBe("#263147");
    expect(style.elevation).toBe(0);
    expect(style.shadowOpacity).toBe(0);
  });

  it("relleno interno de 16 px y separación de 16 px entre portada y contenido", () => {
    const style = continueCardStyle();
    expect(style.padding).toBe(16);
    expect(style.gap).toBe(16);
  });

  it("portada de 96 px de ancho (relación 2:3 → 144 px de alto)", () => {
    expect(CONTINUE_CARD_COVER_WIDTH).toBe(96);
  });
});

describe("continueCardColors (paleta)", () => {
  it("título en text-primary, metadatos en text-secondary", () => {
    const colors = continueCardColors();
    expect(colors.title).toBe("#F2F0EA");
    expect(colors.meta).toBe("#9BA5B5");
  });

  it("capítulo en curso en progress (RF-41, V1)", () => {
    const colors = continueCardColors();
    expect(colors.progress).toBe("#FF9F43");
  });

  it("botón primario: texto en bg (inversión sobre accent)", () => {
    const colors = continueCardColors();
    expect(colors.buttonText).toBe("#0B0E14");
    expect(colors.buttonBg).toBe("#35C98A");
  });
});
