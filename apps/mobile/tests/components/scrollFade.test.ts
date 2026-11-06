import { describe, expect, it } from "vitest";

import { fadeColors, scrollFadeState } from "../../src/components/scrollFade";

/**
 * F34.3 — pista de desplazamiento de las filas de chips: un degradado en el
 * borde que aún tiene contenido oculto. Nunca se pinta si todo cabe.
 */
describe("scrollFadeState", () => {
  it("todo cabe: sin degradado en ningún borde", () => {
    expect(scrollFadeState({ offset: 0, contentWidth: 300, viewportWidth: 400 })).toEqual({
      start: false,
      end: false,
    });
  });

  it("recortado a la derecha en el inicio: solo borde final", () => {
    expect(scrollFadeState({ offset: 0, contentWidth: 600, viewportWidth: 400 })).toEqual({
      start: false,
      end: true,
    });
  });

  it("a mitad del recorrido: ambos bordes", () => {
    expect(scrollFadeState({ offset: 100, contentWidth: 600, viewportWidth: 400 })).toEqual({
      start: true,
      end: true,
    });
  });

  it("al llegar al final: solo borde inicial", () => {
    expect(scrollFadeState({ offset: 200, contentWidth: 600, viewportWidth: 400 })).toEqual({
      start: true,
      end: false,
    });
  });

  it("tolera medio píxel de redondeo en los extremos", () => {
    expect(scrollFadeState({ offset: 199.6, contentWidth: 600, viewportWidth: 400 }).end).toBe(
      false,
    );
    expect(scrollFadeState({ offset: 0.4, contentWidth: 600, viewportWidth: 400 }).start).toBe(
      false,
    );
  });

  it("sin medir (anchos en 0) no pinta nada", () => {
    expect(scrollFadeState({ offset: 0, contentWidth: 0, viewportWidth: 0 })).toEqual({
      start: false,
      end: false,
    });
  });
});

describe("fadeColors", () => {
  it("va del fondo opaco a ese mismo fondo transparente, tomado de los tokens", () => {
    const [solid, clear] = fadeColors();
    expect(solid).toBe("rgba(11, 14, 20, 1)");
    expect(clear).toBe("rgba(11, 14, 20, 0)");
  });
});
