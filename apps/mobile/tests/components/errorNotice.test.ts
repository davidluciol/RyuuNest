import { describe, expect, it } from "vitest";

import {
  bannerActionMinHeight,
  bannerActionTextStyle,
  bannerCodeStyle,
  bannerMessageStyle,
  bannerStyle,
  bannerTitleStyle,
  codeChipStyle,
  dialogBackdropStyle,
  dialogFrameStyle,
  dialogDetailBoxStyle,
  dialogDisclosureStyle,
  dialogDetailTextStyle,
  dialogMessageStyle,
  dialogStyle,
  dialogTitleStyle,
  severityColor,
  TOAST_DURATION_MS,
  TOAST_MESSAGE_LINES,
  toastActionStyle,
  toastDotStyle,
  toastStyle,
  toastTextStyle,
} from "../../src/components/errorNoticeStyles";
import { t } from "../../src/i18n";

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

describe("toast: punto de severidad, dos líneas y cierre accesible (F34.1)", () => {
  it("el mensaje admite dos líneas (T7: completo, sin «…»)", () => {
    expect(TOAST_MESSAGE_LINES).toBe(2);
  });

  it("el punto de severidad es un círculo de 8 con el color de la severidad", () => {
    expect(toastDotStyle("info")).toEqual({
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#35C98A",
    });
    expect(toastDotStyle("error").backgroundColor).toBe(severityColor("error"));
    expect(toastDotStyle("warning").backgroundColor).toBe(severityColor("warning"));
  });

  it("el cierre se anuncia «Cerrar aviso», no con el texto del mensaje", () => {
    expect(t("toast.close")).toBe("Cerrar aviso");
  });
});

describe("etiqueta de código y acciones alineadas con Stitch (F34.1)", () => {
  it("la etiqueta de código es una pastilla con borde y tinte del color de severidad", () => {
    expect(codeChipStyle("error")).toMatchObject({
      borderColor: "#F06A6A",
      borderWidth: 1,
      borderRadius: 4,
      backgroundColor: "rgba(240, 106, 106, 0.14)",
    });
    expect(codeChipStyle("warning").borderColor).toBe(severityColor("warning"));
  });

  it("el código y las acciones usan el peso semibold del token, sin negrita sintética", () => {
    expect(bannerCodeStyle().fontWeight).toBe(600);
    expect(bannerActionTextStyle()).toMatchObject({ fontFamily: "Inter", fontWeight: 600 });
  });

  it("el detalle del diálogo es una caja plegable con borde y sin padding propio", () => {
    expect(dialogDisclosureStyle()).toMatchObject({
      borderWidth: 1,
      borderColor: "#263147",
      backgroundColor: "#141923",
      borderRadius: 8,
      overflow: "hidden",
    });
  });

  it("el desplegable del diálogo dice «Ver detalle técnico»", () => {
    expect(t("actions.showTechnicalDetail")).toBe("Ver detalle técnico");
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

  it("el diálogo va centrado, con márgenes y un ancho máximo legible (Stitch)", () => {
    expect(dialogBackdropStyle()).toMatchObject({
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    });
    expect(dialogFrameStyle()).toEqual({ width: "100%", maxWidth: 480 });
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
