import { describe, expect, it } from "vitest";

import { chapterRowTitle, savedChapterLabel } from "../../src/screens/reader/readerChapterLabel";

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

/**
 * Fila de capítulo (ficha y hoja del lector): «Capítulo N: título», salvo que el módulo ya
 * numere el título («Capítulo 103.00», «Cap. 5: …»); así no sale «Capítulo 103: Capítulo 103.00».
 */
describe("chapterRowTitle", () => {
  it("antepone la numeración al subtítulo del módulo", () => {
    expect(chapterRowTitle({ number: 41, title: "El dragón" })).toBe("Capítulo 41: El dragón");
  });

  it("no la repite si el título ya viene numerado", () => {
    expect(chapterRowTitle({ number: 103, title: "Capítulo 103.00" })).toBe("Capítulo 103.00");
    expect(chapterRowTitle({ number: 5, title: "Cap. 5: Inicio" })).toBe("Cap. 5: Inicio");
    expect(chapterRowTitle({ number: 7, title: "capitulo 7" })).toBe("capitulo 7");
    expect(chapterRowTitle({ number: 2, title: "Chapter 2" })).toBe("Chapter 2");
  });

  it("sin subtítulo solo la numeración; sin número solo el título", () => {
    expect(chapterRowTitle({ number: 3, title: "  " })).toBe("Capítulo 3");
    expect(chapterRowTitle({ number: undefined, title: "Especial" })).toBe("Especial");
  });
});
