import { typography, type TypeStyle, type TypeToken } from "./typography";

/**
 * F04 — escala por densidad (SPEC §11.9). El factor TV de 1,25 multiplica
 * todos los tamaños; las densidades compacta y cómoda usan factor 1.
 * El resultado se redondea a enteros de píxel; el tracking está en em
 * (proporcional al tamaño), así que se conserva tal cual.
 */

/** Multiplica un tamaño por el factor y redondea al píxel entero más cercano. */
export function scaleSize(value: number, factor: number): number {
  return Math.round(value * factor);
}

/** Escala el tamaño y el interlineado de un estilo; familia, peso y tracking siguen. */
export function scaleStyle(style: TypeStyle, factor: number): TypeStyle {
  return {
    ...style,
    fontSize: scaleSize(style.fontSize, factor),
    lineHeight: scaleSize(style.lineHeight, factor),
  };
}

/** La escala tipográfica completa aplicada por un factor de densidad. */
export function scaleTypography(factor: number): Record<TypeToken, TypeStyle> {
  const scaled = {} as Record<TypeToken, TypeStyle>;
  for (const name of Object.keys(typography) as TypeToken[]) {
    scaled[name] = scaleStyle(typography[name], factor);
  }
  return scaled;
}
