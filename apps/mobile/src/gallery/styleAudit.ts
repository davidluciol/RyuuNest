import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * F05 — auditor de literales de la galería (Regla 3, AC-13): lee el fuente de
 * `GalleryScreen.tsx` y extrae colores hexadecimales y tamaños en píxeles
 * escritos a mano. La puerta del test exige que ambas listas estén vacías:
 * todo valor visual sale de `ui-tokens`.
 *
 * Es una puerta de desarrollo, no un parser: busca patrones en el texto del
 * StyleSheet. Si la galería crece, la puerta de diseño completa llega en F09.
 */

export interface StyleLiterals {
  hexColors: string[];
  pixelSizes: string[];
}

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;
const PX_PATTERN = /\b\d+(?:\.\d+)?px\b/g;

/** Extrae los literales de color y tamaño del StyleSheet de la galería. */
export function galleryStyleLiterals(): StyleLiterals {
  const source = readFileSync(
    fileURLToPath(new URL("./GalleryScreen.tsx", import.meta.url)),
    "utf8",
  );
  // Solo el StyleSheet: del `StyleSheet.create(` al final del archivo.
  const styleStart = source.indexOf("StyleSheet.create(");
  const styleBlock = styleStart >= 0 ? source.slice(styleStart) : source;
  return {
    hexColors: [...new Set(styleBlock.match(HEX_PATTERN) ?? [])],
    pixelSizes: [...new Set(styleBlock.match(PX_PATTERN) ?? [])],
  };
}
