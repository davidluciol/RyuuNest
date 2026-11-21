import { describe, expect, it } from "vitest";

import { allowsNavigation, pickClearance } from "../../src/screens/challenge/challengeBrowserRules";

/** F100 — el navegador de verificación no sale de los dominios del módulo ni toma otras cookies. */

describe("allowsNavigation", () => {
  const domains = ["m440.in"];
  it.each([
    ["https://m440.in/manga-list", true],
    ["https://www.m440.in/", true],
    ["http://m440.in/", false],
    ["https://evil.example/", false],
    ["https://m440.in.evil.example/", false],
    ["intent://m440.in#Intent;end", false],
    ["javascript:alert(1)", false],
    ["no es url", false],
  ])("%s → %s", (url, expected) => {
    expect(allowsNavigation(url, domains)).toBe(expected);
  });
});

describe("pickClearance", () => {
  it("toma solo cf_clearance e ignora otras cookies", () => {
    expect(
      pickClearance({ session: { value: "secreta" }, cf_clearance: { value: "tok" } }),
    ).toEqual({ value: "tok" });
  });

  it("lee la caducidad si viene", () => {
    expect(
      pickClearance({ cf_clearance: { value: "tok", expires: "2026-11-22T10:00:00.000Z" } }),
    ).toEqual({ value: "tok", expiresAt: Date.parse("2026-11-22T10:00:00.000Z") });
  });

  it("sin cookie, vacía o caducidad ilegible", () => {
    expect(pickClearance(null)).toBeNull();
    expect(pickClearance({})).toBeNull();
    expect(pickClearance({ cf_clearance: { value: "" } })).toBeNull();
    expect(pickClearance({ cf_clearance: { value: "tok", expires: "nunca" } })).toEqual({
      value: "tok",
    });
  });
});
