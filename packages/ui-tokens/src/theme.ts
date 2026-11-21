import { dragonNightColors, type ThemeColors } from "./colors";

export type { ThemeColors } from "./colors";

/**
 * Un tema aporta **solo los colores semánticos** (SPEC §11.9): tipografía, espaciado,
 * radios y densidades son compartidos por todos los temas. Añadir un tema nuevo
 * (p. ej. un tema claro) es crear otro objeto `Theme` y registrarlo en `themes`;
 * ningún componente cambia (P2-2, v1 con solo Dragon Night por P-29).
 */
export interface Theme {
  /** Identificador estable, en kebab-case; sirve de clave en el registro. */
  readonly id: string;
  /** Nombre legible para la pantalla de ajustes. */
  readonly name: string;
  readonly colors: ThemeColors;
}

/** Tema de la v1: Dragon Night (los 7 diseños exportados son de este tema). */
export const dragonNight: Theme = {
  id: "dragon-night",
  name: "Dragon Night",
  colors: dragonNightColors,
};

/** Variante de Dragon Night: solo cambian los colores; los pares de contraste los valida `validateTheme`. */
const variant = (id: string, name: string, colors: Partial<ThemeColors>): Theme => ({
  id,
  name,
  colors: { ...dragonNightColors, ...colors },
});

/** Medianoche: azul frío. */
const medianoche = variant("medianoche", "Medianoche", {
  bg: "#0A0F1E",
  surface: "#121A2E",
  elevated: "#1A2540",
  border: "#2A3A5C",
  textPrimary: "#EEF2FA",
  textSecondary: "#9FB0CC",
  accent: "#5AA9FF",
  badgeBg: "#14263F",
});

/** Brasa: cálido, rojizo. */
const brasa = variant("brasa", "Brasa", {
  bg: "#130C0C",
  surface: "#1D1313",
  elevated: "#281B1B",
  border: "#4A3030",
  textPrimary: "#F6EEEA",
  textSecondary: "#BBA29A",
  accent: "#FF7A59",
  progress: "#F5C451",
  accentAlt: "#C792EA",
  badgeBg: "#33201B",
});

/** Amatista: violeta. */
const amatista = variant("amatista", "Amatista", {
  bg: "#0E0B16",
  surface: "#171325",
  elevated: "#211B34",
  border: "#3A3156",
  textPrimary: "#F1EEF8",
  textSecondary: "#A99FC4",
  accent: "#B79BFF",
  accentAlt: "#35C98A",
  badgeBg: "#25203D",
});

/** Registro de temas integrados (los de la comunidad se importan aparte, F91). */
export const themes: Readonly<Record<string, Theme>> = {
  [dragonNight.id]: dragonNight,
  [medianoche.id]: medianoche,
  [brasa.id]: brasa,
  [amatista.id]: amatista,
};

/** Tema aplicado cuando la app no elige ninguno (v1: siempre Dragon Night). */
export const defaultTheme: Theme = dragonNight;

/** Busca un tema por su id; `undefined` si no está registrado. */
export function getTheme(id: string): Theme | undefined {
  return themes[id];
}
