import { copyFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { build } from "vite";

/**
 * F26 — empaqueta la extensión en `dist/`:
 *  - `background.js` y `content.js`: scripts clásicos (IIFE) con todo dentro; un
 *    content script no puede ser un módulo ES y así sirve igual al fondo de Firefox.
 *  - `options.html` y sus recursos (página de opciones, donde se autorizan dominios).
 *  - `manifest.json` tal cual.
 * Sin minificar: la revisión de las tiendas lee el código. Al final se comprueba
 * que todo archivo que el manifiesto nombra existe.
 */
const root = fileURLToPath(new URL("..", import.meta.url));
const at = (path) => fileURLToPath(new URL(path, new URL("../", import.meta.url)));

const alias = {
  "@ryuunest/extension-protocol": at("../../packages/extension-protocol/src/index.ts"),
};

const shared = {
  configFile: false,
  root,
  logLevel: "warn",
  resolve: { alias },
};

function script(entry, name, file, emptyOutDir) {
  return build({
    ...shared,
    build: {
      outDir: "dist",
      emptyOutDir,
      minify: false,
      lib: { entry, name, formats: ["iife"], fileName: () => file },
    },
  });
}

await script("src/background/index.ts", "RyuuNestBackground", "background.js", true);
await script("src/content/index.ts", "RyuuNestContent", "content.js", false);

await build({
  ...shared,
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    minify: false,
    rollupOptions: { input: { options: at("options.html") } },
  },
});

copyFileSync(at("manifest.json"), at("dist/manifest.json"));

const manifest = JSON.parse(readFileSync(at("dist/manifest.json"), "utf8"));
const referenced = [
  manifest.background?.service_worker,
  ...(manifest.background?.scripts ?? []),
  ...(manifest.content_scripts ?? []).flatMap((entry) => entry.js ?? []),
  manifest.options_ui?.page,
].filter((file) => typeof file === "string");
const missing = referenced.filter((file) => !existsSync(at(`dist/${file}`)));
if (missing.length > 0) {
  throw new Error(`El manifiesto nombra archivos que el build no produjo: ${missing.join(", ")}`);
}
