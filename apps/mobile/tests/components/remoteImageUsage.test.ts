import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * F35 — el `Image` de React Native no envía `source.headers` en Android (medido en el
 * S25 Ultra: llega `okhttp` sin `Referer` ni `Cookie`), así que las portadas de sitios
 * que exigen cabeceras (M440, YupManga) salen en blanco. Las imágenes remotas usan
 * `expo-image`, como el lector. `LOCAL_ONLY` solo pinta recursos del paquete y
 * `PENDING` aún no recibe portadas remotas: la lista solo puede menguar.
 */
const LOCAL_ONLY = ["ImageCapPanel.tsx", "components/Header.tsx"];
const PENDING = [
  "components/ContinueCard.tsx",
  "components/CoverCard.tsx",
  "components/RecentCard.tsx",
];

const RN_IMAGE = /import\s*\{[^}]*\bImage\b[^}]*\}\s*from\s*"react-native"/;

function rnImageFiles(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) found.push(...rnImageFiles(full));
    else if (entry.name.endsWith(".tsx") && RN_IMAGE.test(readFileSync(full, "utf8"))) {
      found.push(full);
    }
  }
  return found;
}

describe("imágenes remotas con expo-image", () => {
  it("solo usan el Image de react-native los archivos anotados", () => {
    const srcRoot = join(__dirname, "../../src");
    const files = rnImageFiles(srcRoot)
      .map((file) => relative(srcRoot, file).replace(/\\/g, "/"))
      .filter((file) => !file.startsWith("gallery/"))
      .sort();
    expect(files).toEqual([...LOCAL_ONLY, ...PENDING].sort());
  });
});
