import { describe, expect, it } from "vitest";

import { TOKENS_CSS_ID, tokensCssPlugin } from "../src/tokens/tokensCssPlugin";

/**
 * F26 — el plugin que genera el CSS de tokens lo comparten `apps/web` y la
 * página de opciones de `apps/extension`: un único origen de tokens (AC-13).
 */
type Hook<Arg> = (arg: Arg) => unknown;

describe("tokensCssPlugin", () => {
  const plugin = tokensCssPlugin();
  const resolveId = plugin.resolveId as Hook<string>;
  const load = plugin.load as Hook<string>;

  it("resuelve solo el módulo virtual de tokens", () => {
    expect(TOKENS_CSS_ID).toBe("virtual:ryuunest-tokens.css");
    expect(resolveId(TOKENS_CSS_ID)).toBe(`\0${TOKENS_CSS_ID}`);
    expect(resolveId("./otra-cosa.css")).toBeNull();
  });

  it("carga el CSS generado desde los tokens del tema", () => {
    const css = load(`\0${TOKENS_CSS_ID}`) as string;
    expect(css).toContain("@font-face");
    expect(css).toContain("--color-accent");
    expect(css).toContain(".t-body-md");
  });

  it("no carga ningún otro módulo", () => {
    expect(load("otro-id")).toBeNull();
  });
});
