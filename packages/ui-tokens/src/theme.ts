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

/** Registro de temas disponibles. Los futuros temas se añaden aquí. */
export const themes: Readonly<Record<string, Theme>> = {
  [dragonNight.id]: dragonNight,
};

/** Tema aplicado cuando la app no elige ninguno (v1: siempre Dragon Night). */
export const defaultTheme: Theme = dragonNight;

/** Busca un tema por su id; `undefined` si no está registrado. */
export function getTheme(id: string): Theme | undefined {
  return themes[id];
}
