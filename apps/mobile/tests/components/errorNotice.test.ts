import { describe, expect, it } from "vitest";

import {
  bannerActionMinHeight,
  bannerCodeStyle,
  bannerMessageStyle,
  bannerStyle,
  bannerTitleStyle,
  dialogBackdropStyle,
  dialogDetailBoxStyle,
  dialogDetailTextStyle,
  dialogMessageStyle,
  dialogStyle,
  dialogTitleStyle,
  severityColor,
  TOAST_DURATION_MS,
  toastActionStyle,
  toastStyle,
  toastTextStyle,
} from "../../src/components/errorNoticeStyles";

/**
 * F29 — aviso transitorio (toast), aviso inline (banner) y diálogo de error
 * (P-72). Sin diseño en Stitch (P-30): se componen con `DESIGN.md` y tokens.
 *
 * Reglas fijadas aquí (sin Metro, como `button.test.ts` y `states.test.ts`):
 * - toast de 4 s, una línea, acción opcional, área táctil mínima;
 * - banner inline en la pantalla, con código siempre visible (RF-43) y
 *   detalle desplegable;
 * - diálogo de nivel 2 (`elevated`), sin sombra (RNF-12), con detalle
 *   expandible y acciones;
 * - la severidad fija el color del borde/icono: accent (info), warning
 *   (warning), error (error); el texto siempre es legible sobre el fondo.
 */
describe("severidad · color por nivel", () => {
  it("info usa accent, warning usa warning, error usa error", () => {
    expect(severityColor("info")).toBe("#35C98A");
    expect(severityColor("warning")).toBe("#F5C451");
    expect(severityColor("error")).toBe("#F06A6A");
  });
});

describe("toast (aviso transitorio)", () => {
  it("dura 4 segundos (4000 ms)", () => {
    expect(TOAST_DURATION_MS).toBe(4_000);
  });

  it("estilo: nivel elevated, borde 1 px del color de severidad, radio de control", () => {
    expect(toastStyle("error")).toMatchObject({
      backgroundColor: "#1B2230",
      borderColor: "#F06A6A",
      borderWidth: 1,
      borderRadius: 8,
    });
    expect(toastStyle("info").borderColor).toBe("#35C98A");
    expect(toastStyle("warning").borderColor).toBe("#F5C451");
  });

  it("lleva área táctil mínima (48) para la acción y el cierre", () => {
    expect(toastStyle("info").minHeight).toBe(48);
  });

  it("texto de una línea (bodyMd) y acción en etiqueta (labelMd)", () => {
    expect(toastTextStyle().fontFamily).toBe("Inter");
    expect(toastActionStyle().fontFamily).toBe("Inter");
    expect(toastActionStyle().fontSize).toBeLessThanOrEqual(toastTextStyle().fontSize);
  });
});

describe("banner (aviso inline)", () => {
  it("estilo: nivel surface, borde del color de severidad, dentro de la pantalla", () => {
    expect(bannerStyle("error")).toMatchObject({
      backgroundColor: "#141923",
      borderColor: "#F06A6A",
      borderWidth: 1,
      borderRadius: 8,
    });
  });

  it("título en Manrope, mensaje en Inter y código en etiqueta", () => {
    expect(bannerTitleStyle().fontFamily).toBe("Manrope");
    expect(bannerMessageStyle().fontFamily).toBe("Inter");
    expect(bannerCodeStyle().fontFamily).toBe("Inter");
  });

  it("la acción principal respeta el área táctil mínima (48, RNF-7)", () => {
    expect(bannerActionMinHeight()).toBe(48);
  });
});

describe("diálogo de error (bloqueante, nivel 2)", () => {
  it("estilo: nivel elevated, radio de tarjeta, sin sombra (RNF-12)", () => {
    expect(dialogStyle()).toMatchObject({
      backgroundColor: "#1B2230",
      borderRadius: 12,
      shadowOpacity: 0,
      elevation: 0,
    });
  });

  it("el velo oscurece el contenido (mismo patrón que la hoja modal)", () => {
    expect(dialogBackdropStyle().backgroundColor).toBe("rgba(11, 14, 20, 0.64)");
  });

  it("título en Manrope, mensaje en Inter, detalle en caja surface sin sombra", () => {
    expect(dialogTitleStyle().fontFamily).toBe("Manrope");
    expect(dialogMessageStyle().fontFamily).toBe("Inter");
    expect(dialogDetailTextStyle().fontFamily).toBe("Inter");
    expect(dialogDetailBoxStyle()).toMatchObject({
      backgroundColor: "#141923",
      borderColor: "#263147",
      shadowOpacity: 0,
      elevation: 0,
    });
  });
});
