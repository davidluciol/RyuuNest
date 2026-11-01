import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F25 — `apps/web` reutiliza la lógica **pura** de pantallas de `apps/mobile`
 * vía el alias `@ryuunest/mobile-src` (servicios y máquinas de estados sin
 * React Native). Esta puerta vigila que los archivos que la web importa de ahí
 * sigan siendo puros: si alguno empieza a importar `react-native`/`expo`, el
 * bundle web se rompería.
 */

const MOBILE_SRC = path.resolve(process.cwd(), "../mobile/src");

/** Archivos de apps/mobile/src que apps/web importa (vía `@ryuunest/mobile-src`). */
const SHARED_FILES = [
  "screens/sources/sourcesData.ts",
  "screens/sources/sourcesFlow.ts",
  "screens/sources/sourcesController.ts",
  "screens/sources/sourcesErrors.ts",
  "screens/sources/sourcesView.ts",
  "screens/discover/discoverData.ts",
  "screens/discover/discoverFixtures.ts",
  "screens/discover/discoverErrors.ts",
  "screens/discover/useDiscoverData.ts",
  "data/officialRepo.ts",
  "data/errorLogPort.ts",
  "data/appDatabase.ts",
  "i18n/index.ts",
  "components/kindLabel.ts",
];

describe("imports compartidos desde apps/mobile", () => {
  it("los archivos compartidos no importan react-native ni expo", () => {
    for (const relative of SHARED_FILES) {
      const file = path.join(MOBILE_SRC, relative);
      const text = readFileSync(file, "utf8");
      expect(
        /from\s+["'](react-native|expo|@expo\/|react-native-svg|lucide-react-native)/.test(text),
        `${relative}: importa una dependencia nativa y rompería el bundle web`,
      ).toBe(false);
    }
  });

  it("la cadena de imports de esos archivos tampoco (un nivel)", () => {
    const seen = new Set<string>();
    const queue = SHARED_FILES.map((f) => path.join(MOBILE_SRC, f));
    while (queue.length > 0) {
      const file = queue.pop() as string;
      if (seen.has(file)) continue;
      seen.add(file);
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/from\s+["']([^"']+)["']/g)) {
        const specifier = match[1] ?? "";
        if (!specifier.startsWith(".")) continue;
        const resolved = path.resolve(path.dirname(file), specifier);
        for (const candidate of [`${resolved}.ts`, `${resolved}.tsx`, path.join(resolved, "index.ts")]) {
          try {
            readFileSync(candidate);
            queue.push(candidate);
            break;
          } catch {
            // no existe con esa extensión: probar la siguiente
          }
        }
      }
    }
    for (const file of seen) {
      const text = readFileSync(file, "utf8");
      expect(
        /from\s+["'](react-native|expo|@expo\/|react-native-svg|lucide-react-native)/.test(text),
        `${path.relative(MOBILE_SRC, file)}: la cadena shared importa dependencia nativa`,
      ).toBe(false);
    }
  });
});
