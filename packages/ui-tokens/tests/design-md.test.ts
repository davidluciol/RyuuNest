import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { dragonNightColors } from "../src/colors";
import { radii } from "../src/radii";
import { spacing } from "../src/spacing";
import { typography } from "../src/typography";

/**
 * F02 (AC-13) — los tokens propios de `ui-tokens` deben coincidir con los de
 * `DESIGN.md` (SPEC §11.9). El front-matter de `DESIGN.md` mezcla tokens propios
 * y genéricos que se contradicen (P2-1): aquí solo se comparan los propios y se
 * comprueba que los genéricos contradictorios NO entraron en la paleta.
 */

const designMd = readFileSync("../../DESIGN.md", "utf8");

/** Líneas del front-matter (entre los dos primeras `---`). */
function frontmatterLines(md: string): string[] {
  const lines = md.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") {
    throw new Error("DESIGN.md no empieza por un bloque front-matter (---)");
  }
  const end = lines.indexOf("---", 1);
  if (end < 0) {
    throw new Error("El front-matter de DESIGN.md no tiene cierre (---)");
  }
  return lines.slice(1, end);
}

const FM = frontmatterLines(designMd);

/** `colors:` → mapa clave-valor (`bg: '#0B0E14'`). */
function parseColors(lines: string[]): Map<string, string> {
  const out = new Map<string, string>();
  let inside = false;
  for (const line of lines) {
    if (!line.startsWith(" ")) {
      inside = line.trim() === "colors:";
      continue;
    }
    if (!inside) continue;
    const m = /^ {2}([\w-]+):\s*'?(#[0-9a-fA-F]{6})'?\s*$/.exec(line);
    if (m?.[1] && m[2]) out.set(m[1], m[2].toUpperCase());
  }
  return out;
}

/** `typography:` → mapa token-propiedad (`display-lg` → `fontSize: 40px`). */
function parseTypography(lines: string[]): Map<string, Map<string, string>> {
  const out = new Map<string, Map<string, string>>();
  let inside = false;
  let current: Map<string, string> | undefined;
  for (const line of lines) {
    if (!line.startsWith(" ")) {
      inside = line.trim() === "typography:";
      current = undefined;
      continue;
    }
    if (!inside) continue;
    const key = /^ {2}([\w-]+):\s*$/.exec(line)?.[1];
    if (key) {
      current = new Map();
      out.set(key, current);
      continue;
    }
    const prop = /^ {4}(\w+):\s*'?([^']+)'?\s*$/.exec(line);
    if (prop?.[1] && prop[2] && current) current.set(prop[1], prop[2]);
  }
  return out;
}

/** Secciones planas de keys con valor en rem/px (para `spacing:` y `rounded:`). */
function parseFlatSection(lines: string[], section: string): Map<string, string> {
  const out = new Map<string, string>();
  let inside = false;
  for (const line of lines) {
    if (!line.startsWith(" ")) {
      inside = line.trim() === `${section}:`;
      continue;
    }
    if (!inside) continue;
    const m = /^ {2}([\w.-]+):\s*'?([^']+)'?\s*$/.exec(line);
    if (m?.[1] && m[2]) out.set(m[1], m[2]);
  }
  return out;
}

const designColors = parseColors(FM);
const designTypography = parseTypography(FM);
const designSpacing = parseFlatSection(FM, "spacing");
const designRadii = parseFlatSection(FM, "rounded");

/** Nuestros tokens semánticos → la clave PROPIA equivalente en `DESIGN.md`. */
const COLOR_ALIASES: Record<string, string> = {
  bg: "bg",
  surface: "surface",
  elevated: "elevated",
  border: "border",
  textPrimary: "text-primary",
  textSecondary: "text-secondary",
  accent: "accent",
  progress: "progress",
  accentAlt: "accent-alt",
  badgeBg: "badge-bg",
  positive: "positive",
  warning: "warning",
  // `error` es genérico (#ffb4ab) y contradice al SPEC; el propio es `status-error`.
  error: "status-error",
};

describe("colores de ui-tokens vs DESIGN.md", () => {
  it("los 13 tokens semánticos coinciden con sus contrapartes propias del diseño", () => {
    for (const [token, value] of Object.entries(dragonNightColors)) {
      const designKey = COLOR_ALIASES[token];
      expect(designKey, `falta el alias de ${token}`).toBeDefined();
      const designValue = designKey ? designColors.get(designKey) : undefined;
      expect(designValue, `DESIGN.md no define ${designKey}`).toBe(value.toUpperCase());
    }
  });

  it("los genéricos que contradicen al SPEC no están en nuestra paleta (P2-1)", () => {
    // Ejemplos de SPEC §11.9: background #10131a ≠ bg; error #ffb4ab ≠ status-error.
    expect(designColors.get("background")).toBe("#10131A");
    expect(designColors.get("error")).toBe("#FFB4AB");
    const ours = Object.values(dragonNightColors).map((v) => v.toUpperCase());
    expect(ours).not.toContain("#10131A");
    expect(ours).not.toContain("#FFB4AB");
  });
});

/** `40px` → 40; `'-0.02em'` → -0.02; ausente → 0 (nuestro convenio de tracking). */
function px(raw: string | undefined, unit: "px" | "em"): number | undefined {
  if (raw === undefined) return undefined;
  const n = Number.parseFloat(raw.replace(unit, ""));
  return Number.isNaN(n) ? undefined : n;
}

const TYPE_ALIASES: Record<string, string> = {
  displayLg: "display-lg",
  displayLgMobile: "display-lg-mobile",
  headlineLg: "headline-lg",
  headlineMd: "headline-md",
  headlineSm: "headline-sm",
  titleLg: "title-lg",
  bodyLg: "body-lg",
  bodyMd: "body-md",
  bodySm: "body-sm",
  labelLg: "label-lg",
  labelMd: "label-md",
  labelSm: "label-sm",
};

describe("tipografía de ui-tokens vs DESIGN.md", () => {
  it("los 12 tokens de texto coinciden, salvo la diferencia aceptada en label-sm", () => {
    for (const [token, designKey] of Object.entries(TYPE_ALIASES)) {
      const design = designTypography.get(designKey);
      expect(design, `DESIGN.md no define ${designKey}`).toBeDefined();
      const style = typography[token as keyof typeof typography];
      expect(design?.get("fontFamily")).toBe(style.fontFamily);
      expect(px(design?.get("lineHeight"), "px")).toBe(style.lineHeight);
      expect(Number(design?.get("fontWeight"))).toBe(style.fontWeight);
      expect(px(design?.get("letterSpacing"), "em") ?? 0).toBe(style.letterSpacing);
      // Diferencia aceptada (DESIGN_RULES.md V12, registrada en DIFFS.md):
      // el diseño pide 11 px; implementamos 12 px.
      const expectedSize = token === "labelSm" ? 12 : px(design?.get("fontSize"), "px");
      expect(style.fontSize, `${token} en px`).toBe(expectedSize);
    }
    // Que el diseño siga diciendo 11 px: si Stitch cambia, DIFFS.md debe revisarse.
    expect(px(designTypography.get("label-sm")?.get("fontSize"), "px")).toBe(11);
  });
});

describe("espaciado y radios de ui-tokens vs DESIGN.md", () => {
  it("la rejilla de 4 px coincide con las claves space-* del diseño (1 rem = 16 px)", () => {
    const aliases: Record<string, string> = {
      xxs: "space-xxs",
      xs: "space-xs",
      sm: "space-sm",
      md: "space-md",
      lg: "space-lg",
      xl: "space-xl",
      "2xl": "space-2xl",
    };
    for (const [token, designKey] of Object.entries(aliases)) {
      const rem = Number.parseFloat(designSpacing.get(designKey) ?? "NaN");
      expect(rem * 16, `${designKey} → px`).toBe(spacing[token as keyof typeof spacing]);
    }
  });

  it("los radios salen de la escala `rounded` del diseño", () => {
    const rem = (key: string): number => Number.parseFloat(designRadii.get(key) ?? "NaN") * 16;
    expect(radii.checkbox).toBe(rem("sm")); // 0.25rem = 4
    expect(radii.control).toBe(rem("DEFAULT")); // 0.5rem = 8
    expect(radii.card).toBe(rem("md")); // 0.75rem = 12
    expect(radii.sheet).toBe(rem("lg")); // 1rem = 16
    expect(designRadii.get("full")).toBe("9999px");
  });
});
