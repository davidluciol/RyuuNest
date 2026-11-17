import { describe, expect, it } from "vitest";

import { savedChapterLabel } from "../../src/screens/reader/readerChapterLabel";

/**
 * El progreso guarda la numeración del capítulo («Capítulo 41»), no el subtítulo que dé el
 * módulo; sin número se guarda el título del módulo.
 */
describe("savedChapterLabel", () => {
  it("con número: «Capítulo N», ignora el subtítulo", () => {
    expect(savedChapterLabel({ number: 1, title: "¡Arranca el proyecto!" })).toBe("Capítulo 1");
    expect(savedChapterLabel({ number: 12.5, title: "x" })).toBe("Capítulo 12.5");
  });

  it("sin número: el título del módulo", () => {
    expect(savedChapterLabel({ number: undefined, title: "Especial" })).toBe("Especial");
  });
});
