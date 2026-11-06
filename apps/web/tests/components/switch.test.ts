import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F34.2 — interruptor web: el apagado debe verse sobre `bg`/`surface` (borde
 * `text-secondary`, relleno `elevated`; ≥ 3:1) y el estado no depende solo del
 * color: el texto «Sí/No» va junto al control (el mismo `switchLabelKey` del
 * móvil, vía el alias compartido P-115).
 */
const dir = path.resolve(process.cwd(), "src/components");
const css = readFileSync(path.join(dir, "switch.css"), "utf8");
const tsx = readFileSync(path.join(dir, "Switch.tsx"), "utf8");

function rule(selector: string): string {
  const block = css
    .split("}")
    .map((chunk) => chunk.replace(/\/\*[\s\S]*?\*\//g, "").trim())
    .find((chunk) => chunk.startsWith(`${selector} {`));
  return block ?? "";
}

describe("Switch web (F34.2)", () => {
  it("pista apagada: relleno elevated y borde text-secondary", () => {
    const track = rule(".switch-track");
    expect(track).toContain("background: var(--color-elevated)");
    expect(track).toMatch(/border:\s*2px solid var\(--color-text-secondary\)/);
  });

  it("pomo apagado text-secondary y encendido bg", () => {
    expect(rule(".switch-thumb")).toContain("background: var(--color-text-secondary)");
    expect(rule(".switch-input:checked + .switch-track .switch-thumb")).toContain(
      "background: var(--color-bg)",
    );
  });

  it("el texto Sí/No sale del catálogo con switchLabelKey", () => {
    expect(tsx).toContain("switchLabelKey");
    expect(tsx).toContain("switch-state");
  });
});
