import { radii, dragonNightColors } from "@ryuunest/ui-tokens";

/**
 * F06 — reglas de la insignia de tipo/estado (SPEC §11.10): pill de 24 px,
 * **neutra** (fondo `elevated`, texto `text-secondary`) según `DESIGN_RULES.md`
 * V1 — `DESIGN.md` la pinta esmeralda y gana la regla. No es interactiva, así
 * que no necesita área táctil de 48 dp.
 */

export const BADGE_HEIGHT = 24;

const colors = dragonNightColors;

export interface BadgeStyleShape {
  height: number;
  borderRadius: number;
  backgroundColor: string;
}

/** Estilo de la insignia (único, sin variantes en la v1). */
export function badgeStyle(): BadgeStyleShape {
  return {
    height: BADGE_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.elevated,
  };
}

/** Colores para la puerta de contraste. */
export function badgeColors(): { bg: string; text: string } {
  return { bg: colors.elevated, text: colors.textSecondary };
}
