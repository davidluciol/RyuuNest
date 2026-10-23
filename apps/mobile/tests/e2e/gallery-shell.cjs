// Contra Metro (`expo start --web --localhost --port 8081`); la galería es solo de desarrollo.
const assert = require("node:assert/strict");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.GALLERY_URL || "http://localhost:8081";

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const page = await browser.newPage({ viewport: { width: 426, height: 900 } });
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
    await page.goto(`${baseURL}/_dev/gallery`, { timeout: 120000 });
    const shells = page.getByTestId("app-shell");
    await shells.first().waitFor();
    assert.equal(await shells.count(), 3);
    const normal = shells.nth(0);
    await normal.getByRole("tab", { name: "Fuentes", exact: true }).click();
    await normal.getByTestId("destination-sources").waitFor();
    assert.equal(await normal.getByRole("tab", { name: "Fuentes", selected: true }).count(), 1);
    await normal.getByRole("tab", { name: "Biblioteca", exact: true }).focus();
    assert.equal(
      await normal
        .getByRole("tab", { name: "Biblioteca", exact: true })
        .evaluate((el) => getComputedStyle(el).outlineColor),
      "rgb(53, 201, 138)",
    );
    await normal.screenshot({
      path: path.resolve(__dirname, "../../../../docs/capturasF11/galeria-shell-foco.png"),
    });
    const loading = shells.nth(1);
    assert.equal(
      await loading
        .getByText("Cargando…", { exact: true })
        .evaluate((el) => getComputedStyle(el).fontFamily),
      "Manrope-SemiBold",
    );
    assert.equal(await loading.getByRole("tab", { disabled: true }).count(), 5);
    assert.equal(await loading.getByText("Cargando…", { exact: true }).count(), 1);
    const error = shells.nth(2);
    assert.equal(
      await error
        .getByText("El módulo falló", { exact: true })
        .evaluate((el) => getComputedStyle(el).fontFamily),
      "Manrope-SemiBold",
    );
    assert.equal(
      await error
        .getByText("El listado no se pudo leer.", { exact: true })
        .evaluate((el) => getComputedStyle(el).fontFamily),
      "Inter-Regular",
    );
    assert.equal(
      await error
        .getByText("Reintentar", { exact: true })
        .evaluate((el) => getComputedStyle(el).fontFamily),
      "Inter-SemiBold",
    );
    await error.getByText("Ver detalle", { exact: true }).click();
    await error.getByText("código: PARSE", { exact: true }).waitFor();
    const contained = await error.evaluate((root) => {
      const bounds = root.getBoundingClientRect();
      return [...root.querySelectorAll('[role="tablist"], [dir="auto"]')].every(
        (el) => el.getBoundingClientRect().bottom <= bounds.bottom,
      );
    });
    assert.equal(
      contained,
      true,
      "el error expandido y la barra caben dentro de la previsualización",
    );
    await error.screenshot({
      path: path.resolve(__dirname, "../../../../docs/capturasF11/galeria-shell-error.png"),
    });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    console.log("F11: galería con selección, foco, carga deshabilitada y error expandido OK.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
