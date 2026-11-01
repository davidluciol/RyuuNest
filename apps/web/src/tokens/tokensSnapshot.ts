import type {
  BreakpointName,
  FontFile,
  RadiusToken,
  SpacingToken,
  ThemeColors,
  TypeStyle,
} from "@ryuunest/ui-tokens";

/**
 * F24 — foto de los tokens que el emisor de CSS necesita. Es un tipo puro
 * (`import type`): el emisor (`emitTokensCss.ts`) no depende en ejecución de
 * `@ryuunest/ui-tokens`, así que `vite.config.ts` puede empaquetarlo sin
 * resolución de paquetes (el `dist` de ui-tokens usa imports sin extensión,
 * que Node ESM no resuelve).
 */
export interface TokensSnapshot {
  readonly colors: ThemeColors;
  readonly spacing: Record<SpacingToken, number>;
  readonly radii: Record<RadiusToken, number>;
  readonly typography: Record<string, TypeStyle>;
  readonly fontFiles: readonly FontFile[];
  readonly railDesktop: number;
  readonly margins: Record<BreakpointName, number>;
  readonly touchMin: number;
}
