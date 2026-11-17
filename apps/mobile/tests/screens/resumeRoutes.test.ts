import { describe, expect, it } from "vitest";

import { resumeRoutes } from "../../src/navigation/resume";

/**
 * F79 / P-155 — «Reanudar»: en web va directo al lector; en móvil se apila Detalles y encima
 * el lector (el usuario aterriza en la página exacta y «atrás» vuelve a Detalles).
 */
const item = { moduleId: "m440", seriesId: "s1", chapterId: "c9" };

const SERIES = {
  pathname: "/series/[moduleId]/[seriesId]",
  params: { moduleId: "m440", seriesId: "s1" },
};
const READER = {
  pathname: "/reader/[moduleId]/[seriesId]/[chapterId]",
  params: { moduleId: "m440", seriesId: "s1", chapterId: "c9" },
};

describe("resumeRoutes", () => {
  it("web: solo el lector", () => {
    expect(resumeRoutes(item, "web")).toEqual([READER]);
  });

  it.each(["android", "ios"] as const)("%s: Detalles y luego el lector", (os) => {
    expect(resumeRoutes(item, os)).toEqual([SERIES, READER]);
  });
});
