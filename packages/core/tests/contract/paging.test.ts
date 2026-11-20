import { describe, expect, it } from "vitest";
import { modulePaging } from "../../src/contract/paging.js";

describe("modulePaging (F83)", () => {
  it("sin declarar nada no pagina ni ordena por más reciente", () => {
    expect(modulePaging(["search", "popular", "latest"])).toEqual({
      paginates: false,
      sortsLatest: false,
    });
  });

  it("lee `paginated` y `sortLatest` de las capacidades", () => {
    expect(modulePaging(["search", "paginated"])).toEqual({ paginates: true, sortsLatest: false });
    expect(modulePaging(["search", "paginated", "sortLatest"])).toEqual({
      paginates: true,
      sortsLatest: true,
    });
  });

  it("ordenar por más reciente exige paginar", () => {
    expect(modulePaging(["sortLatest"]).sortsLatest).toBe(false);
  });
});
