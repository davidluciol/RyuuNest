import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F34.3 — todo elemento pulsable de `components/` usa `FocusPressable` (anillo
 * de foco 2 px accent / 2 px de separación). `PENDING` lista los que aún usan
 * `Pressable` crudo: la lista solo puede menguar, y un componente nuevo con
 * `Pressable` crudo rompe esta prueba.
 */
const PENDING = [
  "SheetModal.tsx",
  "Switch.tsx",
  "Toast.tsx",
];

/** Ya pintan el anillo con `focusRingStyle` por su cuenta (`navItemStyle`). */
const OWN_RING = ["BottomNav.tsx"];
/** El propio envoltorio, que es quien usa `Pressable`. */
const WRAPPER = ["FocusPressable.tsx"];

const dir = join(__dirname, "../../src/components");
const raw = readdirSync(dir)
  .filter((f) => f.endsWith(".tsx"))
  .filter((f) => /<Pressable[\s>]/.test(readFileSync(join(dir, f), "utf8")))
  .sort();

describe("FocusPressable en components/", () => {
  it("solo quedan con Pressable crudo los pendientes anotados", () => {
    expect(raw).toEqual([...PENDING, ...OWN_RING, ...WRAPPER].sort());
  });

  it("existe el componente compartido", () => {
    expect(readdirSync(dir)).toContain("FocusPressable.tsx");
  });
});
