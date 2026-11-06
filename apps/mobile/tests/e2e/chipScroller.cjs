// F34.3 — pista de desplazamiento de las filas de chips y anillo de foco de `Chip`
// en el export web de la app móvil:
//  - galería @426: la muestra con 10 chips desborda → degradado solo al final; al
//    desplazar a la mitad aparecen ambos; al llegar al final solo el inicial;
//  - Biblioteca @273 (ancho de referencia más estrecho): alguna fila recortada
//    muestra el degradado final y el degradado no intercepta toques;
//  - al tabular a un chip se dibuja el anillo de 2 px accent con 2 px de separación;
//  - sin errores de consola ni peticiones externas.
// Corre contra el export servido: node apps/mobile/tests/e2e/serve.cjs (8082)
//   GALLERY_URL=http://127.0.0.1:8082 node apps/mobile/tests/e2e/chipScroller.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.GALLERY_URL || "http://127.0.0.1:8082";
const ACCENT = "rgb(53, 201, 138)";

function attach(page, context) {
  page.errors = [];
  page.external = [];
  page.on("pageerror", (error) => page.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") page.errors.push(message.text());
  });
  return context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (["http:", "https:"].includes(url.protocol) && url.host !== new URL(baseURL).host) {
      page.external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
}

/** Degradados del contenedor de una fila (o de toda la página si no se da la fila). */
const fades = (page, scroller) =>
  (scroller ? scroller.evaluate.bind(scroller) : (fn) => page.evaluate(fn))((node) => {
    const root = node ? node.parentElement : document;
    return {
      start: root.querySelectorAll('[data-testid="chip-fade-start"]').length,
      end: root.querySelectorAll('[data-testid="chip-fade-end"]').length,
    };
  });

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    // 1) Galería: el ciclo completo de desplazamiento.
    {
      const context = await browser.newContext({ viewport: { width: 426, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      await attach(page, context);
      await page.goto(`${baseURL}/_dev/gallery`, {
        timeout: 120000,
        waitUntil: "domcontentloaded",
      });
      const chip = page.getByText("Filtro 1", { exact: true });
      await chip.waitFor({ state: "visible" });
      await page.waitForTimeout(300);

      const scroller = await chip.evaluateHandle((el) => {
        let node = el;
        while (
          node &&
          !(
            node.scrollWidth > node.clientWidth + 1 &&
            getComputedStyle(node).overflowX !== "visible"
          )
        )
          node = node.parentElement;
        return node;
      });
      assert.ok(
        await scroller.evaluate((n) => Boolean(n)),
        "no se encontró la fila de chips desplazable",
      );

      let state = await fades(page, scroller);
      assert.deepEqual(state, { start: 0, end: 1 }, "al inicio: solo degradado final");

      await scroller.evaluate((n) => (n.scrollLeft = (n.scrollWidth - n.clientWidth) / 2));
      await page.waitForTimeout(200);
      state = await fades(page, scroller);
      assert.deepEqual(state, { start: 1, end: 1 }, "a mitad: ambos degradados");

      await scroller.evaluate((n) => (n.scrollLeft = n.scrollWidth));
      await page.waitForTimeout(200);
      state = await fades(page, scroller);
      assert.deepEqual(state, { start: 1, end: 0 }, "al final: solo degradado inicial");

      // El degradado no intercepta toques.
      const pe = await scroller.evaluate(
        (n) =>
          getComputedStyle(n.parentElement.querySelector('[data-testid="chip-fade-start"]'))
            .pointerEvents,
      );
      assert.equal(pe, "none", "el degradado debe tener pointer-events: none");

      // Anillo de foco en un Chip real.
      await scroller.evaluate((n) => (n.scrollLeft = 0));
      await page.evaluate(() => document.activeElement && document.activeElement.blur());
      let ring = null;
      for (let i = 0; i < 40 && !ring; i += 1) {
        await page.keyboard.press("Tab");
        ring = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || !/^Filtro \d+$/.test((el.textContent || "").trim())) return null;
          const cs = getComputedStyle(el);
          return {
            style: cs.outlineStyle,
            width: cs.outlineWidth,
            offset: cs.outlineOffset,
            color: cs.outlineColor,
          };
        });
      }
      assert.ok(ring, "el teclado no llegó a un chip de la muestra");
      assert.deepEqual(
        ring,
        { style: "solid", width: "2px", offset: "2px", color: ACCENT },
        "anillo de foco del chip",
      );

      assert.deepEqual(page.errors, [], `errores de consola galería: ${page.errors.join(" | ")}`);
      assert.deepEqual(
        page.external,
        [],
        `peticiones externas galería: ${page.external.join(", ")}`,
      );
      await context.close();
      console.log("galería @426: degradado inicio/mitad/final y anillo OK");
    }

    // 2) Biblioteca a 273 px: alguna fila recortada con degradado, sin desborde de página.
    {
      const context = await browser.newContext({ viewport: { width: 273, height: 900 } });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      await attach(page, context);
      await page.goto(`${baseURL}/library`);
      await page.getByTestId("app-shell").waitFor({ state: "visible" });
      await page.getByText("El dragón de ceniza").waitFor({ state: "visible" });
      await page.waitForTimeout(300);
      const state = await fades(page);
      assert.ok(
        state.end >= 1,
        `Biblioteca @273: ninguna fila recortada muestra degradado final (${JSON.stringify(state)})`,
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
        false,
        "desbordamiento horizontal @273",
      );
      assert.deepEqual(
        page.errors,
        [],
        `errores de consola biblioteca: ${page.errors.join(" | ")}`,
      );
      assert.deepEqual(
        page.external,
        [],
        `peticiones externas biblioteca: ${page.external.join(", ")}`,
      );
      await context.close();
      console.log(`Biblioteca @273: ${state.end} degradados finales OK`);
    }
    console.log("chipScroller e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
