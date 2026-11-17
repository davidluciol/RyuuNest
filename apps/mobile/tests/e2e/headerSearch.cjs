// F60 — búsqueda global de la cabecera (lleva a Aventuras con la consulta) y F50 — hoja de
// etiquetas en la galería. Ejecutar con el cliente servido: node apps/mobile/tests/e2e/headerSearch.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { newSeededContext } = require("./seedDb.cjs");

// Portadas del sitio falso (`test-site`) servidas en local; el resto de hosts externos sigue abortado (RNF-5).
const FAKE_COVER_HOSTS = new Set(["sitio-html.test", "api-json.test"]);
const FAKE_COVER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="180"><rect width="120" height="180" fill="#263147"/></svg>';
const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await newSeededContext(browser, { viewport: { width, height: 900 } });
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
        if (FAKE_COVER_HOSTS.has(url.host) && /^\/img\/.+\.svg$/.test(url.pathname)) {
          return route.fulfill({ status: 200, contentType: "image/svg+xml", body: FAKE_COVER_SVG });
        }
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      // F60: desde Ajustes, la lupa de la cabecera abre el campo y lleva a Aventuras.
      await page.goto(`${baseURL}/settings`);
      const header = page.getByTestId("shell-header");
      await header.getByRole("button", { name: "Buscar", exact: true }).click();
      await header.getByPlaceholder("Buscar obras…").fill("dragon");
      await page.keyboard.press("Enter");
      await page.getByTestId("screen-discover").waitFor({ state: "visible" });
      await page.getByText("El dragón de ceniza").first().waitFor({ state: "visible" });
      // Con consulta solo hay resultados (sin filas) y el campo de Aventuras sigue a la consulta.
      assert.equal(await page.getByText("Más recientes").count(), 0);
      assert.equal(await page.getByPlaceholder("Buscar obras…").inputValue(), "dragon");
      // El campo de la cabecera se cerró.
      await header.getByRole("button", { name: "Buscar", exact: true }).waitFor({ state: "visible" });

      // Repetir la misma consulta desde otra pestaña vuelve a lanzarla.
      await page.getByPlaceholder("Buscar obras…").fill("");
      await page.keyboard.press("Enter");
      await page.getByText("Más recientes").waitFor({ state: "visible" });
      await page.goto(`${baseURL}/settings`);
      await header.getByRole("button", { name: "Buscar", exact: true }).click();
      await header.getByPlaceholder("Buscar obras…").fill("quimera");
      await page.keyboard.press("Enter");
      await page.getByText("Buscó por todas partes").waitFor({ state: "visible" });

      // Cerrar sin buscar.
      await header.getByRole("button", { name: "Buscar", exact: true }).click();
      await header.getByRole("button", { name: "Cerrar búsqueda" }).click();
      await header.getByRole("button", { name: "Buscar", exact: true }).waitFor({ state: "visible" });

      // F50: hoja de etiquetas en la galería, multiselección y «Limpiar».
      await page.goto(`${baseURL}/_dev/gallery`, { timeout: 120000 });
      await page.getByTestId("gallery-show-tag-filter-sheet").click();
      const sheet = page.getByTestId("tag-filter-sheet");
      await sheet.waitFor({ state: "visible" });
      const group = page.getByTestId("tag-filter-group-genre");
      await group.getByText("Seinen").click();
      await group.getByText("Shonen").click();
      await page.getByTestId("tag-filter-clear").click();
      await page.getByTestId("tag-filter-done").click();
      await sheet.waitFor({ state: "detached" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      await context.close();
    }
    console.log("headerSearch e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
