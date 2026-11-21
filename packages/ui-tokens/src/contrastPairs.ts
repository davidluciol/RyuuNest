import type { ThemeColors } from "./colors";

/**
 * Pares de color que la interfaz usa y que deben cumplir WCAG 2.1 AA (F02, AC-13).
 * Fuente única: la prueba de Dragon Night y la validación de temas (F89) la comparten.
 */
export type ColorKey = keyof ThemeColors;
export type ColorPair = readonly [foreground: ColorKey, background: ColorKey, why: string];

/** Texto: 4,5:1. */
export const TEXT_PAIRS: readonly ColorPair[] = [
  ["textPrimary", "bg", "texto principal sobre el fondo"],
  ["textPrimary", "surface", "texto sobre tarjetas y filas"],
  ["textPrimary", "elevated", "texto sobre hojas y diálogos"],
  ["textSecondary", "bg", "texto secundario sobre el fondo"],
  ["textSecondary", "surface", "texto secundario sobre tarjetas"],
  ["textSecondary", "elevated", "texto secundario sobre hojas (insignia neutra)"],
  ["bg", "accent", "tinta oscura sobre relleno accent (botón primario)"],
  ["bg", "progress", "tinta oscura sobre relleno progress (avance)"],
  ["accent", "badgeBg", "texto accent del chip seleccionado"],
  ["error", "bg", "texto error sobre el fondo (destructivo)"],
  ["error", "surface", "texto error sobre tarjetas"],
  ["error", "elevated", "texto error sobre hojas"],
];

/** Elementos no textuales: 3:1. */
export const NON_TEXT_PAIRS: readonly ColorPair[] = [
  ["accent", "bg", "contorno de foco sobre el fondo"],
  ["accent", "surface", "contorno de foco sobre tarjetas"],
  ["accent", "elevated", "contorno de foco sobre hojas"],
  ["progress", "bg", "barra de progreso sobre el fondo"],
  ["progress", "surface", "barra de progreso sobre tarjetas"],
  ["positive", "bg", "marca de capítulo completado"],
  ["warning", "bg", "icono de advertencia"],
  ["nsfw", "bg", "borde NSFW sobre el fondo"],
  ["nsfw", "surface", "borde NSFW sobre tarjetas"],
  ["nsfw", "elevated", "borde NSFW sobre hojas"],
];
