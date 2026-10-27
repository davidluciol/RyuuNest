// F15 — Descubrir en web: se monta el módulo declarativo de `test-site` con el
// runtime real del núcleo, sin errores ni dominios externos. La búsqueda filtra
// en el propio módulo (RF-10) y el selector oculta el módulo NSFW (RF-35).
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/discover.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF15");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1400 } });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      const external = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      await page.goto(`${baseURL}/discover`);
      await page.getByTestId("app-shell").waitFor({ state: "visible" });

      // El runtime trae las series del sitio falso (no fixtures escritas a mano).
      await page.getByText("El dragón de ceniza").first().waitFor({ state: "visible" });
      await page.getByText("Más recientes").waitFor({ state: "visible" });
      await page.getByText("Populares").waitFor({ state: "visible" });
      await page.getByText("Explorar catálogo").waitFor({ state: "visible" });

      // El selector muestra el módulo activo; B (NSFW) no está visible (RF-35).
      await page.getByRole("button", { name: "Cambiar de módulo" }).waitFor({ state: "visible" });
      assert.equal(await page.getByText("Módulo de ejemplo B").count(), 0);

      // Paginación (RF-10): página 1 con siguiente; al avanzar, anterior activa.
      await page.getByText("Página 1").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Siguiente" }).click();
      await page.getByText("Página 2").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Anterior" }).click();
      await page.getByText("Página 1").waitFor({ state: "visible" });

      // Búsqueda dentro del módulo (RF-10).
      await page.getByPlaceholder("Buscar obras…").fill("quimera");
      await page.keyboard.press("Enter");
      await page.getByText("Buscó por todas partes").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Explorar de nuevo" }).click();
      await page.getByText("El dragón de ceniza").first().waitFor({ state: "visible" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);

      await fs.mkdir(output, { recursive: true });
      if (width === 426) {
        await page.screenshot({ path: path.join(output, "descubrir-426.png"), fullPage: true });
      }
      if (width === 1440) {
        await page.screenshot({ path: path.join(output, "descubrir-1440.png"), fullPage: true });
      }
      await context.close();
    }
    console.log("discover e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
