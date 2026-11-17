// F31 — errores visibles de las pantallas con datos reales (ficha de serie y lector) a 426 y
// 1440 px: estado de error con causa, código, «Reintentar» (≥ 48 dp), detalle técnico
// desplegable sin «…» en la URL, sin desbordamiento horizontal y cero peticiones externas.
// La web de ejemplo monta `test-site` en memoria: una serie o un capítulo que no existen
// hacen fallar al módulo. Fuentes y Respaldo ya se prueban en sources.cjs y backup.cjs.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/screenErrors.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { newSeededContext } = require("./seedDb.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await newSeededContext(browser, { viewport: { width, height: 1000 } });
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

      const noOverflow = async (label) =>
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
          false,
          `desbordamiento horizontal en ${label} @${width}`,
        );

      // Ficha: la serie no existe → ErrorState con «Reintentar».
      await page.goto(`${baseURL}/series/m-ejemplo-a/no-existe`);
      const seriesError = page.getByTestId("screen-series-error");
      await seriesError.waitFor({ state: "visible" });
      const retry = seriesError.getByRole("button", { name: "Reintentar", exact: true });
      await retry.waitFor({ state: "visible" });
      const box = await retry.boundingBox();
      assert.ok(box && box.height >= 48, `«Reintentar» < 48 dp en la ficha @${width}`);
      await seriesError.getByRole("button", { name: "Ver detalle", exact: true }).click();
      await seriesError.getByText(/^código: /).waitFor({ state: "visible" });
      assert.equal(await seriesError.getByText("…").count(), 0, `detalle cortado con «…» @${width}`);
      await noOverflow("la ficha");

      // Lector: el capítulo no existe → banner de error con código, reintentar y volver.
      await page.goto(`${baseURL}/reader/m-ejemplo-a/dragon-de-ceniza/no-existe`);
      const readerError = page.getByTestId("screen-reader-error");
      await readerError.waitFor({ state: "visible" });
      await readerError.getByTestId("error-code-chip").waitFor({ state: "visible" });
      const readerRetry = readerError.getByRole("button", { name: "Reintentar", exact: true });
      const readerBox = await readerRetry.boundingBox();
      assert.ok(readerBox && readerBox.height >= 48, `«Reintentar» < 48 dp en el lector @${width}`);
      await readerError.getByRole("button", { name: "Volver", exact: true }).waitFor({ state: "visible" });
      await noOverflow("el lector");

      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      await context.close();
    }
    console.log("screenErrors e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
