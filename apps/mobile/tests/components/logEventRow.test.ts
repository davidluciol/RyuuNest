import { dragonNightColors, radii, spacing } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import {
  logEventDetailBoxStyle,
  logEventRowStyle,
  logEventToneColor,
  LOG_EVENT_ICON_SIZE,
} from "../../src/components/logEventRowStyles";

/**
 * F30 — fila de evento del registro de diagnóstico (FB2). Reglas puras:
 * el tono fija el color del icono y del nivel (nunca la única señal: el nivel
 * también va en texto) y el detalle usa la caja de nivel 0 con borde.
 */

describe("logEventToneColor", () => {
  it("error, aviso y neutro usan los colores semánticos del tema", () => {
    expect(logEventToneColor("error")).toBe(dragonNightColors.error);
    expect(logEventToneColor("warning")).toBe(dragonNightColors.warning);
    expect(logEventToneColor("neutral")).toBe(dragonNightColors.textSecondary);
  });
});

describe("logEventRowStyle", () => {
  it("la fila va en nivel surface con relleno de 16 × 12 y separación de 12", () => {
    expect(logEventRowStyle()).toMatchObject({
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    });
  });

  it("el icono es de 24 px (tamaño estándar de icono)", () => {
    expect(LOG_EVENT_ICON_SIZE).toBe(24);
  });
});

describe("logEventDetailBoxStyle", () => {
  it("caja de nivel 0 con borde, radio de control y relleno sm", () => {
    expect(logEventDetailBoxStyle()).toMatchObject({
      backgroundColor: dragonNightColors.bg,
      borderColor: dragonNightColors.border,
      borderWidth: 1,
      borderRadius: radii.control,
      padding: spacing.sm,
    });
  });
});
