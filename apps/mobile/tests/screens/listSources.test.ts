import { describe, expect, it } from "vitest";

import { listSourceOf } from "../../src/screens/list/listSources";

/** F82 — la ruta `/list/<source>` solo acepta fuentes registradas. */
describe("listSourceOf", () => {
  it("«recent» existe, con reserva web y título de Lecturas Recientes", () => {
    const source = listSourceOf("recent");
    expect(source?.titleKey).toBe("home.section.recent");
    expect(source?.fallback.length).toBeGreaterThan(0);
  });

  it.each([undefined, "", "nope", "constructor", "__proto__"])("%s no es una fuente", (id) => {
    expect(listSourceOf(id)).toBeNull();
  });
});
