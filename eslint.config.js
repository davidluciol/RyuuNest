// @ts-check
import ryuunest from "@ryuunest/eslint-plugin";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.expo/**",
      "pnpm-lock.yaml",
      "legacyModulos/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    extends: [...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // F09 — lint de diseño (SPEC §11.11, AC-13): la interfaz no escribe colores
    // ni medidas literales; todo sale de `@ryuunest/ui-tokens`. Solo aplica al
    // código de `src` en `apps/`: los tests afirman valores de token (fuente de
    // verdad) y `packages/*` los define.
    files: ["apps/*/src/**/*.ts", "apps/*/src/**/*.tsx"],
    plugins: { ryuunest },
    rules: {
      "ryuunest/no-design-literals": "error",
    },
  },
);
