// F17 — ficha de serie: metadatos, capítulos, estados, favorito y ruta fuera
// del shell de destinos. Se verifica con el bundle web y datos ficticios.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { newSeededContext } = require("./seedDb.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await newSeededContext(browser, { viewport: { width, height: 1400 } });
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

      // F95: la serie sembrada está en una carpeta propia, así que el corazón arranca vacío.
      await page.getByRole("button", { name: "Favorito", exact: true }).click();
      await page.getByRole("button", { name: "En favoritos" }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Guardar", exact: true }).waitFor({ state: "visible" });

      // F96: «Guardar» abre la hoja de carpetas; el corazón ya la dejó en Favoritos y elegir mueve.
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await page.getByTestId("save-folder-sheet").waitFor({ state: "visible" });
      await page.getByRole("button", { name: /^Favoritos · actual$/ }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Lectura Nocturna", exact: true }).click(); // mueve: ya no es favorito
      await page.getByRole("button", { name: "Favorito", exact: true }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await page.getByRole("button", { name: /^Lectura Nocturna · actual$/ }).waitFor({ state: "visible" });
      await page.getByTestId("save-folder-new").click();
      await page.getByTestId("new-folder-name").fill("Pendientes");
      await page.getByRole("button", { name: "Crear carpeta", exact: true }).click();
      await page.getByRole("button", { name: "Guardar", exact: true }).click();
      await page.getByRole("button", { name: /^Pendientes · actual$/ }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Favoritos", exact: true }).click(); // vuelve a Favoritos para el resto
      await page.getByRole("button", { name: "En favoritos", exact: true }).waitFor({ state: "visible" });

      // F17: el cap. 1 tiene dos grupos; su chip abre «Elegir grupo» y la elección vale para la
      // serie. El cap. 2 solo tiene uno: su chip es etiqueta (no es botón).
      assert.equal(await page.getByRole("button", { name: "Elegir grupo" }).count(), 1);
      await page.getByRole("button", { name: "Elegir grupo" }).click();
      await page.getByTestId("release-sheet").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Escuadrón Noche", exact: true }).click();
      await page.getByTestId("release-sheet").waitFor({ state: "hidden" });
      await page.getByText("Escuadrón Noche", { exact: true }).waitFor({ state: "visible" });
      await page.screenshot({ path: `${process.env.SHOTS_DIR || "."}/f17-release-${width}.png` });

      // P-126: el favorito se guarda (con su serie) y no se pierde al salir de la ficha y volver.
      await page.getByText("Capítulo 1: Capítulo 1").click();
      await page.getByTestId("screen-reader").waitFor({ state: "visible" });
      await page.goBack();
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "En favoritos" }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "En favoritos" }).click();
      await page.getByRole("button", { name: "Favorito", exact: true }).waitFor({ state: "visible" });

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
