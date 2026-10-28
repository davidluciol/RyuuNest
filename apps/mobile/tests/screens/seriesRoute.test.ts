import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("ruta de la ficha de serie", () => {
  it("vive fuera del navegador de destinos del shell", () => {
    const src = path.resolve(process.cwd(), "src");
    expect(existsSync(path.join(src, "app/series/[moduleId]/[seriesId].tsx"))).toBe(true);
    expect(existsSync(path.join(src, "app/(tabs)/series/[moduleId]/[seriesId].tsx"))).toBe(false);
  });
});
