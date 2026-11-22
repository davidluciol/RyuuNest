// F22 — densidad TV simulada por userAgent: riel lateral en lugar de la barra inferior,
// los 5 destinos recorridos solo con teclado (Tab, flechas, Enter; equivale al D-pad),
// anillo de foco 2 px accent con separación 2 px, tamaños ×1,25 y márgenes seguros.
// En 960 px (pantalla de TV en dp) y 1440 px. A 426 px (ventana estrecha) vuelve la barra
// inferior y se recorre igual con Tab y Enter. Ejecutar con el export servido (serve.cjs):
// node apps/mobile/tests/e2e/tvRail.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { fulfillFakeCover, newSeededContext } = require("./seedDb.cjs");
const { destinationMarker } = require("./markers.cjs");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF22");
const TV_UA =
  "Mozilla/5.0 (Linux; Android 9; MIBOX4 Build/PI) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 SmartTV";
const destinations = [
  ["Guarida", "/", "home"],
  ["Tesoros", "/library", "library"],
  ["Aventuras", "/discover", "discover"],
  ["Portales", "/sources", "sources"],
  ["Ajustes", "/settings", "settings"],
];
const ACCENT = "rgb(53, 201, 138)";

async function openPage(browser, width, userAgent, height = 900) {
  const context = await newSeededContext(browser, {
    viewport: { width, height },
    ...(userAgent ? { userAgent } : {}),
  });
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
  await page.goto(baseURL);
  await page.getByTestId("app-shell").waitFor();
  await page.evaluate(() => document.fonts.ready);
  return { context, page, errors, external };
}

/** Nombre accesible y estilo de foco del elemento enfocado. */
function focusedTab(page) {
  return page.evaluate(() => {
    const el = document.activeElement;
    const style = getComputedStyle(el);
    return {
      role: el.getAttribute("role"),
      label: el.getAttribute("aria-label"),
      outline: [style.outlineColor, style.outlineWidth, style.outlineOffset, style.outlineStyle],
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    await fs.mkdir(output, { recursive: true });
    for (const [width, height] of [
      [960, 540],
      [1440, 900],
    ]) {
      const { context, page, errors, external } = await openPage(browser, width, TV_UA, height);
      // Riel: un tablist vertical a la izquierda, dentro de los márgenes seguros.
      assert.equal(await page.getByRole("tablist").count(), 1);
      const layout = await page.evaluate(() => {
        const tabs = [...document.querySelectorAll('[role="tab"]')].map((tab) => {
          const rect = tab.getBoundingClientRect();
          const label = tab.querySelector('[data-testid="nav-label"]');
          return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            fontSize: getComputedStyle(label).fontSize,
            clipped:
              label.scrollWidth > label.clientWidth || label.scrollHeight > label.clientHeight,
          };
        });
        const rail = document.querySelector('[role="tablist"]').getBoundingClientRect();
        return { tabs, rail, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(layout.overflow, false, `overflow @${width}`);
      assert.ok(layout.rail.x >= 48, `margen seguro izquierdo @${width}: ${layout.rail.x}`);
      assert.ok(layout.rail.y >= 32, `margen seguro superior @${width}: ${layout.rail.y}`);
      assert.equal(layout.rail.width, 240, `ancho del riel @${width}`);
      for (const [i, tab] of layout.tabs.entries()) {
        assert.equal(tab.x, layout.tabs[0].x, `riel vertical @${width}`);
        if (i > 0) assert.ok(tab.y > layout.tabs[i - 1].y, `orden vertical @${width}`);
        assert.ok(tab.width >= 48 && tab.height >= 60, `área ×1,25 @${width}`);
        assert.equal(tab.fontSize, "15px", `etiqueta ×1,25 @${width}`);
        assert.equal(tab.clipped, false, `etiqueta cortada @${width}`);
      }

      // Solo teclado: Tab hasta el riel, flechas entre destinos, Enter para entrar.
      for (let i = 0; i < 30; i += 1) {
        const focus = await focusedTab(page);
        if (focus.role === "tab") break;
        await page.keyboard.press("Tab");
      }
      let focus = await focusedTab(page);
      assert.equal(focus.role, "tab", `Tab alcanza el riel @${width}`);
      assert.match(focus.label, /^Guarida/);
      for (const [index, [label, route, id]] of destinations.entries()) {
        if (index > 0) await page.keyboard.press("ArrowDown");
        focus = await focusedTab(page);
        assert.match(focus.label, new RegExp(`^${label}(, |$)`), `foco en ${label} @${width}`);
        assert.deepEqual(focus.outline, [ACCENT, "2px", "2px", "solid"], `anillo ${label}`);
        await page.keyboard.press("Enter");
        await page.waitForURL((url) => url.pathname === route);
        await page.getByTestId(destinationMarker(id)).waitFor({ state: "visible" });
        assert.equal(
          await page.getByRole("tab", { name: new RegExp(`^${label}(, |$)`), selected: true }).count(),
          1,
        );
        focus = await focusedTab(page);
        assert.match(focus.label, new RegExp(`^${label}(, |$)`), `foco tras Enter ${label}`);
        if (index === 2) {
          await page.screenshot({ path: path.join(output, `tv-rail-foco-${width}.png`) });
        }
      }
      // Los extremos no dan la vuelta y arriba vuelve atrás.
      await page.keyboard.press("ArrowDown");
      assert.match((await focusedTab(page)).label, /^Ajustes/);
      await page.keyboard.press("ArrowUp");
      assert.match((await focusedTab(page)).label, /^Portales/);
      await page.screenshot({ path: path.join(output, `tv-rail-${width}.png`), fullPage: true });
      assert.deepEqual(external, [], `peticiones externas @${width}`);
      assert.deepEqual(errors, [], `consola @${width}`);
      await context.close();
    }

    // Ventana de TV estrecha: barra inferior, recorrida con Tab y Enter.
    const { context, page, errors, external } = await openPage(browser, 426, TV_UA);
    const ys = await page.evaluate(() =>
      [...document.querySelectorAll('[role="tab"]')].map((tab) => tab.getBoundingClientRect().y),
    );
    assert.equal(new Set(ys).size, 1, "barra inferior en una fila");
    assert.ok(ys[0] > 700, "barra abajo");
    for (const [label, route, id] of destinations) {
      for (let i = 0; i < 40; i += 1) {
        const focus = await focusedTab(page);
        if (focus.role === "tab" && new RegExp(`^${label}(, |$)`).test(focus.label)) break;
        await page.keyboard.press("Tab");
      }
      const focus = await focusedTab(page);
      assert.match(focus.label, new RegExp(`^${label}(, |$)`), `Tab hasta ${label} @426`);
      assert.deepEqual(focus.outline, [ACCENT, "2px", "2px", "solid"], `anillo ${label} @426`);
      await page.keyboard.press("Enter");
      await page.waitForURL((url) => url.pathname === route);
      await page.getByTestId(destinationMarker(id)).waitFor({ state: "visible" });
      if (id === "library") {
        await page.screenshot({ path: path.join(output, "tv-estrecha-barra-foco-426.png") });
      }
    }
    assert.deepEqual(external, []);
    assert.deepEqual(errors, []);
    await context.close();
    console.log("F22: riel TV a 960 y 1440 px y barra a 426 px; 5 destinos solo con teclado, foco y privacidad OK.");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
