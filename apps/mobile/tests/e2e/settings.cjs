// F16b — Ajustes en web: la sección «Seguridad» con el interruptor de
// «Protección de instalación» (RF-7). En web no hay bloqueo del dispositivo
// (SPEC §5.3): la fila avisa y el interruptor queda deshabilitado; la fila de
// restaurar el repo oficial solo aparece si falta (P-85). Sin errores de
// consola ni dominios externos (RNF-5).
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/settings.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SETTINGS_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF16b");

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

      await fs.mkdir(output, { recursive: true });
      const shot = async (name) => {
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
      };

      await page.goto(`${baseURL}/settings`);
      await page.getByTestId("screen-settings").waitFor({ state: "visible" });

      // La fila de protección: etiqueta, aviso sin bloqueo e interruptor inerte.
      await page.getByText("Seguridad").waitFor({ state: "visible" });
      await page.getByText("Protección de instalación").waitFor({ state: "visible" });
      await page
        .getByText("Este dispositivo no tiene bloqueo configurado")
        .waitFor({ state: "visible" });
      const toggle = page.getByTestId("settings-protection-switch");
      await toggle.waitFor({ state: "visible" });
      // react-native-web marca el disabled en el input nativo del interruptor.
      const toggleInput = toggle.locator("input");
      assert.ok(await toggleInput.isDisabled(), `interruptor activo @${width}`);
      await shot("ajustes");

      // Sin bloqueo, tocar el interruptor no lo activa (falla cerrado, RF-7).
      await toggle.click();
      await page.waitForTimeout(300);
      assert.equal(
        await toggleInput.isChecked(),
        false,
        `el interruptor se activó sin bloqueo @${width}`,
      );

      // El repo oficial está registrado en el ejemplo: no hay fila de restaurar.
      assert.equal(await page.getByText("Repositorio oficial").count(), 0, `fila inesperada @${width}`);

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);

      await context.close();
    }
    console.log("settings e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
