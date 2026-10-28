// F12 — el flujo de primer uso en la galería (Montaje interactivo sobre el
// servicio de ejemplo, vacío al empezar): bienvenida → añadir el repo oficial
// (URL ya puesta) → instalar un módulo con la confirmación de Fuentes (AC-8:
// cancelar no instala) → «Ir a leer». Y «Saltar» termina sin instalar nada.
// Sin errores de consola ni dominios externos (RNF-5). Corre contra Metro:
// node apps/mobile/tests/e2e/onboarding.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.GALLERY_URL || "http://localhost:8081";
const output = path.resolve(__dirname, "../../../../docs/capturasF12");

async function prepare(page) {
  const errors = [];
  const external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
      external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  return { errors, external };
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 1400 } });
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      const { errors, external } = await prepare(page);
      await fs.mkdir(output, { recursive: true });

      await page.goto(`${baseURL}/_dev/gallery`, { timeout: 120000, waitUntil: "domcontentloaded" });
      const scope = page.getByTestId("onboarding-sample");
      await scope.waitFor({ state: "visible", timeout: 120000 });

      // Paso 1: bienvenida con el dragón grande.
      await scope.getByTestId("onboarding-step-1").waitFor({ state: "visible" });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(output, `bienvenida-${width}.png`), fullPage: true });

      // Paso 2: la URL del repo oficial ya puesta; Continuar añade el repo.
      await scope.getByRole("button", { name: "Empezar" }).click();
      await scope.getByTestId("onboarding-step-2").waitFor({ state: "visible" });
      const urlField = scope.getByLabel("URL del índice");
      assert.match(await urlField.inputValue(), /^https:\/\/.*index\.json$/, `URL sugerida @${width}`);
      await page.screenshot({ path: path.join(output, `paso2-${width}.png`), fullPage: true });
      await scope.getByRole("button", { name: "Continuar", exact: true }).click();
      await scope.getByTestId("onboarding-step-3").waitFor({ state: "visible" });

      // Paso 3: instalar con la confirmación de Fuentes (AC-8).
      await scope.getByTestId("onboarding-module-portal-duna").waitFor({ state: "visible" });
      await page.screenshot({ path: path.join(output, `paso3-${width}.png`), fullPage: true });
      await scope
        .getByTestId("onboarding-module-portal-duna")
        .getByRole("button", { name: "Instalar" })
        .click();
      await page.getByTestId("sheet-install").waitFor({ state: "visible" });
      await page.getByText("Dominios permitidos").waitFor({ state: "visible" });

      // Cancelar la confirmación no instala nada (AC-8).
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      await page.getByTestId("sheet-install").waitFor({ state: "detached" });
      await scope
        .getByTestId("onboarding-module-portal-duna")
        .getByRole("button", { name: "Instalar" })
        .waitFor({ state: "visible" });

      // Confirmar instala y la fila pasa a gestionarse.
      await scope
        .getByTestId("onboarding-module-portal-duna")
        .getByRole("button", { name: "Instalar" })
        .click();
      await page.getByTestId("sheet-install").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Instalar", exact: true }).last().click();
      await page.getByTestId("sheet-install").waitFor({ state: "detached" });
      await scope
        .getByTestId("onboarding-module-portal-duna")
        .getByRole("button", { name: "Gestionar" })
        .waitFor({ state: "visible" });

      // «Ir a leer» completa el primer uso.
      await scope.getByRole("button", { name: "Ir a leer" }).click();
      await page.getByText("Primer uso completado").waitFor({ state: "visible" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);

      // Recarga limpia: «Saltar» también completa, sin añadir nada.
      await page.reload({ waitUntil: "domcontentloaded" });
      const scope2 = page.getByTestId("onboarding-sample");
      await scope2.waitFor({ state: "visible", timeout: 120000 });
      await scope2.getByTestId("onboarding-step-1").waitFor({ state: "visible" });
      await scope2.getByRole("button", { name: "Saltar", exact: true }).click();
      await page.getByText("Primer uso completado").waitFor({ state: "visible" });

      await context.close();
    }
    console.log("onboarding e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
