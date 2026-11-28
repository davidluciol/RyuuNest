import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, it } from "vitest";

const read = (file: string) =>
  readFileSync(path.resolve(import.meta.dirname, "../..", file), "utf8");

// F103 (restos): el error de una página del lector también ofrece «Mandar reporte».
it("el error por página lleva «Mandar reporte» hasta appReport con el módulo", () => {
  expect(read("src/components/ErrorState.tsx")).toMatch(/onReport\?: \(\) => void/);
  const page = read("src/screens/reader/ReaderPageImage.tsx");
  expect(page).toMatch(/onReport=\{/);
  for (const file of [
    "src/screens/reader/ReaderVertical.tsx",
    "src/screens/reader/ReaderPaged.tsx",
  ]) {
    expect(read(file)).toMatch(/onReportPage/);
  }
  const route = read("src/app/reader/[moduleId]/[seriesId]/[chapterId].tsx");
  expect(route).toMatch(
    /onReportPage=\{\(failure\) =>[\s\S]*?appReport\.open\(\{ \.\.\.failure, moduleId \}\)/,
  );
});
