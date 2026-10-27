// F11 — regresión del CHROME del shell (cabecera, barra, foco, teclado, fuentes
// locales, historial y recarga) sobre los cinco destinos en cinco anchos.
// F11b: espera marcadores estables — `screen-<id>` en pantallas reales,
// `destination-<id>` en los marcos pendientes (ver markers.cjs) — para que
// sustituir un marco por su pantalla ya no rompa este script.
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/shell.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { destinationMarker } = require("./markers.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF11");
const destinations = [
  ["Inicio", "/", "home"],
  ["Biblioteca", "/library", "library"],
  ["Descubrir", "/discover", "discover"],
  ["Fuentes", "/sources", "sources"],
  ["Ajustes", "/settings", "settings"],
];

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext({ viewport: { width: 426, height: 900 } });
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
      if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
        external.push(url.href);
        return route.abort();
      }
      return route.continue();
    });
    await fs.mkdir(output, { recursive: true });
    await page.goto(baseURL);
    await page.getByTestId("app-shell").waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 375, 426, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [label, route, id] of destinations) {
        await page.getByRole("tab", { name: label, exact: true }).click();
        await page.waitForURL((url) => url.pathname === route);
        await page.getByTestId(destinationMarker(id)).waitFor({ state: "visible" });
        assert.equal(await page.getByTestId("shell-header").count(), 1);
        assert.equal(await page.getByRole("tablist").count(), 1);
        assert.equal(await page.getByRole("tab", { selected: true }).count(), 1);
        assert.equal(
          await page.getByRole("tab", { name: label, exact: true }).getAttribute("aria-selected"),
          "true",
        );
        const audit = await page.evaluate(() => {
          const tabs = [...document.querySelectorAll('[role="tab"]')];
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            tabs: tabs.map((tab) => {
              const rect = tab.getBoundingClientRect();
              const text = tab.querySelector('[data-testid="nav-label"]');
              return {
                width: rect.width,
                height: rect.height,
                color: getComputedStyle(text).color,
                clipped:
                  text.scrollWidth > text.clientWidth || text.scrollHeight > text.clientHeight,
              };
            }),
          };
        });
        assert.equal(audit.overflow, false, `overflow ${label} @${width}`);
        for (const tab of audit.tabs) {
          assert.ok(tab.width >= 48 && tab.height >= 48, `área táctil @${width}`);
          assert.equal(tab.clipped, false, `etiqueta cortada @${width}`);
          assert.ok(["rgb(53, 201, 138)", "rgb(155, 165, 181)"].includes(tab.color));
        }
        if (width === 426 || width === 1440) {
          await page.screenshot({ path: path.join(output, `${id}-${width}.png`), fullPage: true });
        }
      }
    }
    // Historial real del navegador y entrada directa, no solo cambio de color.
    await page.goto(`${baseURL}/library`);
    await page.getByTestId(destinationMarker("library")).waitFor();
    await page.getByRole("tab", { name: "Fuentes", exact: true }).click();
    await page.waitForURL("**/sources");
    await page.goBack();
    await page.getByTestId(destinationMarker("library")).waitFor({ state: "visible" });
    await page.reload();
    await page.getByRole("tab", { name: "Biblioteca", selected: true }).waitFor();
    await page.getByRole("tab", { name: "Inicio", exact: true }).focus();
    const focus = await page.getByRole("tab", { name: "Inicio", exact: true }).evaluate((el) => ({
      color: getComputedStyle(el).outlineColor,
      width: getComputedStyle(el).outlineWidth,
    }));
    assert.deepEqual(focus, { color: "rgb(53, 201, 138)", width: "2px" });
    await page.keyboard.press("Enter");
    await page.getByTestId(destinationMarker("home")).waitFor({ state: "visible" });
    const fonts = await page.evaluate(() =>
      [...document.fonts].filter((font) => font.status === "loaded").map((font) => font.family),
    );
    for (const family of ["Manrope-SemiBold", "Inter-Medium", "Inter-SemiBold"]) {
      assert.ok(
        fonts.some((font) => font.includes(family)),
        `fuente local ${family}`,
      );
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("tab", { name: "Ajustes", exact: true }).click();
    await page.getByTestId(destinationMarker("settings")).waitFor({ state: "visible" });
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    console.log(
      "F11: 5 destinos × 5 anchos, historial, recarga, teclado, foco, fuentes y privacidad OK.",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
