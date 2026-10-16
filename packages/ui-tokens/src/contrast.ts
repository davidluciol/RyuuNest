/**
 * Contraste WCAG 2.1 (SPEC §2 AC-13, `DESIGN.md` «Critical Accessibility &
 * Inversion Rule»). Utilidad pública del paquete: F02 la usa para la puerta de
 * Dragon Night y cualquier tema futuro (P2-2) se valida con las mismas funciones.
 */

type Rgb = readonly [number, number, number];

/** Componentes 0–255 de un `#rrggbb`. */
export function hexToRgb(hex: string): Rgb {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`Color hexadecimal invalido (se esperaba #rrggbb): ${hex}`);
  }
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Componente sRGB lineal (umbral 0,03928 y exponente 2,4 de la recomendacion). */
function toLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Luminancia relativa de un color (0 = negro, 1 = blanco). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Razon de contraste entre dos colores, de 1:1 a 21:1 (simetrica). */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Minimos AA (WCAG 2.1): 4,5 texto normal; 3,0 texto grande y elementos no textuales. */
export const WCAG_AA = {
  text: 4.5,
  largeText: 3,
  nonText: 3,
} as const;
