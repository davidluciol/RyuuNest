// F25 — Fuentes en la web servida por `vite preview`: con la base vacía se
// añade solo el repo oficial (P-85), se listan sus módulos y se instala uno
// real (descarga del .zip desde GitHub raw, CORS abierto; P-111 temporal).
// El módulo script exige confirmación reforzada (mantener pulsado, AC-8) y la
// instalación persiste en IndexedDB (recarga y sigue instalado).
// Sin errores de consola ni peticiones a dominios que no sean el del repo.
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/sources.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";
const REPO_HOST = "raw.githubusercontent.com";
const output = path.resolve(__dirname, "../../../../docs/capturasF24");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [1440, 426]) {
      const context = await browser.newContext({ viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      const errors = [];
      const external = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host && url.host !== REPO_HOST) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      await page.goto(`${baseURL}/sources`);
      await page.getByTestId("screen-sources").waitFor({ state: "visible" });

      // P-85: sin repos, se registra solo el oficial y listan sus módulos.
      await page.locator('[data-testid^="repo-"]').first().waitFor({ state: "visible" });
      await page.getByTestId("module-zonatmo").waitFor({ state: "visible" });

      // Diálogo "Añadir repositorio": URL inválida muestra su error y no rompe.
      await page.getByTestId("sources-add-repo").click();
      await page.getByTestId("add-repo-dialog").waitFor({ state: "visible" });
      await page.getByTestId("add-repo-url").fill("no-es-una-url");
      await page.getByTestId("add-repo-submit").click();
      await page.getByText("Esa URL no es válida.").waitFor({ state: "visible" });
      await page.getByTestId("add-repo-dialog").locator("button[aria-label]").first().click();

      // Instalar zonatmo (script → confirmación reforzada: mantener 1,5 s).
      await page.getByTestId("module-action-zonatmo").click();
      await page.getByTestId("install-dialog").waitFor({ state: "visible" });
      await page.getByText("Huella SHA-256").waitFor({ state: "visible" });
      const confirm = page.getByTestId("install-confirm");
      const box = await confirm.boundingBox();
      assert.ok(box, "botón de confirmar visible");
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(1700);
      await page.mouse.up();

      // Tras instalar, la fila pasa a "Gestionar" (módulo instalado en IndexedDB).
      await page.getByTestId("module-action-zonatmo").waitFor({ state: "visible" });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="module-action-zonatmo"]')?.textContent?.includes("Gestionar"),
        { timeout: 30000 },
      );

      await page.screenshot({ path: path.join(output, `sources-instalado-${width}.png`), fullPage: true });

      // Persistencia: recargar y el módulo sigue instalado.
      await page.reload();
      await page.getByTestId("screen-sources").waitFor({ state: "visible" });
      await page.waitForFunction(
        () => document.querySelector('[data-testid="module-action-zonatmo"]')?.textContent?.includes("Gestionar"),
        { timeout: 30000 },
      );

      assert.deepEqual(errors, [], `errores de consola/página a ${width} px: ${errors}`);
      assert.deepEqual(external, [], `peticiones externas no autorizadas a ${width} px: ${external}`);
      await context.close();
      console.log(`OK ${width} px`);
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
