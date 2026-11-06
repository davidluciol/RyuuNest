// F34.3 — anillo de foco, texto al 200 % y `prefers-reduced-motion` en la web
// servida por `vite preview`:
//  - al tabular, todo control enfocado dibuja un contorno sólido de 2 px
//    `accent` con separación de 2 px (DESIGN «Boundary Framing & Focus Rings»);
//  - al 200 % (el viewport a la mitad, igual que el zoom del navegador: 426 →
//    213 y 1440 → 720 px) no hay desborde horizontal ni texto recortado;
//  - con `prefers-reduced-motion: reduce` no queda ninguna animación ni
//    transición con duración.
// Sin errores de consola ni peticiones a dominios externos.
// Ejecutar con la build servida: WEB_URL=http://127.0.0.1:4173 node apps/web/tests/e2e/focusAndScale.cjs
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { installFakeExtension } = require("./fakeExtension.cjs");

const baseURL = process.env.WEB_URL || "http://127.0.0.1:4173";
const REPO_HOST = "raw.githubusercontent.com";
const ROUTES = ["/", "/library", "/discover", "/sources", "/settings", "/diagnostics"];
const MAX_TABS = 40;

function hexToRgb(hex) {
  const h = hex.trim().replace("#", "");
  const n = parseInt(h, 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

async function newPage(browser, { width, reducedMotion }) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  await installFakeExtension(context);
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.errors = [];
  page.external = [];
  page.on("pageerror", (error) => page.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") page.errors.push(message.text());
  });
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      url.host !== new URL(baseURL).host &&
      url.host !== REPO_HOST
    ) {
      page.external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
  return { context, page };
}

async function open(page, route) {
  await page.goto(`${baseURL}${route}`);
  await page.locator('[data-testid^="screen-"]').first().waitFor({ state: "visible" });
}

/** Contorno calculado del control enfocado (el del riel del interruptor, si es el caso). */
function readFocusRing() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const target = el.matches(".switch-input")
    ? el.parentElement.querySelector(".switch-track") || el
    : el;
  const cs = getComputedStyle(target);
  return {
    tag: el.tagName.toLowerCase(),
    id: el.getAttribute("data-testid") || el.className || el.tagName,
    style: cs.outlineStyle,
    width: cs.outlineWidth,
    offset: cs.outlineOffset,
    color: cs.outlineColor,
  };
}

async function checkFocusRing(page, route, width, accentRgb) {
  await open(page, route);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const seen = new Set();
  const bad = [];
  for (let i = 0; i < MAX_TABS; i += 1) {
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(readFocusRing);
    if (!ring) break;
    const key = `${ring.tag}|${ring.id}`;
    if (seen.has(key)) break;
    seen.add(key);
    const ok =
      ring.style === "solid" &&
      ring.width === "2px" &&
      ring.offset === "2px" &&
      ring.color === accentRgb;
    if (!ok)
      bad.push(
        `${ring.tag}[${ring.id}] -> ${ring.style} ${ring.width} off ${ring.offset} ${ring.color}`,
      );
  }
  assert.ok(seen.size > 0, `${route} @${width}: el teclado no llega a ningún control`);
  assert.deepEqual(
    bad,
    [],
    `${route} @${width}: controles sin anillo de foco 2 px accent / 2 px:\n${bad.join("\n")}`,
  );
  return seen.size;
}

async function checkScale(page, route, width) {
  await open(page, route);
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const clipped = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const cs = getComputedStyle(el);
        const hidden =
          ["hidden", "clip"].includes(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
        return (
          (hidden || cs.textOverflow === "ellipsis") &&
          (el.textContent || "").trim().length > 0 &&
          el.clientWidth > 0
        );
      })
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
    return { overflow: doc.scrollWidth - doc.clientWidth, clipped };
  });
  assert.ok(
    result.overflow <= 0,
    `${route} @${width} (200 %): desborde horizontal de ${result.overflow}px`,
  );
  assert.deepEqual(
    result.clipped,
    [],
    `${route} @${width} (200 %): texto recortado: ${result.clipped.join(", ")}`,
  );
}

async function checkReducedMotion(page, route, width) {
  await open(page, route);
  await page.waitForTimeout(400);
  const result = await page.evaluate(() => {
    const running = document.getAnimations().filter((a) => a.playState === "running").length;
    const timed = [...document.querySelectorAll("body *")]
      .filter((el) => {
        const cs = getComputedStyle(el);
        const anyTime = (v) => v.split(",").some((d) => parseFloat(d) > 0);
        return anyTime(cs.transitionDuration) || anyTime(cs.animationDuration);
      })
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
    return { running, timed };
  });
  assert.equal(
    result.running,
    0,
    `${route} @${width}: ${result.running} animaciones activas con reduced-motion`,
  );
  assert.deepEqual(
    result.timed,
    [],
    `${route} @${width}: transiciones con duración: ${result.timed.join(", ")}`,
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    let accentRgb = "";
    // 1) Anillo de foco a 1440 y 426.
    for (const width of [1440, 426]) {
      const { context, page } = await newPage(browser, { width });
      await open(page, "/settings");
      accentRgb = hexToRgb(
        await page.evaluate(() =>
          getComputedStyle(document.documentElement).getPropertyValue("--color-accent"),
        ),
      );
      for (const route of ROUTES) {
        const count = await checkFocusRing(page, route, width, accentRgb);
        console.log(`foco ${route} @${width}: ${count} controles OK`);
      }
      assert.deepEqual(page.errors, [], `errores de consola @${width}: ${page.errors.join(" | ")}`);
      assert.deepEqual(
        page.external,
        [],
        `peticiones externas @${width}: ${page.external.join(", ")}`,
      );
      await context.close();
    }
    // 2) Texto al 200 %: el viewport a la mitad.
    for (const width of [720, 213]) {
      const { context, page } = await newPage(browser, { width });
      for (const route of ROUTES) {
        await checkScale(page, route, width);
        console.log(`200 % ${route} @${width}: sin desborde ni recortes`);
      }
      assert.deepEqual(
        page.errors,
        [],
        `errores de consola 200 % @${width}: ${page.errors.join(" | ")}`,
      );
      await context.close();
    }
    // 3) prefers-reduced-motion.
    for (const width of [1440, 426]) {
      const { context, page } = await newPage(browser, { width, reducedMotion: true });
      for (const route of ROUTES) {
        await checkReducedMotion(page, route, width);
        console.log(`reduced-motion ${route} @${width}: sin animaciones`);
      }
      assert.deepEqual(
        page.errors,
        [],
        `errores de consola reduced-motion @${width}: ${page.errors.join(" | ")}`,
      );
      await context.close();
    }
    console.log("focusAndScale e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
