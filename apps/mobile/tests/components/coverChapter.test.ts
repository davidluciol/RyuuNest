import { describe, expect, it } from "vitest";

import {
  CHAPTER_ROW_MIN_HEIGHT,
  type ChapterState,
  chapterRowColors,
  chapterRowStyle,
  chapterSignals,
} from "../../src/components/chapterRowStyles";
import {
  coverCardStyle,
  PROGRESS_BAR_HEIGHT,
  progressBarStyle,
} from "../../src/components/coverCardStyles";

/**
 * F07 — tarjeta de portada y fila de capítulo (SPEC §11.10, RF-41, V8).
 * Tarjeta: 2:3, radio 12, borde border, barra de progreso de 3 px, sin contador
 * de no leídos. Fila: 3 estados, máximo dos señales por estado (V8), leído se
 * atenúa y lleva ✓ (no se tacha).
 */
describe("coverCardStyle (tarjeta de portada)", () => {
  it("2:3, radio 12, borde border, fondo surface", () => {
    expect(coverCardStyle()).toMatchObject({
      aspectRatio: 2 / 3,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#263147",
      backgroundColor: "#141923",
    });
  });

  it("barra de progreso de 3 px en progress cuando hay avance (RF-41)", () => {
    expect(PROGRESS_BAR_HEIGHT).toBe(3);
    expect(progressBarStyle(0.42)).toMatchObject({ height: 3, backgroundColor: "#FF9F43" });
    expect(progressBarStyle(0.42).width).toBe("42%");
  });

  it("sin avance no hay barra visible", () => {
    expect(progressBarStyle(0).width).toBe("0%");
  });
});

describe("chapterRowStyle (fila de capítulo, 3 estados)", () => {
  it("alto mínimo 56 px y relleno horizontal 16", () => {
    expect(CHAPTER_ROW_MIN_HEIGHT).toBe(56);
    expect(chapterRowStyle("unread")).toMatchObject({ minHeight: 56, paddingHorizontal: 16 });
  });

  it("sin leer: texto principal; en curso: progress; completado: text-secondary", () => {
    expect(chapterRowColors("unread").text).toBe("#F2F0EA");
    expect(chapterRowColors("in-progress").accent).toBe("#FF9F43");
    expect(chapterRowColors("completed").text).toBe("#9BA5B5");
  });

  it("máximo dos señales por estado (V8): leído atenuado + ✓, no tachado", () => {
    const states: ChapterState[] = ["unread", "in-progress", "completed"];
    for (const state of states) {
      expect(chapterSignals(state).length).toBeLessThanOrEqual(2);
    }
    expect(chapterSignals("completed")).toEqual(["atenuado", "marca"]);
    expect(chapterSignals("completed")).not.toContain("tachado");
    expect(chapterSignals("in-progress")).toEqual(["marcador", "porcentaje"]);
    expect(chapterSignals("unread")).toEqual([]);
  });
});
