import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

// F38 (dispositivo): con el teclado abierto, el primer toque en «Buscar» solo lo cerraba.
it("la lista de Descubrir deja pasar el toque a «Buscar» con el teclado abierto", () => {
  const src = readFileSync(
    path.resolve(import.meta.dirname, "../..", "src/screens/discover/DiscoverScreen.tsx"),
    "utf8",
  );
  // #182: la lista pasó de ScrollView a FlashList; el criterio (toque que pasa con el teclado) sigue.
  expect(src).toMatch(/<FlashList[\s\S]*?keyboardShouldPersistTaps="handled"[\s\S]*?paddingHorizontal: sidePadding/);
});
