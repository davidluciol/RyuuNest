import { describe, expect, it } from "vitest";

import { fromHex, toHex, utf8Decode, utf8Encode } from "../../src/bytes";

describe("bytes · hexadecimal", () => {
  it("codifica y decodifica sin pérdidas", () => {
    const data = new Uint8Array([0, 1, 15, 16, 127, 128, 255]);

    expect(toHex(data)).toBe("00010f107f80ff");
    expect(fromHex("00010f107f80ff")).toEqual(data);
  });

  it("rechaza hexadecimal impar o con caracteres raros", () => {
    expect(() => fromHex("abc")).toThrow();
    expect(() => fromHex("zz")).toThrow();
  });
});

describe("bytes · UTF-8", () => {
  it("codifica ASCII con un byte por carácter", () => {
    expect(Array.from(utf8Encode("abc"))).toEqual([97, 98, 99]);
  });

  it("ida y vuelta con acentos, japonés y emoji", () => {
    const text = "Español · 日本語 · 🐉";

    expect(utf8Decode(utf8Encode(text))).toBe(text);
  });

  it("sustituye bytes inválidos por U+FFFD", () => {
    expect(utf8Decode(new Uint8Array([0xff, 0x61]))).toBe("\uFFFDa");
  });
});
