// F20 — Ajustes en web: preferencias globales, protección de instalación y
// acción real de caché. En web no hay bloqueo del dispositivo (SPEC §5.3),
// pero sí se puede cambiar NSFW y el modo global. Sin errores de consola ni
// dominios externos (RNF-5).
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/settings.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SETTINGS_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF20");

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

      // Ajustes globales: idioma disponible, modo y caché sin cifras inventadas.
      await page.getByText("Idioma").waitFor({ state: "visible" });
      await page.getByText("Español").waitFor({ state: "visible" });
      await page.getByText("Preferencias de lectura").waitFor({ state: "visible" });
      await page.getByText("Vertical continuo").waitFor({ state: "visible" });
      await page.getByText("Paginado D → I · Manga").waitFor({ state: "visible" });
      await page.getByText("Paginado I → D · Cómic").waitFor({ state: "visible" });
      await page.getByText("Almacenamiento y caché").waitFor({ state: "visible" });
      await page.getByText("Vaciar caché de imágenes").waitFor({ state: "visible" });

      const nsfwToggle = page.getByTestId("settings-nsfw-switch");
      const nsfwInput = nsfwToggle.locator("input");
      assert.equal(await nsfwInput.isChecked(), false, `NSFW no empieza apagado @${width}`);
      await nsfwToggle.click();
      await page.waitForTimeout(300);
      assert.equal(await nsfwInput.isChecked(), true, `NSFW no se pudo activar @${width}`);

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
      assert.equal(
        await page.getByText("Repositorio oficial").count(),
        0,
        `fila inesperada @${width}`,
      );

      // El ajuste se comparte con las pantallas que filtran contenido.
      await page.goto(`${baseURL}/library`);
      const libraryScreen = page.getByTestId("screen-library");
      await libraryScreen.waitFor({ state: "visible" });
      await libraryScreen.getByText("Draco de jade", { exact: true }).waitFor({ state: "visible" });
      await page.goto(`${baseURL}/discover`);
      const discoverScreen = page.getByTestId("screen-discover");
      await discoverScreen.waitFor({ state: "visible" });
      await discoverScreen
        .getByText("Draco de jade", { exact: true })
        .waitFor({ state: "visible" });

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
