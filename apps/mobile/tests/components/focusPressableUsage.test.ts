import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F34.3 — todo elemento pulsable de `components/` usa `FocusPressable` (anillo
 * de foco 2 px accent / 2 px de separación). `PENDING` lista los que aún usan
 * `Pressable` crudo: la lista solo puede menguar, y un componente nuevo con
 * `Pressable` crudo rompe esta prueba.
 */
const PENDING: string[] = [];

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

/** Pantallas y paneles fuera de `components/`: tampoco admiten `Pressable` crudo. */
function rawPressableFiles(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "components") found.push(...rawPressableFiles(full));
    } else if (entry.name.endsWith(".tsx") && /<Pressable[\s>]/.test(readFileSync(full, "utf8"))) {
      found.push(full);
    }
  }
  return found;
}

describe("FocusPressable fuera de components/", () => {
  it("ninguna pantalla ni panel usa Pressable crudo", () => {
    const srcRoot = join(__dirname, "../../src");
    const files = rawPressableFiles(srcRoot).map((f) =>
      f.slice(srcRoot.length + 1).replaceAll("\\", "/"),
    );
    expect(files.sort()).toEqual([]);
  });
});
