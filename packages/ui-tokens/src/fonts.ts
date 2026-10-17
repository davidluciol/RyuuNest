/**
 * Manifiesto de fuentes empaquetadas (F03, P2-3): **un archivo por peso**, cargado
 * explícitamente, sin pesos sintéticos (SPEC §11.3) y con su licencia OFL. Las
 * familias y los pesos exigidos por la tipografía son los de `fonts` en
 * `typography.ts`; aquí vive qué archivo los aporta.
 *
 * Los archivos se empaquetan en `apps/mobile/assets/fonts/` (F05/F11 los cargan
 * con `expo-font`). En React Native, el `fontFamily` de cada peso es su
 * `postScriptName`: las instancias estáticas de Manrope/Inter llevan el peso
 * integrado en el nombre de familia, por eso se nombran así y no por la familia
 * genérica.
 */

import type { FontFamily } from "./typography";

/** Un archivo de fuente con su peso real y su licencia. */
export interface FontFile {
  readonly family: FontFamily;
  /** Peso real del archivo (no sintético). */
  readonly weight: number;
  /** Nombre del archivo empaquetado. */
  readonly file: string;
  /** Nombre PostScript embebido: el `fontFamily` a usar en RN para este peso. */
  readonly postScriptName: string;
  /** Archivo de licencia OFL que acompaña a la familia. */
  readonly license: string;
}

/** Manrope 600/700 e Inter 400/500/600 (P2-3). */
export const fontFiles: readonly FontFile[] = [
  {
    family: "Manrope",
    weight: 600,
    file: "Manrope-SemiBold.ttf",
    postScriptName: "Manrope-SemiBold",
    license: "LICENSE-Manrope.txt",
  },
  {
    family: "Manrope",
    weight: 700,
    file: "Manrope-Bold.ttf",
    postScriptName: "Manrope-Bold",
    license: "LICENSE-Manrope.txt",
  },
  {
    family: "Inter",
    weight: 400,
    file: "Inter-Regular.ttf",
    postScriptName: "Inter-Regular",
    license: "LICENSE-Inter.txt",
  },
  {
    family: "Inter",
    weight: 500,
    file: "Inter-Medium.ttf",
    postScriptName: "Inter-Medium",
    license: "LICENSE-Inter.txt",
  },
  {
    family: "Inter",
    weight: 600,
    file: "Inter-SemiBold.ttf",
    postScriptName: "Inter-SemiBold",
    license: "LICENSE-Inter.txt",
  },
];

/** Licencia por familia (registro en `ASSETS.md`, GPL-3.0 compatible). */
export const fontLicenses = {
  Manrope: { file: "LICENSE-Manrope.txt", spdx: "OFL-1.1" },
  Inter: { file: "LICENSE-Inter.txt", spdx: "OFL-1.1" },
} as const satisfies Record<FontFamily, { file: string; spdx: string }>;
