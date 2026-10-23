import { fontFiles, type TypeStyle } from "@ryuunest/ui-tokens";

/** SPEC §11.3: un archivo por peso; tracking de tokens (em) convertido a píxeles. */
export function textStyle(token: TypeStyle) {
  const font = fontFiles.find(
    (file) => file.family === token.fontFamily && file.weight === token.fontWeight,
  );
  if (!font) throw new Error("Missing bundled font face");
  return {
    fontFamily: font.postScriptName,
    fontWeight: "normal" as const,
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    letterSpacing: token.letterSpacing * token.fontSize,
  };
}
