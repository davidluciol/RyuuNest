// F49b — la base real de la web de Expo persiste: lo que se guarda sobrevive a recargar la página.
// Ejecutar con el export servido: node apps/mobile/tests/e2e/persistence.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { fulfillFakeCover, newSeededContext } = require("./seedDb.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await newSeededContext(browser, { viewport: { width, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(10000);
      const errors = [];
      const external = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (fulfillFakeCover(route, url)) return;
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });

      // Tesoros arranca con las 3 obras sembradas.
      await page.goto(`${baseURL}/library`);
      await page.getByText("Todo (3)").waitFor();

      // Tocar una obra de Tesoros abre su ficha (antes no pasaba nada).
      await page.getByRole("button", { name: "El dragón de ceniza", exact: true }).click();
      await page.waitForURL(/\/series\/m-ejemplo-a\/dragon-de-ceniza$/);

      // F95: el corazón guarda en Favoritos (estaba en otra carpeta; sigue guardada: Todo (3)).
      await page.getByRole("button", { name: "Favorito", exact: true }).click();
      await page.getByRole("button", { name: "En favoritos" }).waitFor();
      await page.waitForTimeout(1500); // la base se guarda en IndexedDB con una pausa

      // Al volver a Tesoros se relee la base sin recargar la página (la ficha guarda cambios).
      await page.goBack();
      await page.getByText("Todo (3)").waitFor();

      // Tras recargar sigue en Favoritos: su ficha lo muestra con el corazón lleno.
      await page.reload();
      await page.getByText("Todo (3)").waitFor();
      await page.getByRole("button", { name: "El dragón de ceniza", exact: true }).click();
      await page.getByRole("button", { name: "En favoritos" }).waitFor();

      // Quitar el corazón la deja en Gemas: sigue guardada.
      await page.getByRole("button", { name: "En favoritos" }).click();
      await page.getByRole("button", { name: "Favorito", exact: true }).waitFor();
      await page.waitForTimeout(1500);
      await page.goBack();
      await page.getByText("Todo (3)").waitFor();

      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      await context.close();
    }
    console.log("persistence e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
