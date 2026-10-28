// F17 — ficha de serie: metadatos, capítulos, estados, favorito y ruta fuera
// del shell de destinos. Se verifica con el bundle web y datos ficticios.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

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

      await page.goto(`${baseURL}/series/m-ejemplo-a/dragon-de-ceniza`);
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      await page.getByText("Ficha").waitFor({ state: "visible" });
      await page.getByText("Capítulo 1: Capítulo 1").waitFor({ state: "visible" });
      await page.getByText("Capítulo 2: Capítulo 2").waitFor({ state: "visible" });
      await page.getByText("Sin leer").waitFor({ state: "visible" });
      // Progreso de ejemplo de la fuente de lectura: capítulo 2, página 3 de 4 (2 / 4).
      await page.getByText("● 50%").waitFor({ state: "visible" });

      await page.getByRole("button", { name: "Guardar" }).click();
      await page.getByRole("button", { name: "Guardada" }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Carpeta" }).waitFor({ state: "visible" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      await context.close();
    }
    console.log("series e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
