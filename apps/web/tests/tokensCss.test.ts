import { describe, expect, it } from "vitest";

import {
  breakpoints,
  dragonNightColors,
  fontFiles,
  radii,
  spacing,
  touchTarget,
  typography,
  type TypeStyle,
} from "@ryuunest/ui-tokens";

import { emitTokensCss } from "../src/tokens/emitTokensCss";
import { uiTokensSnapshot } from "../src/tokens/snapshot";

const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

describe("emitTokensCss (F24)", () => {
  const css = emitTokensCss(uiTokensSnapshot());

  it("emite una variable por color del tema, con su valor", () => {
    for (const [key, value] of Object.entries(dragonNightColors)) {
      expect(css).toContain(`--color-${kebab(key)}: ${value};`);
    }
  });

  it("emite espacios, radios, el riel y el área táctil desde los tokens", () => {
    for (const [key, value] of Object.entries(spacing)) {
      expect(css).toContain(`--space-${kebab(key)}: ${value}px;`);
    }
    for (const [key, value] of Object.entries(radii)) {
      expect(css).toContain(`--radius-${kebab(key)}: ${value}px;`);
    }
    expect(css).toContain(`--rail-desktop: ${breakpoints.desktopRail}px;`);
    expect(css).toContain(`--margin-desktop: ${breakpoints.margin.desktop}px;`);
    expect(css).toContain(`--touch-min: ${touchTarget.min}px;`);
  });

  it("emite un @font-face local por archivo de fuente, sin ninguna URL remota (RNF-5)", () => {
    expect(fontFiles.length).toBeGreaterThan(0);
    for (const file of fontFiles) {
      expect(css).toContain(`font-family: "${file.family}";`);
      expect(css).toContain(`url("/fonts/${file.file}")`);
      expect(css).toContain(`font-weight: ${file.weight};`);
    }
    expect(css).not.toMatch(/https?:\/\//);
  });

  it("emite una clase .t-<nombre> por estilo tipográfico", () => {
    const styles = typography as Record<string, TypeStyle>;
    for (const [key, style] of Object.entries(styles)) {
      expect(css).toContain(`.t-${kebab(key)} {`);
      expect(css).toContain(`font-size: ${style.fontSize}px;`);
      expect(css).toContain(`font-family: "${style.fontFamily}";`);
    }
  });
});
