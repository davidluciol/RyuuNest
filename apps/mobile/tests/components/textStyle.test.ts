import { describe, expect, it } from "vitest";
import { fontFiles, typography } from "@ryuunest/ui-tokens";

import { textStyle } from "../../src/components/textStyle";

describe("tipografía nativa del shell", () => {
  it.each(Object.entries(typography))(
    "%s usa el archivo local de su peso, no una familia genérica",
    (_name, token) => {
      const result = textStyle(token);
      expect(result.fontFamily).toBe(
        fontFiles.find(
          (font) => font.family === token.fontFamily && font.weight === token.fontWeight,
        )?.postScriptName,
      );
      expect(result.fontWeight).toBe("normal");
      expect(result.fontSize).toBe(token.fontSize);
      expect(result.lineHeight).toBe(token.lineHeight);
      expect(result.letterSpacing).toBe(token.letterSpacing * token.fontSize);
    },
  );
});
