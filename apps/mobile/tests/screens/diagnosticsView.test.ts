import type { LogEntry } from "@ryuunest/core";
import { describe, expect, it } from "vitest";

import { t } from "../../src/i18n";
import {
  confirmClearMessage,
  eventDetailLines,
  eventLevel,
  eventWhen,
} from "../../src/screens/settings/diagnostics/diagnosticsView";

/**
 * F30 — presentación pura del registro: nivel (texto + tono, nunca solo
 * color: DESIGN.md «Non-Color Dependent Indicators»), cuándo ocurrió y las
 * líneas del detalle desplegable.
 */

function entry(partial: Partial<LogEntry> = {}): LogEntry {
  return {
    id: 1,
    at: new Date(2026, 9, 29, 14, 32).getTime(),
    level: "error",
    code: "module.timeout",
    message: "Tardó demasiado",
    appVersion: "0.1.0",
    platform: "android",
    ...partial,
  };
}

describe("eventLevel", () => {
  it("cada nivel lleva etiqueta de texto y un tono semántico", () => {
    expect(eventLevel("error")).toEqual({ label: "Fallo", tone: "error" });
    expect(eventLevel("warn")).toEqual({ label: "Aviso", tone: "warning" });
    expect(eventLevel("info")).toEqual({ label: "Nota", tone: "neutral" });
  });
});

describe("eventWhen", () => {
  const now = new Date(2026, 9, 29, 20, 0).getTime();

  it("hoy: «Hoy · 14:32»", () => {
    expect(eventWhen(new Date(2026, 9, 29, 14, 32).getTime(), now)).toBe("Hoy · 14:32");
  });

  it("ayer, aunque hayan pasado menos de 24 horas", () => {
    expect(eventWhen(new Date(2026, 9, 28, 21, 5).getTime(), now)).toBe("Ayer · 21:05");
  });

  it("hace dos o más días (el día anterior siempre es «Ayer»)", () => {
    expect(eventWhen(new Date(2026, 9, 27, 9, 48).getTime(), now)).toBe("Hace 2 días · 09:48");
    expect(eventWhen(new Date(2026, 8, 29, 8, 0).getTime(), now)).toBe("Hace 30 días · 08:00");
  });

  it("un evento «del futuro» (reloj atrasado) se trata como hoy", () => {
    expect(eventWhen(new Date(2026, 9, 29, 23, 0).getTime(), now)).toBe("Hoy · 23:00");
  });
});

describe("eventDetailLines", () => {
  it("lista el contexto y cierra con la versión y la plataforma", () => {
    const lines = eventDetailLines(
      entry({ context: { module: "m-ejemplo-a", code: "TIMEOUT", attempts: 3 } }),
    );

    expect(lines).toEqual([
      { label: "module", value: "m-ejemplo-a" },
      { label: "code", value: "TIMEOUT" },
      { label: "attempts", value: "3" },
      { label: t("diagnostics.detail.version"), value: "0.1.0 · android" },
    ]);
  });

  it("sin contexto solo muestra la versión y la plataforma", () => {
    expect(eventDetailLines(entry())).toHaveLength(1);
  });

  it("los valores anidados salen como JSON en una línea", () => {
    const lines = eventDetailLines(entry({ context: { extra: { a: 1 } } }));

    expect(lines[0]).toEqual({ label: "extra", value: '{"a":1}' });
  });
});

describe("confirmClearMessage", () => {
  it("usa singular y plural", () => {
    expect(confirmClearMessage(1)).toContain("el evento guardado");
    expect(confirmClearMessage(4)).toContain("los 4 eventos guardados");
  });
});
