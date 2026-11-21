// F45 — aviso de primera vez al elegir un módulo NSFW: sale una sola vez por módulo,
// explica qué es NSFW y «Volver» no lo marca como visto.
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/nsfwNotice.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { newSeededContext } = require("./seedDb.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await newSeededContext(browser, { viewport: { width: 426, height: 1400 } });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    // Mostrar contenido NSFW desde Ajustes para que el módulo B aparezca en el selector.
    await page.goto(`${baseURL}/settings`);
    await page.getByTestId("settings-nsfw-switch").click();
    await page.goto(`${baseURL}/discover`);
    await page.getByRole("button", { name: "Cambiar de módulo" }).waitFor({ state: "visible" });

    const pickB = async () => {
      await page.getByRole("button", { name: "Cambiar de módulo" }).click();
      await page.getByText("Módulo de ejemplo B").click();
    };

    await pickB();
    const sheet = page.getByTestId("sheet-nsfw-notice");
    await sheet.waitFor({ state: "visible" });
    await sheet.getByText("contenido para adultos, sexual o explícito").waitFor({ state: "visible" });

    // «Volver» no lo marca como visto: vuelve a un módulo que no es NSFW.
    await sheet.getByRole("button", { name: "Volver" }).click();
    await sheet.waitFor({ state: "detached" });
    await pickB();
    await sheet.waitFor({ state: "visible" });

    // «Entiendo, continuar» sí: no vuelve a salir para ese módulo.
    await sheet.getByRole("button", { name: "Entiendo, continuar" }).click();
    await sheet.waitFor({ state: "detached" });
    await page.getByRole("button", { name: "Cambiar de módulo" }).click();
    await page.getByText("Módulo de ejemplo A").click();
    await pickB();
    await page.waitForTimeout(500);
    assert.equal(await sheet.count(), 0, "el aviso no se repite");

    assert.deepEqual(errors, [], "errores de consola");
    console.log("nsfwNotice e2e OK");
  } finally {
    await browser.close();
  }
})();
