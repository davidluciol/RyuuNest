/**
 * Capas translúcidas derivadas de un token (F09, SPEC §11.11 / `DESIGN_RULES.md`
 * V2): la interfaz no escribe `rgba(...)` literales; compone el color del tema
 * con la transparencia que pida el diseño.
 */

import { hexToRgb } from "./contrast";

/** Color del tema con transparencia: `withAlpha(colors.elevated, 0.95)`. */
export function withAlpha(hex: string, alpha: number): string {
  if (typeof alpha !== "number" || Number.isNaN(alpha) || alpha < 0 || alpha > 1) {
    throw new Error(`Transparencia invalida (se esperaba 0–1): ${String(alpha)}`);
  }
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
