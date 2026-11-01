import { bytesToBase64 } from "@ryuunest/extension-protocol";
import { describe, expect, it } from "vitest";

import { encodeBody, isTextual } from "../../src/background/body";

const utf8 = (text: string) => new TextEncoder().encode(text);

describe("isTextual", () => {
  it.each([
    "text/html",
    "text/plain; charset=utf-8",
    "TEXT/CSS",
    "application/json",
    "application/json; charset=utf-8",
    "application/ld+json",
    "application/xml",
    "application/xhtml+xml",
    "application/atom+xml",
    "application/javascript",
  ])("%s es texto", (contentType) => {
    expect(isTextual(contentType)).toBe(true);
  });

  it.each(["image/jpeg", "application/zip", "application/octet-stream", "video/mp4", "", null])(
    "%s va en base64",
    (contentType) => {
      expect(isTextual(contentType)).toBe(false);
    },
  );
});

describe("encodeBody", () => {
  it("texto UTF-8: el cuerpo viaja como texto", () => {
    expect(encodeBody(utf8("<p>dragón 🐉</p>"), "text/html; charset=utf-8")).toEqual({
      encoding: "text",
      body: "<p>dragón 🐉</p>",
    });
  });

  it("texto sin charset: se asume UTF-8", () => {
    expect(encodeBody(utf8("ñandú"), "application/json")).toEqual({
      encoding: "text",
      body: "ñandú",
    });
  });

  it("respeta el charset declarado (ISO-8859-1)", () => {
    expect(
      encodeBody(Uint8Array.of(0x63, 0x61, 0x66, 0xe9), "text/html; charset=iso-8859-1"),
    ).toEqual({
      encoding: "text",
      body: "café",
    });
  });

  it("charset desconocido: cae a UTF-8 sin lanzar", () => {
    expect(encodeBody(utf8("hola"), "text/html; charset=no-existe")).toEqual({
      encoding: "text",
      body: "hola",
    });
  });

  it("quita la marca BOM de UTF-8", () => {
    const withBom = Uint8Array.of(0xef, 0xbb, 0xbf, 0x7b, 0x7d);
    expect(encodeBody(withBom, "application/json")).toEqual({ encoding: "text", body: "{}" });
  });

  it("binario: base64 exacto, sin pasar por UTF-8", () => {
    const bytes = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x80);
    expect(encodeBody(bytes, "image/jpeg")).toEqual({
      encoding: "base64",
      body: bytesToBase64(bytes),
    });
  });

  it("sin content-type: base64 (no se adivina)", () => {
    const bytes = utf8("abc");
    expect(encodeBody(bytes, null)).toEqual({ encoding: "base64", body: bytesToBase64(bytes) });
  });
});
