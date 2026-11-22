import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ModuleError } from "@ryuunest/core";

import { readerErrorCode } from "@ryuunest/mobile-src/screens/reader/readerErrors";

/**
 * F43 W14 — banner de error del lector web: no queda pegado al borde a anchos de móvil y
 * muestra el código del fallo y «Ver detalle» con el mensaje original.
 */
const read = (file: string) =>
  readFileSync(path.resolve(import.meta.dirname, "../../src/screens/reader", file), "utf8");

describe("código del error del lector", () => {
  it("usa el código del módulo y, si no lo hay, INTERNAL", () => {
    expect(readerErrorCode(new ModuleError("NOT_FOUND", "no está"))).toBe("NOT_FOUND");
    expect(readerErrorCode(new Error("x"))).toBe("INTERNAL");
  });
});

describe("banner del lector web (W14)", () => {
  const screen = read("ReaderScreen.tsx");

  it("enseña el código y un «Ver detalle» que despliega el mensaje", () => {
    expect(screen).toMatch(/data-testid="reader-error-code"/);
    expect(screen).toMatch(/testID="reader-error-detail-toggle"/);
    expect(screen).toMatch(/data-testid="reader-error-detail"/);
  });

  it("deja margen lateral también a anchos de móvil", () => {
    expect(read("reader.css")).toMatch(
      /\.reader-error-banner \{[^}]*width: calc\(100% - 2 \* var\(--space-md\)\)/,
    );
  });
});

describe("selector de capítulo del lector web (W15, RF-22)", () => {
  const screen = read("ReaderScreen.tsx");

  it("la barra tiene «Cap. N ⌄» que abre la lista de capítulos", () => {
    expect(screen).toMatch(/testID="reader-chapters"/);
    expect(screen).toMatch(/<Dialog[^>]*testID="reader-chapters-dialog"/);
  });

  it("cada capítulo abre ese capítulo con su release y el actual va marcado", () => {
    expect(screen).toMatch(/data-testid=\{`reader-chapter-\$\{chapter\.id\}`\}/);
    expect(screen).toMatch(/onOpenChapter\(chapter\.id, chapter\.releaseId\)/);
    expect(screen).toMatch(/reader\.chapters\.current/);
  });
});
