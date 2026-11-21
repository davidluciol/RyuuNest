import { describe, expect, it } from "vitest";

import { consumeOpenUpdatesRequest, requestOpenUpdates } from "../../src/navigation/updatesStore";

describe("F99 — updatesStore", () => {
  it("la petición de abrir actualizaciones se consume una sola vez", () => {
    expect(consumeOpenUpdatesRequest()).toBe(false);
    requestOpenUpdates();
    expect(consumeOpenUpdatesRequest()).toBe(true);
    expect(consumeOpenUpdatesRequest()).toBe(false);
  });
});
