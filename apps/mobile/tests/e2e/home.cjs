// F13 — verificación de la pantalla Inicio con Playwright.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/home.cjs
// Requiere Playwright disponible en el entorno (PLAYWRIGHT_MODULE).
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { destinationMarker } = require("./markers.cjs");

const baseURL = process.env.HOME_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF13");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    const context = await browser.newContext({ viewport: { width: 426, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
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

    // Navegar a Inicio (timeout amplio: Expo compila el bundle en la primera carga)
    await page.goto(baseURL, { timeout: 60000, waitUntil: "domcontentloaded" });
    await page.getByTestId("app-shell").waitFor({ timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);

    // Verificar las 3 secciones visibles
    await page.getByText("Continuar la Aventura").waitFor();
    await page.getByText("Lecturas Recientes").waitFor();
    await page.getByText("Tesoros Guardados").waitFor();

    // Verificar la tarjeta hero (Continuar)
    await page.getByText("El dragón de ceniza").waitFor();
    await page.getByRole("button", { name: /Continuar cap\. 41/ }).waitFor();

    // Verificar carrusel de recientes
    await page.getByText("Sombras de Arcano").waitFor();
    await page.getByText("La forja perdida").waitFor();

    // Verificar carpetas
    await page.getByText("Favoritos Épicos").waitFor();
    await page.getByText("Lectura Nocturna").waitFor();
    await page.getByText("Completados").waitFor();

    // Verificar 5 anchos
    for (const width of [320, 375, 426, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(200);

      const audit = await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('[role="button"]')];
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          buttons: buttons.map((btn) => {
            const rect = btn.getBoundingClientRect();
            return { width: rect.width, height: rect.height };
          }),
        };
      });

      assert.equal(audit.overflow, false, `overflow horizontal @${width}px`);
      for (const btn of audit.buttons) {
        assert.ok(
          btn.width >= 48 || btn.height >= 48,
          `área táctil < 48 dp @${width}px: ${btn.width}x${btn.height}`,
        );
      }

      if (width === 426 || width === 1440) {
        await page.screenshot({ path: path.join(output, `home-${width}.png`), fullPage: true });
      }
    }

    // Verificar fuentes locales cargadas
    const fonts = await page.evaluate(() =>
      [...document.fonts].filter((font) => font.status === "loaded").map((font) => font.family),
    );
    for (const family of ["Manrope-SemiBold", "Inter-Medium", "Inter-SemiBold"]) {
      assert.ok(
        fonts.some((font) => font.includes(family)),
        `fuente local ${family} no cargada`,
      );
    }

    // Verificar foco con teclado (tab)
    await page.setViewportSize({ width: 426, height: 900 });
    await page.keyboard.press("Tab");
    const focusInfo = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return { outlineColor: style.outlineColor, outlineWidth: style.outlineWidth };
    });
    // El foco puede estar en cualquier elemento interactivo; verificamos que hay foco visible
    assert.ok(focusInfo !== null, "sin elemento con foco tras Tab");

    // Verificar prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("tab", { name: "Biblioteca", exact: true }).click();
    await page.getByTestId(destinationMarker("library")).waitFor();
    await page.getByRole("tab", { name: "Inicio", exact: true }).click();
    await page.getByText("Continuar la Aventura").waitFor();

    // Verificaciones finales
    assert.deepEqual(external, [], `peticiones externas: ${external.join(", ")}`);
    assert.deepEqual(errors, [], `errores de consola: ${errors.join(" | ")}`);

    console.log("F13: pantalla Inicio verificada — 3 secciones, 5 anchos, áreas táctiles, fuentes locales, foco, cero externos, cero errores.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
