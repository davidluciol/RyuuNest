import { radii, spacing, touchTarget, typography, dragonNightColors, withAlpha, type TypeStyle } from "@ryuunest/ui-tokens";

/**
 * F29 — reglas de los avisos de error (P-72, sin diseño en Stitch: P-30).
 *
 * Tres piezas, una por contexto de pantalla:
 * - `Toast`: aviso transitorio (4 s), una línea, acción opcional; no bloquea.
 * - `ErrorBanner`: aviso inline dentro de una pantalla (error de módulo con
 *   causa, código, reintentar y detalle). Vive en la pantalla, no encima.
 * - `ErrorDialog`: diálogo de nivel 2 (título, explicación, código, detalle
 *   expandible y acciones). Reutiliza el patrón de `SheetModal`.
 *
 * La lógica de color y forma vive aquí, sin React Native, para probarla sin
 * Metro (igual que `buttonStyles.ts` o `stateStyles.ts`).
 */

/** Severidad del aviso: el color del borde/icono y del texto de código. */
export type ErrorSeverity = "info" | "warning" | "error";

/** Duración del toast en milisegundos (4 s). */
export const TOAST_DURATION_MS = 4_000;

/** Líneas del mensaje del toast: dos, completo y sin «…» (T7). */
export const TOAST_MESSAGE_LINES = 2;

const colors = dragonNightColors;

/** Color del borde y del icono por severidad. */
export function severityColor(severity: ErrorSeverity): string {
  if (severity === "info") return colors.accent;
  if (severity === "warning") return colors.warning;
  return colors.error;
}

export interface ToastStyleShape {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  paddingHorizontal: number;
  paddingVertical: number;
  minHeight: number;
  gap: number;
}

/** Toast: nivel `elevated`, borde 1 px del color de severidad, pill. */
export function toastStyle(severity: ErrorSeverity): ToastStyleShape {
  return {
    backgroundColor: colors.elevated,
    borderColor: severityColor(severity),
    borderWidth: 1,
    borderRadius: radii.control,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: touchTarget.min,
    gap: spacing.xs,
  };
}

export interface ToastDotStyleShape {
  width: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
}

/** Punto de severidad del toast (diseño `banner_inline_de_error_y_toast`). */
export function toastDotStyle(severity: ErrorSeverity): ToastDotStyleShape {
  return {
    width: spacing.xs,
    height: spacing.xs,
    borderRadius: spacing.xxs,
    backgroundColor: severityColor(severity),
  };
}

/** Texto del toast: hasta `TOAST_MESSAGE_LINES` líneas. */
export function toastTextStyle(): TypeStyle {
  return typography.bodyMd;
}

/** Acción del toast (etiqueta en el color de severidad). */
export function toastActionStyle(): TypeStyle {
  return typography.labelMd;
}

export interface BannerStyleShape {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  padding: number;
  gap: number;
}

/** Banner inline: nivel `surface`, borde del color de severidad. */
/** Banner inline: nivel `surface`, borde izquierdo grueso del color de severidad. */
export function bannerStyle(severity: ErrorSeverity): BannerStyleShape {
  return {
    backgroundColor: colors.surface,
    borderColor: severityColor(severity),
    borderWidth: 1,
    borderRadius: radii.control,
    padding: spacing.md,
    gap: spacing.xs,
  };
}

/** Título del banner (causa legible), en Manrope. */
export function bannerTitleStyle(): TypeStyle {
  return typography.headlineSm;
}

/** Mensaje del banner (explicación simple), en Inter. */
export function bannerMessageStyle(): TypeStyle {
  return typography.bodyMd;
}

/** Texto de la etiqueta de código del error (nunca es el único aviso: RF-43). */
export function bannerCodeStyle(): TypeStyle {
  return typography.labelSm;
}

/** Texto de las acciones del banner («Reintentar», «Ver detalle»), semibold. */
export function bannerActionTextStyle(): TypeStyle {
  return typography.labelLg;
}

export interface CodeChipStyleShape {
  alignSelf: "flex-start";
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  backgroundColor: string;
  paddingHorizontal: number;
  paddingVertical: number;
}

/** Etiqueta de código: pastilla con borde y tinte del color de severidad (Stitch). */
export function codeChipStyle(severity: ErrorSeverity): CodeChipStyleShape {
  const color = severityColor(severity);
  return {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: color,
    borderRadius: spacing.xxs,
    backgroundColor: withAlpha(color, 0.14),
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  };
}

/** Botón de acción del banner: área táctil mínima (48 dp, RNF-7). */
export function bannerActionMinHeight(): number {
  return touchTarget.min;
}

export interface DialogStyleShape {
  backgroundColor: string;
  borderRadius: number;
  padding: number;
  gap: number;
  elevation: number;
  shadowOpacity: number;
}

/** Diálogo: nivel `elevated`, radio de tarjeta, sin sombra (RNF-12). */
export function dialogStyle(): DialogStyleShape {
  return {
    backgroundColor: colors.elevated,
    borderRadius: radii.card,
    padding: spacing.lg,
    gap: spacing.sm,
    elevation: 0,
    shadowOpacity: 0,
  };
}

/** Velo del diálogo: oscurece el contenido y centra el diálogo con márgenes. */
export function dialogBackdropStyle(): {
  flex: number;
  justifyContent: "center";
  alignItems: "center";
  padding: number;
  backgroundColor: string;
} {
  return {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: withAlpha(colors.bg, 0.64),
  };
}

/** Marco del diálogo: ancho completo hasta un máximo legible (480). */
export function dialogFrameStyle(): { width: "100%"; maxWidth: number } {
  return { width: "100%", maxWidth: spacing["2xl"] * 10 };
}

/** Título del diálogo, en Manrope. */
export function dialogTitleStyle(): TypeStyle {
  return typography.headlineSm;
}

/** Mensaje del diálogo (explicación simple), en Inter. */
export function dialogMessageStyle(): TypeStyle {
  return typography.bodyMd;
}

/** Caja del detalle expandible: nivel `surface` con borde, sin sombra. */
export function dialogDetailBoxStyle(): {
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  backgroundColor: string;
  padding: number;
  shadowOpacity: number;
  elevation: number;
} {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    shadowOpacity: 0,
    elevation: 0,
  };
}

export interface DialogDisclosureStyleShape {
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
  backgroundColor: string;
  overflow: "hidden";
}

/** Caja plegable del detalle técnico: borde `border`, `surface`, cabecera y cuerpo dentro. */
export function dialogDisclosureStyle(): DialogDisclosureStyleShape {
  return {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.control,
    backgroundColor: colors.surface,
    overflow: "hidden",
  };
}

/** Texto de cada línea del detalle, en Inter pequeño. */
export function dialogDetailTextStyle(): TypeStyle {
  return typography.labelMd;
}

/** Color del texto del código en el diálogo. */
export function dialogCodeColor(severity: ErrorSeverity): string {
  return severityColor(severity);
}
