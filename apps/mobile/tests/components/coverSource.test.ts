import { describe, expect, it } from "vitest";

import { coverSource } from "../../src/components/coverSource";

/**
 * F47 — la portada de una serie guardada llega a las tarjetas como `{ uri, headers }`
 * (`expo-image` envía las cabeceras en Android; M440 y YupManga las exigen).
 */
describe("coverSource", () => {
  it("sin URL no hay portada", () => {
    expect(coverSource(null, null)).toBeUndefined();
    expect(coverSource(null, { Cookie: "s=1" })).toBeUndefined();
  });

  it("con URL y sin cabeceras, solo la URI", () => {
    expect(coverSource("https://x.test/a.jpg", null)).toEqual({ uri: "https://x.test/a.jpg" });
  });

  it("con cabeceras, las lleva", () => {
    expect(coverSource("https://x.test/a.jpg", { Referer: "https://x.test/" })).toEqual({
      uri: "https://x.test/a.jpg",
      headers: { Referer: "https://x.test/" },
    });
  });
});
