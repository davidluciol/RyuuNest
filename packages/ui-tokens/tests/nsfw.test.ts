import { describe, expect, it } from "vitest";

import { dragonNightColors } from "../src/index";

/**
 * F94 — el borde NSFW es un token semántico propio (P-173), distinto del ámbar `progress`
 * (V1). Su contraste (3:1) lo cubre `aa-pairs.test.ts`.
 */
describe("token nsfw (F94)", () => {
  it("no coincide con el ámbar de progreso", () => {
    expect(dragonNightColors.nsfw).not.toBe(dragonNightColors.progress);
  });
});
