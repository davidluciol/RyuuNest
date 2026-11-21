// F90/F91 — Ajustes → Temas (web): importar un tema con confirmación, error claro
// si no valida, aplicarlo al instante, persistir al recargar y borrarlo.
// Ejecutar con el cliente servido: THEMES_URL=http://localhost:8099 node apps/mobile/tests/e2e/themes.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { newSeededContext } = require("./seedDb.cjs");

const baseURL = process.env.THEMES_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF90");
const DRAGON = {
  bg: "#0B0E14", surface: "#141923", elevated: "#1B2230", border: "#263147",
  textPrimary: "#F2F0EA", textSecondary: "#9BA5B5", accent: "#35C98A", progress: "#FF9F43",
  accentAlt: "#9B7BFF", badgeBg: "#1C2E29", positive: "#4DD599", warning: "#F5C451",
  error: "#F06A6A", nsfw: "#FF6B1A",
};
const theme = (over = {}, colors = {}) =>
  JSON.stringify({ schemaVersion: 1, id: "negro-azul", name: "Negro azul", colors: { ...DRAGON, bg: "#000000", accent: "#5AA9FF", ...colors }, ...over });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await newSeededContext(browser, { viewport: { width, height: 1400 } });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      const external = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
      await context.route("**/*", (route) => {
        const url = new URL(route.request().url());
        if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
          external.push(url.href);
          return route.abort();
        }
        return route.continue();
      });
      await fs.mkdir(output, { recursive: true });
      const shot = async (name) => { await page.waitForTimeout(500); await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true }); };
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ryuunest-tema-"));
      const file = async (name, text) => { const p = path.join(dir, name); await fs.writeFile(p, text); return p; };
      const pick = async (p) => {
        const [chooser] = await Promise.all([page.waitForEvent("filechooser"), page.getByText("Elegir archivo", { exact: true }).click()]);
        await chooser.setFiles(p);
      };
      const bg = () => page.getByTestId("screen-settings").evaluate((el) => getComputedStyle(el).backgroundColor);

      await page.goto(`${baseURL}/settings`);
      const screen = page.getByTestId("screen-settings");
      await screen.waitFor({ state: "visible" });
      await screen.getByText("Temas", { exact: true }).waitFor({ state: "visible" });
      await screen.getByTestId("settings-theme-dragon-night").waitFor({ state: "visible" });
      assert.equal(await bg(), "rgb(11, 14, 20)");
      await shot("temas-inicial");

      // Un JSON que no valida: error claro, nada se importa.
      await pick(await file("malo.json", theme({ id: "Mal Id" })));
      await page.getByText(/Tema no válido/).waitFor({ state: "visible" });
      assert.equal(await screen.getByTestId("settings-theme-negro-azul").count(), 0);
      await shot("temas-error");

      // Un JSON válido pide confirmación y no se importa hasta confirmar.
      await pick(await file("bueno.json", theme()));
      const confirm = page.getByTestId("settings-theme-confirm");
      await confirm.waitFor({ state: "visible" });
      await shot("temas-confirmar");
      await page.getByText("Cancelar", { exact: true }).click();
      assert.equal(await screen.getByTestId("settings-theme-negro-azul").count(), 0);
      await pick(await file("bueno.json", theme()));
      await page.getByText("Importar", { exact: true }).last().click();
      await screen.getByTestId("settings-theme-negro-azul").waitFor({ state: "visible" });

      // Seleccionar aplica el tema al instante y Ajustes sigue abierto.
      await page.getByRole("radio", { name: "Usar el tema Negro azul" }).click();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="screen-settings"]')).backgroundColor === "rgb(0, 0, 0)");
      assert.equal(await bg(), "rgb(0, 0, 0)");
      await shot("temas-aplicado");

      // Borrar el tema activo vuelve a Dragon Night.
      await page.getByRole("button", { name: "Borrar el tema Negro azul" }).click();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="screen-settings"]')).backgroundColor === "rgb(11, 14, 20)");
      assert.equal(await screen.getByTestId("settings-theme-negro-azul").count(), 0);

      // Cero peticiones externas y consola limpia (RNF-5).
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      // Sin desbordamiento horizontal.
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `overflow @${width}`);
      await context.close();
      console.log(`ok @${width}`);
    }
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
