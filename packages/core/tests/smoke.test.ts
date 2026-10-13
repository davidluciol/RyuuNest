import { describe, expect, it } from "vitest";

import { CORE_VERSION } from "../src/index";

describe("smoke", () => {
  it("expone la versión del paquete", () => {
    expect(CORE_VERSION).toBe("0.0.0");
  });
});
