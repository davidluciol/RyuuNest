import { readFileSync } from "node:fs";
import path from "node:path";

import { typography } from "@ryuunest/ui-tokens";
import { describe, expect, it } from "vitest";

import { detailTextStyle } from "../../src/components/stateStyles";

/**
 * F34.2 — el token `typography.mono` (JetBrains Mono, OFL, local) se usa en
 * códigos y detalle técnico: el detalle de `ErrorState` y el código/detalle de
 * `LogEventRow`. Banner, diálogo y chip de código ya pasan por los helpers de
 * `errorNoticeStyles` (cubiertos en errorNotice.test.ts).
 */
const SRC = path.resolve(process.cwd(), "src/components");

describe("typography.mono (F34.2)", () => {
  it("el detalle técnico de ErrorState va en mono", () => {
    expect(detailTextStyle()).toBe(typography.mono);
  });

  it("LogEventRow pinta el código y el detalle con typography.mono", () => {
    const src = readFileSync(path.join(SRC, "LogEventRow.tsx"), "utf8");
    expect(src).toMatch(/code:\s*\{\s*\.\.\.textStyle\(typography\.mono\)/);
    expect(src).toMatch(/detailLine:\s*\{\s*\.\.\.textStyle\(typography\.mono\)/);
  });
});
