import type { ThemeColors } from "./colors";
import { NON_TEXT_PAIRS, TEXT_PAIRS } from "./contrastPairs";
import { contrastRatio, WCAG_AA } from "./contrast";
import type { Theme } from "./theme";

/**
 * F89 — esquema de un tema: un JSON de tokens, **sin código ejecutable**. Solo
 * aporta los 14 colores semánticos (SPEC §11.9); el resto de tokens es común.
 * `validateTheme` es la puerta de los temas importados (F91) y de los integrados.
 */
export const THEME_SCHEMA_VERSION = 1;

export const THEME_COLOR_KEYS: readonly (keyof ThemeColors)[] = [
  "bg",
  "surface",
  "elevated",
  "border",
  "textPrimary",
  "textSecondary",
  "accent",
  "progress",
  "accentAlt",
  "badgeBg",
  "positive",
  "warning",
  "error",
  "nsfw",
];

const TOP_KEYS = ["schemaVersion", "id", "name", "colors"];
const ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MAX_NAME = 40;

export type ThemeValidation = { ok: true; theme: Theme } | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validateTheme(input: unknown): ThemeValidation {
  if (!isRecord(input)) return { ok: false, errors: ["El tema debe ser un objeto JSON"] };
  const errors: string[] = [];

  for (const key of Object.keys(input)) {
    if (!TOP_KEYS.includes(key)) errors.push(`Clave desconocida: ${key}`);
  }
  if (input.schemaVersion !== THEME_SCHEMA_VERSION) {
    errors.push(`schemaVersion debe ser ${THEME_SCHEMA_VERSION}`);
  }
  const { id, name, colors } = input;
  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    errors.push("id debe ser texto en kebab-case (a-z, 0-9 y guiones)");
  }
  if (typeof name !== "string" || name.trim() === "" || name.length > MAX_NAME) {
    errors.push(`name debe ser texto de 1 a ${MAX_NAME} caracteres`);
  }

  if (!isRecord(colors)) {
    errors.push("colors debe ser un objeto");
  } else {
    for (const key of Object.keys(colors)) {
      if (!THEME_COLOR_KEYS.includes(key as keyof ThemeColors)) {
        errors.push(`Color desconocido: ${key}`);
      }
    }
    let complete = true;
    for (const key of THEME_COLOR_KEYS) {
      const value = colors[key];
      if (typeof value !== "string" || !HEX_PATTERN.test(value)) {
        errors.push(`${key} debe ser un color #rrggbb`);
        complete = false;
      }
    }
    if (complete) {
      const c = colors as unknown as ThemeColors;
      const check = (pairs: typeof TEXT_PAIRS, min: number) => {
        for (const [fg, bg, why] of pairs) {
          const ratio = contrastRatio(c[fg], c[bg]);
          if (ratio < min) {
            errors.push(
              `Contraste insuficiente: ${fg} sobre ${bg} (${why}) ${ratio.toFixed(2)}:1, mínimo ${min}:1`,
            );
          }
        }
      };
      check(TEXT_PAIRS, WCAG_AA.text);
      check(NON_TEXT_PAIRS, WCAG_AA.nonText);
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    theme: {
      id: id as string,
      name: (name as string).trim(),
      colors: colors as unknown as ThemeColors,
    },
  };
}
