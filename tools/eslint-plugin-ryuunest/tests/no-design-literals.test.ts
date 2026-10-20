import { RuleTester } from "eslint";

import plugin from "../index.js";

/**
 * F09 — regla `ryuunest/no-design-literals` (SPEC §11.11, `DESIGN_RULES.md` V2,
 * AC-13): la interfaz (código de `src` en `apps/`) no escribe colores
 * hexadecimales/rgb ni medidas literales de fuente, radio o espacio: todo sale
 * de `@ryuunest/ui-tokens`.
 *
 * Los tests son sintaxis JS plana: la regla es sintáctica (no necesita el parser
 * de TS) y el filtrado por ruta lo hace la configuración de ESLint.
 */

const rule = plugin.rules["no-design-literals"];

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});

ruleTester.run("no-design-literals", rule, {
  valid: [
    // Tokens: el uso correcto.
    { code: `const s = { backgroundColor: colors.surface, fontSize: typography.bodyMd.fontSize };` },
    // Expresiones derivadas de tokens (no literales sueltos).
    { code: `const s = { padding: touchTarget.min / 4, width: spacing["2xl"] * 2 };` },
    // 0 y 1 son estructurales (sin desplazamiento, borde de 1 px), no diseño.
    { code: `const s = { left: 0, right: 0, borderRadius: 0, borderWidth: 1, flex: 1 };` },
    // Claves que no son de diseño.
    { code: `const s = { flexGrow: 2, aspectRatio: 3, opacity: 0.5, zIndex: 10, elevation: 2 };` },
    // Porcentajes y cadenas no numéricas.
    { code: `const s = { width: "42%", color: colors.accent };` },
    // Dentro de una regla, fuera de un objeto de estilo, nada se marca.
    { code: `const total = fontSize + 4;` },
  ],
  invalid: [
    {
      code: `const s = { backgroundColor: "#35C98A" };`,
      errors: [{ messageId: "color" }],
    },
    {
      code: `const s = { borderColor: "#ABC" };`,
      errors: [{ messageId: "color" }],
    },
    {
      code: `const s = { backgroundColor: "rgba(27, 34, 48, 0.95)" };`,
      errors: [{ messageId: "color" }],
    },
    {
      code: `const s = { color: "rebeccapurple" };`,
      errors: [{ messageId: "color" }],
    },
    {
      code: `const s = { fontSize: 14 };`,
      errors: [{ messageId: "measure" }],
    },
    {
      code: `const s = { padding: 13 };`,
      errors: [{ messageId: "measure" }],
    },
    {
      code: `const s = { borderRadius: 8, gap: 12 };`,
      errors: [{ messageId: "measure" }, { messageId: "measure" }],
    },
    {
      code: `const s = { minHeight: 56, width: 96 };`,
      errors: [{ messageId: "measure" }, { messageId: "measure" }],
    },
    {
      // El error señala la clave y la medida concretas.
      code: `const s = { paddingHorizontal: 16 };`,
      errors: [{ message: /paddingHorizontal.*16/ }],
    },
  ],
});
