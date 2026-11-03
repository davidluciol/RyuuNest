import { describe, expect, it } from "vitest";

import { t } from "../../src/i18n";
import {
  confirmActionsLayout,
  confirmPresentation,
  confirmSubjectStyle,
} from "../../src/components/confirmSheetStyles";

/**
 * F34.2 — `ConfirmSheet`: un solo patrón de confirmación para acciones con consecuencias
 * (reemplazar el respaldo, desinstalar, quitar un repositorio, borrar el registro). Hoja
 * inferior en móvil y diálogo centrado en escritorio/TV
 * (`design/stitch/confirmar_accion_dragon_night`). La acción va en amarillo (`caution`).
 */

describe("confirmPresentation", () => {
  it("móvil: hoja inferior", () => {
    expect(confirmPresentation(360)).toBe("sheet");
    expect(confirmPresentation(411)).toBe("sheet");
    expect(confirmPresentation(599)).toBe("sheet");
  });

  it("tablet, TV y escritorio: diálogo centrado", () => {
    expect(confirmPresentation(600)).toBe("dialog");
    expect(confirmPresentation(960)).toBe("dialog");
    expect(confirmPresentation(1440)).toBe("dialog");
  });
});

describe("confirmActionsLayout", () => {
  it("hoja: acciones apiladas a ancho completo, la acción primero y «Cancelar» debajo", () => {
    expect(confirmActionsLayout("sheet")).toEqual({
      direction: "column",
      confirmFirst: true,
      fullWidth: true,
    });
  });

  it("diálogo: una fila a la derecha, «Cancelar» y luego la acción", () => {
    expect(confirmActionsLayout("dialog")).toEqual({
      direction: "row",
      confirmFirst: false,
      fullWidth: false,
    });
  });
});

describe("confirmSubjectStyle (nombre del elemento afectado)", () => {
  it("es una etiqueta surface con borde, alineada al inicio", () => {
    expect(confirmSubjectStyle()).toMatchObject({
      alignSelf: "flex-start",
      backgroundColor: "#141923",
      borderColor: "#263147",
      borderWidth: 1,
      borderRadius: 8,
    });
  });
});

describe("textos", () => {
  it("«Cancelar» común a todas las confirmaciones", () => {
    expect(t("confirm.cancel")).toBe("Cancelar");
  });
});
