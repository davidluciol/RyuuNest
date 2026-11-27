import { radii, activeColors } from "@ryuunest/ui-tokens";

/**
 * F06 — reglas de la insignia de tipo/estado (SPEC §11.10): pill de 24 px,
 * **neutra** (fondo `elevated`, texto `text-secondary`) según `docs/DESIGN_RULES.md`
 * V1 — `docs/DESIGN.md` la pinta esmeralda y gana la regla. No es interactiva, así
 * que no necesita área táctil de 48 dp.
 */

export const BADGE_HEIGHT = 24;

const colors = activeColors;

export interface BadgeStyleShape {
  minHeight: number;
  borderRadius: number;
  backgroundColor: string;
}

/** Estilo de la insignia (único, sin variantes en la v1). */
export function badgeStyle(): BadgeStyleShape {
  return {
    // Alto mínimo: la insignia crece con el texto del sistema al 200 % (F34).
    minHeight: BADGE_HEIGHT,
    borderRadius: radii.pill,
    backgroundColor: colors.elevated,
  };
}

/** Colores para la puerta de contraste. */
export function badgeColors(): { bg: string; text: string } {
  return { bg: colors.elevated, text: colors.textSecondary };
}
