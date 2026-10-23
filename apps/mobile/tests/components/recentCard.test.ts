import { describe, expect, it } from "vitest";

import {
  RECENT_CARD_WIDTH,
  recentCardColors,
  recentCardStyle,
} from "../../src/components/recentCardStyles";

/**
 * F13 — tarjeta de portada para la fila horizontal "Lecturas Recientes"
 * (SPEC §11.10, RF-41, T7): ancho fijo para carrusel, portada 2:3 con badge
 * de tipo y barra de progreso, título a **dos líneas** (sin «…», T7) y
 * metadatos de capítulo debajo. Sin contador de no leídos (RF-42, v2).
 */
describe("recentCardStyle (tarjeta de recientes)", () => {
  it("ancho fijo para carrusel horizontal (128 px)", () => {
    expect(RECENT_CARD_WIDTH).toBe(128);
    expect(recentCardStyle().width).toBe(128);
  });

  it("portada 2:3, radio 12, borde border, fondo surface", () => {
    const style = recentCardStyle();
    expect(style.coverAspectRatio).toBe(2 / 3);
    expect(style.coverBorderRadius).toBe(12);
    expect(style.coverBorderWidth).toBe(1);
    expect(style.coverBorderColor).toBe("#263147");
    expect(style.coverBackgroundColor).toBe("#141923");
  });

  it("separación entre portada y texto de 8 px, y entre título y metadatos de 4 px", () => {
    const style = recentCardStyle();
    expect(style.gapCoverText).toBe(8);
    expect(style.gapTextMeta).toBe(4);
  });

  it("título limitado a 2 líneas (T7: sin «…»)", () => {
    expect(recentCardStyle().titleMaxLines).toBe(2);
  });
});

describe("recentCardColors (paleta)", () => {
  it("título en text-primary, metadatos en text-secondary", () => {
    const colors = recentCardColors();
    expect(colors.title).toBe("#F2F0EA");
    expect(colors.meta).toBe("#9BA5B5");
  });

  it("capítulo en curso en progress (RF-41, V1)", () => {
    const colors = recentCardColors();
    expect(colors.chapterInProgress).toBe("#FF9F43");
  });

  it("barra de progreso en progress (RF-41)", () => {
    const colors = recentCardColors();
    expect(colors.progressBar).toBe("#FF9F43");
  });
});
