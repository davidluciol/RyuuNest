import type { TokensSnapshot } from "./tokensSnapshot";

/**
 * F24 — emite el CSS de tokens desde una foto de `@ryuunest/ui-tokens` (única
 * fuente de valores, AC-13): variables de color, espacio, radio y layout, clases
 * tipográficas `.t-<nombre>` y los `@font-face` locales (RNF-5: las fuentes se
 * sirven de `/public/fonts`, nunca de un CDN).
 *
 * Función pura: `vite.config.ts` la sirve como módulo virtual
 * (`virtual:ryuunest-tokens.css`) y las pruebas la comprueban sin navegador.
 * No importa `@ryuunest/ui-tokens` en ejecución para que el config de Vite pueda
 * empaquetarla sin pasar por el `dist` del paquete (ver `tokensSnapshot.ts`).
 */

/** `textPrimary` → `text-primary`, `2xl` → `2xl`. */
function kebab(name: string): string {
  return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/** CSS completo de tokens del tema por defecto (v1: Dragon Night, P-29). */
export function emitTokensCss(s: TokensSnapshot): string {
  const colorVars = (Object.keys(s.colors) as (keyof typeof s.colors)[]).map(
    (key) => `  --color-${kebab(key)}: ${s.colors[key]};`,
  );
  const spaceVars = Object.entries(s.spacing).map(
    ([key, value]) => `  --space-${kebab(key)}: ${value}px;`,
  );
  const radiusVars = Object.entries(s.radii).map(
    ([key, value]) => `  --radius-${kebab(key)}: ${value}px;`,
  );
  const fontFaceRules = s.fontFiles.map(
    (file) =>
      `@font-face {\n` +
      `  font-family: "${file.family}";\n` +
      `  src: url("/fonts/${file.file}") format("truetype");\n` +
      `  font-weight: ${file.weight};\n` +
      `  font-style: normal;\n` +
      `  font-display: swap;\n` +
      `}`,
  );
  const typeClasses = Object.entries(s.typography).map(([key, style]) => {
    const name = kebab(key);
    return [
      `.t-${name} {`,
      `  font-family: "${style.fontFamily}";`,
      `  font-size: ${style.fontSize}px;`,
      `  line-height: ${style.lineHeight}px;`,
      `  font-weight: ${style.fontWeight};`,
      `  letter-spacing: ${style.letterSpacing}em;`,
      `}`,
    ].join("\n");
  });

  const sections = [
    "/* Generado por emitTokensCss() desde @ryuunest/ui-tokens. No editar a mano. */",
    ...fontFaceRules,
    `:root {\n${[...colorVars, ...spaceVars, ...radiusVars].join("\n")}\n` +
      `  --rail-desktop: ${s.railDesktop}px;\n` +
      `  --touch-min: ${s.touchMin}px;\n` +
      `  --margin-mobile: ${s.margins.mobile}px;\n` +
      `  --margin-tablet: ${s.margins.tablet}px;\n` +
      `  --margin-desktop: ${s.margins.desktop}px;\n` +
      `}`,
    ...typeClasses,
  ];
  return `${sections.join("\n\n")}\n`;
}
