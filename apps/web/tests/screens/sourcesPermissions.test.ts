import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * F42/N9 en la web: «Ejecuta código» y «Para adultos» son permisos (RF-3), no
 * estado. Van en su propia línea con icono de aviso, como en el móvil, y las
 * insignias de la fila solo muestran estado (error, actualización…).
 */
const tsx = readFileSync(
  path.resolve(import.meta.dirname, "../..", "src/screens/sources/SourcesScreen.tsx"),
  "utf8",
);

describe("Portales web: permisos de módulo (F42/N9)", () => {
  it("las insignias de la fila son solo de estado", () => {
    expect(tsx).toContain("moduleStatusBadges(module)");
    expect(tsx).not.toContain("moduleBadges(module)");
  });

  it("los permisos salen en su propia línea con icono de aviso", () => {
    expect(tsx).toContain("modulePermissions(module)");
    expect(tsx).toContain("PERMISSION_LABEL_KEYS[permission]");
    expect(tsx).toContain("data-testid={`module-${module.id}-permissions`}");
    expect(tsx).toContain("<TriangleAlert");
  });
});

const hook = readFileSync(
  path.resolve(import.meta.dirname, "../..", "src/screens/sources/useSourcesData.ts"),
  "utf8",
);

describe("Portales web: un solo primario y avisos de éxito neutros (F42 W13/V8)", () => {
  it("«Instalar» de la fila es secundario, como en el móvil (V3 de DESIGN_RULES)", () => {
    expect(tsx).not.toContain('variant={action === "install" ? "primary" : "secondary"}');
  });

  it("el aviso guarda su tipo y un éxito no sale como error", () => {
    expect(hook).toContain("noticeKind");
    expect(tsx).toContain('severity={noticeKind === "info" ? "info" : "error"}');
  });
});
