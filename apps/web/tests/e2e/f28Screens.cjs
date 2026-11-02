// F28 — verificación por pantalla del cliente web (AC-12, parte web/Playwright):
// cada pantalla v1 se recorre a su ancho de referencia (el del `screen.png` de
// `design/stitch/`) y, en las principales, también a 1440 px; en cada parada se
// ejecutan las comprobaciones automáticas de `AGENTS.md` §5 (sin desbordamiento
// horizontal, sin truncado con «…» por CSS, áreas interactivas ≥ 48 px, colores
// calculados dentro de los 13 tokens de Dragon Night, tinta `bg` sobre `accent` y
// `progress`, Manrope/Inter cargadas en local, foco visible con teclado, sin
// errores de consola y cero peticiones a dominios externos salvo los interceptados
// del módulo demo y el repo oficial) y se saca una captura completa en
// `docs/capturasF28/` para compararla a mano con su `screen.png` (el diff de
// píxeles no sirve, §5.5: los datos de ejemplo son otros).
//
// Datos: módulo demo `script` servido por intercepción (repo.test + sitio.test),
// igual que `discover.cjs`/`reader.cjs`; se instalan dos obras en favoritos y se
// deja progreso de lectura para que Inicio muestre «Continuar». Un segundo
// contexto limpio captura los estados vacíos. El banner de error del lector se
// provoca abortando `pages`; el diálogo bloqueante, importando un respaldo real
// y eligiendo «Reemplazar»; el toast, copiando el informe de Diagnóstico.
//
// La comparación visual contra cada `screen.png` y la lista de 20 s quedan en
// `design/stitch/F28-verificacion.md`; las diferencias aceptadas, en `DIFFS.md`.
// La verificación en el POCO F5 Pro / MiBox 4 (AC-12 nativo) queda pendiente del
// humano.
//
// Ejecutar con la build servida:
//   WEB_URL=http://localhost:4173 PLAYWRIGHT_MODULE=%APPDATA%\npm\node_modules\playwright node apps/web/tests/e2e/f28Screens.cjs
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const { installFakeExtension } = require("./fakeExtension.cjs");
const { zipSync, strToU8 } = require("fflate");

const baseURL = process.env.WEB_URL || "http://localhost:4173";
const OUT = path.resolve(__dirname, "../../../../docs/capturasF28");
// Anchos de referencia: el ancho de cada `screen.png` de design/stitch + 1440 px
// (escritorio web) en las pantallas principales.
const W = {
  home: [426, 1440],
  library: [556, 1440],
  discover: [377, 1440],
  sources: [390, 1440],
  settings: [268, 1440, 1600],
  series: [390, 1440],
  reader: [273, 1440],
  empty: [426, 1500],
  components: [426, 1600],
};

// La paleta de referencia sale de las variables `--color-*` que la página emite
// desde `@ryuunest/ui-tokens` (fuente de verdad de los 13 tokens, AC-13).
const COLOR_VARS = [
  "bg",
  "surface",
  "elevated",
  "border",
  "text-primary",
  "text-secondary",
  "accent",
  "progress",
  "accent-alt",
  "badge-bg",
  "positive",
  "warning",
  "error",
];

const PAGE_SVG = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#1B2230"/></svg>',
);

const MODULE_JS = `
const SERIES = [
  { id: "s-1", title: "Fauces del Alba", kind: "manga", hint: "12 capítulos" },
  { id: "s-2", title: "Crónicas de Ceniza", kind: "manhwa", hint: "8 capítulos" },
  { id: "s-3", title: "Viento de Invierno", kind: "manhua", hint: "20 capítulos" },
  { id: "s-4", title: "La última biblioteca", kind: "comic", hint: "5 capítulos" },
];
const item = (s) => ({ id: s.id, title: s.title, kind: s.kind, hint: s.hint });
export default function create(host) {
  const list = (q) => SERIES.filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()));
  return {
    popular: async () => ({ items: SERIES.slice(0, 3).map(item), hasNext: false }),
    latest: async () => ({ items: SERIES.slice(1).map(item), hasNext: false }),
    search: async (q) => ({ items: list(q).map(item), hasNext: false }),
    details: async (id) => {
      const s = SERIES.find((x) => x.id === id) ?? SERIES[0];
      return {
        id: s.id, title: s.title, genres: ["Aventura", "Fantasía"], status: "ongoing",
        altTitles: [], extra: {},
        chapters: [3, 2, 1].map((n) => ({
          id: "ch-" + n, title: "Cap. " + n, number: n,
          releases: [{ id: "r-1", group: "Oficial" }, { id: "r-2", group: "Scan" }],
        })),
      };
    },
    pages: async (chapterId) => {
      const r = await host.fetch("https://sitio.test/api/pages?c=" + encodeURIComponent(chapterId));
      const data = JSON.parse(await r.text());
      return { images: data.images };
    },
  };
}
`;

const MANIFEST = {
  id: "demo",
  name: "Demo",
  version: "1.0.0",
  apiVersion: 1,
  runtime: "script",
  entry: "module.js",
  baseUrl: "https://sitio.test/",
  capabilities: ["search", "popular", "latest"],
  permissions: { domains: ["sitio.test"] },
  kinds: ["manga", "manhwa", "manhua", "comic"],
  lang: "es",
  nsfw: false,
};

function cors(body, contentType) {
  return {
    status: 200,
    headers: { "content-type": contentType, "access-control-allow-origin": "*" },
    body,
  };
}

// Red: solo el host local, los sitios falsos interceptados y el repo oficial
// (raw.githubusercontent.com, como en discover.cjs/settings.cjs). Cualquier otro
// dominio externo se aborta y se registra como violación de RNF-5.
function wireNetwork(context, page, state) {
  page.on("pageerror", (error) => state.errors.push(error.message));
  page.on("console", (message) => {
    // Los «Failed to load resource» son la petición de `pages` abortada a propósito
    // para el banner de error del lector (igual que en reader.cjs).
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      state.errors.push(message.text());
    }
  });
  return context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    const base = new URL(baseURL).host;
    if (url.host === "repo.test" && url.pathname === "/index.json") {
      return route.fulfill(cors(JSON.stringify(state.index), "application/json"));
    }
    if (url.host === "repo.test" && url.pathname === "/packages/demo.zip") {
      return route.fulfill({
        status: 200,
        headers: { "content-type": "application/zip", "access-control-allow-origin": "*" },
        body: Buffer.from(state.zip),
      });
    }
    if (url.host === "sitio.test" && url.pathname === "/api/pages") {
      if (state.breakPages) return route.abort();
      const chapterId = url.searchParams.get("c") ?? "ch-1";
      return route.fulfill(
        cors(
          JSON.stringify({
            images: [1, 2, 3].map((n) => ({ url: `https://sitio.test/img/${chapterId}-${n}.png` })),
          }),
          "application/json",
        ),
      );
    }
    if (url.host === "sitio.test" && url.pathname.startsWith("/img/")) {
      return route.fulfill(cors(PAGE_SVG, "image/svg+xml"));
    }
    if (
      ["http:", "https:"].includes(url.protocol) &&
      url.host !== base &&
      url.host !== "repo.test" &&
      url.host !== "sitio.test" &&
      url.host !== "raw.githubusercontent.com"
    ) {
      state.external.push(url.href);
      return route.abort();
    }
    return route.continue();
  });
}

// Comprobaciones automáticas de AGENTS.md §5 sobre el estado actual de la página.
async function runChecks(page, label) {
  const r = await page.evaluate((colorVars) => {
    const root = getComputedStyle(document.documentElement);
    const hexToRgb = (h) => {
      const n = parseInt(h.trim().slice(1), 16);
      return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    };
    const payload = {
      palette: colorVars.map((name) => hexToRgb(root.getPropertyValue(`--color-${name}`))),
      accent: hexToRgb(root.getPropertyValue("--color-accent")),
      progress: hexToRgb(root.getPropertyValue("--color-progress")),
      bg: hexToRgb(root.getPropertyValue("--color-bg")),
    };
    const palette = new Set(payload.palette);
    const parse = (v) => {
      const m = /^rgba?\(([^)]+)\)$/.exec(v);
      if (!m) return null;
      const p = m[1].split(",").map((s) => Number(s.trim()));
      return { rgb: `${p[0]}, ${p[1]}, ${p[2]}`, a: p.length > 3 ? p[3] : 1 };
    };
    const label = (el) => `${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`;
    const vw = document.documentElement.clientWidth;
    const wide = [];
    for (const el of document.querySelectorAll("body *")) {
      const wr = el.getBoundingClientRect();
      if (wr.width > vw + 0.5 || wr.right > vw + 0.5 || wr.left < -0.5) {
        wide.push(
          `${label(el)} w=${Math.round(wr.width)} l=${Math.round(wr.left)} r=${Math.round(wr.right)}`,
        );
      }
    }
    const out = {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      wide: wide.slice(0, 12),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      offPalette: new Set(),
      truncated: new Set(),
      small: [],
      onAccent: [],
      bgToken: payload.bg,
      fonts: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.status}`),
    };
    for (const el of document.querySelectorAll("*")) {
      const cs = getComputedStyle(el);
      const rendered =
        cs.display !== "none" &&
        cs.visibility !== "hidden" &&
        Number(cs.opacity) > 0 &&
        !el.closest("head") &&
        el.tagName !== "HTML";
      for (const [prop, val] of [
        ["color", cs.color],
        ["backgroundColor", cs.backgroundColor],
        ["borderTopColor", cs.borderTopColor],
      ]) {
        if (!rendered) continue;
        const p = parse(val);
        if (!p || p.a === 0) continue;
        // El velo de los diálogos es negro con alfa (scrim), no un token de tema.
        if (p.rgb === "0, 0, 0" && p.a < 1) continue;
        if (!palette.has(p.rgb)) out.offPalette.add(`${label(el)} ${prop}=${val}`);
      }
      const rect = el.getBoundingClientRect();
      const visible = rendered && rect.width > 0 && rect.height > 0;
      if (
        visible &&
        el.clientWidth > 0 &&
        el.scrollWidth > el.clientWidth + 1 &&
        (cs.textOverflow === "ellipsis" || cs.overflowX === "hidden") &&
        el.textContent.trim() !== ""
      ) {
        out.truncated.add(`${label(el)} «${el.textContent.trim().slice(0, 48)}»`);
      }
      if (visible && el.matches("button, a[href], input, select, textarea, [role='button']")) {
        if (rect.width < 47.5 || rect.height < 47.5) {
          out.small.push(
            `${label(el)} ${Math.round(rect.width)}x${Math.round(rect.height)} «${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 32)}»`,
          );
        }
      }
      const bg = parse(cs.backgroundColor);
      if (
        bg &&
        bg.a > 0 &&
        (bg.rgb === payload.accent || bg.rgb === payload.progress) &&
        el.textContent.trim() !== "" // solo elementos con texto propio (la barra de progreso no lleva)
      ) {
        const fg = parse(cs.color);
        if (fg && fg.a > 0 && fg.rgb !== payload.bg) {
          out.onAccent.push(`${label(el)} color=${cs.color} sobre ${cs.backgroundColor}`);
        }
      }
    }
    out.offPalette = [...out.offPalette];
    out.truncated = [...out.truncated];
    return out;
  }, COLOR_VARS);

  assert.equal(
    r.overflow,
    0,
    `${label}: desbordamiento horizontal de ${r.overflow}px en ${JSON.stringify(r.wide)}`,
  );
  assert.deepEqual(r.truncated, [], `${label}: textos truncados con «…»: ${r.truncated}`);
  assert.deepEqual(r.small, [], `${label}: áreas interactivas < 48 px: ${r.small}`);
  assert.deepEqual(r.offPalette, [], `${label}: colores fuera de los tokens: ${r.offPalette}`);
  assert.deepEqual(
    r.onAccent,
    [],
    `${label}: tinta no oscura sobre accent/progress: ${r.onAccent}`,
  );
  assert.equal(
    r.bodyBg,
    `rgb(${r.bgToken})`,
    `${label}: fondo del body ${r.bodyBg} (token bg ${r.bgToken})`,
  );
  await page.evaluate(() => document.fonts.ready);
  assert.ok(
    r.fonts.some((f) => f.startsWith("Manrope") && f.endsWith("loaded")),
    `${label}: Manrope local cargada: ${r.fonts}`,
  );
  assert.ok(
    r.fonts.some((f) => f.startsWith("Inter") && f.endsWith("loaded")),
    `${label}: Inter local cargada: ${r.fonts}`,
  );

  // Foco visible al navegar con teclado (equivalente al D-pad en TV).
  let focus = null;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    focus = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      if (!el.matches("button, a[href], input, select, textarea, [role='button']")) return null;
      const cs = getComputedStyle(el);
      let indicator = `${cs.outlineStyle} ${cs.outlineWidth}`;
      if (el.classList.contains("switch-input") && el.nextElementSibling) {
        const t = getComputedStyle(el.nextElementSibling);
        indicator += ` (track ${t.outlineStyle} ${t.outlineWidth})`;
      }
      if (cs.boxShadow !== "none") indicator += ` (shadow ${cs.boxShadow})`;
      return {
        testid: el.getAttribute("data-testid"),
        cls: String(el.className).split(" ")[0],
        indicator,
      };
    });
    if (focus) break;
  }
  assert.ok(focus, `${label}: Tab no alcanzó ningún elemento interactivo`);
  assert.ok(
    !/^none 0px/.test(focus.indicator),
    `${label}: foco sin indicador visible en ${JSON.stringify(focus)}`,
  );
}

async function snap(page, widths, name) {
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    await runChecks(page, `${name} @${width}`);
    await page.screenshot({ path: path.join(OUT, `${name}-${width}.png`), fullPage: true });
    console.log(`captura ${name}-${width}.png`);
  }
}

async function installDemo(page) {
  await page.goto(`${baseURL}/sources`);
  await page.getByTestId("screen-sources").waitFor({ state: "visible" });
  await page.getByTestId("sources-add-repo").click();
  await page.getByTestId("add-repo-url").fill("https://repo.test/index.json");
  await page.getByTestId("add-repo-submit").click();
  await page.getByTestId("module-demo").waitFor({ state: "visible" });
  await page.getByTestId("module-action-demo").click();
  await page.getByTestId("install-dialog").waitFor({ state: "visible" });
  const confirm = page.getByTestId("install-confirm");
  const box = await confirm.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1700);
  await page.mouse.up();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-testid="module-action-demo"]')
        ?.textContent?.includes("Gestionar"),
    { timeout: 30000 },
  );
}

(async () => {
  const zip = zipSync({
    "manifest.json": strToU8(JSON.stringify(MANIFEST)),
    "module.js": strToU8(MODULE_JS),
  });
  const sha256 = crypto.createHash("sha256").update(zip).digest("hex");
  const index = {
    format: "ryuunest-repo",
    version: 1,
    name: "Repo demo",
    updatedAt: "2026-11-01T00:00:00.000Z",
    modules: [
      {
        id: "demo",
        name: "Demo",
        version: "1.0.0",
        apiVersion: 1,
        runtime: "script",
        kinds: ["manga", "manhwa", "manhua", "comic"],
        lang: "es",
        nsfw: false,
        permissions: { domains: ["sitio.test"] },
        package: "packages/demo.zip",
        sha256,
        size: zip.length,
      },
    ],
  };

  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    // ---- Contexto A: con datos (módulo demo instalado, favoritos y progreso).
    {
      const state = { errors: [], external: [], index, zip, breakPages: false };
      const context = await browser.newContext({
        viewport: { width: 426, height: 900 },
        acceptDownloads: true,
        permissions: ["clipboard-read", "clipboard-write"],
      });
      await installFakeExtension(context);
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      await wireNetwork(context, page, state);

      await installDemo(page);
      await snap(page, W.sources, "sources");

      // Semilla de Biblioteca/Inicio por la ruta real de importación de respaldo
      // (F21b): el respaldo inserta filas en `series`/`favorite`/`progress`.
      // (Hallazgo F28: pulsar «Favorito» en la ficha NO crea la fila `series`, así
      // que la biblioteca queda vacía; se anota en MEMORY.md para una tarea propia.)
      const now = Date.now();
      const seed = {
        format: "ryuunest-backup",
        version: 1,
        createdAt: now,
        repos: [],
        modules: [],
        folders: [],
        series: [
          {
            moduleId: "demo",
            seriesId: "s-1",
            title: "Fauces del Alba",
            coverUrl: null,
            kind: "manga",
            nsfw: false,
            status: "ongoing",
            updatedAt: now,
          },
          {
            moduleId: "demo",
            seriesId: "s-2",
            title: "Crónicas de Ceniza",
            coverUrl: null,
            kind: "manhwa",
            nsfw: false,
            status: "ongoing",
            updatedAt: now,
          },
        ],
        favorites: [
          { moduleId: "demo", seriesId: "s-1", folderId: null, addedAt: now, updatedAt: now },
          { moduleId: "demo", seriesId: "s-2", folderId: null, addedAt: now, updatedAt: now },
        ],
        progress: [
          {
            moduleId: "demo",
            seriesId: "s-1",
            chapterId: "ch-2",
            releaseId: "r-1",
            chapterTitle: "Cap. 2",
            pageIndex: 1,
            pageTotal: 3,
            updatedAt: now,
          },
        ],
        read: [],
        prefs: [],
        settings: {},
      };
      const seedPath = path.join(os.tmpdir(), "respaldo-semilla-f28.json");
      await fs.writeFile(seedPath, JSON.stringify(seed), "utf8");

      // A partir de aquí SOLO navegación client-side (clics): `page.goto` recarga
      // la SPA y el volcado diferido de sql.js a IndexedDB (beforeunload) puede no
      // completarse antes de descargar la página, perdiendo escrituras en memoria.
      await page.getByTestId("destination-settings").click();
      await page.getByTestId("screen-settings").waitFor({ state: "visible" });
      const [seedChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByTestId("settings-backup-import").click(),
      ]);
      await seedChooser.setFiles(seedPath);
      await page.getByTestId("backup-mode-dialog").waitFor({ state: "visible" });
      await page.getByTestId("backup-merge").click();
      await page.getByTestId("backup-suggestions").waitFor({ state: "visible" });
      await page.getByTestId("backup-suggestions-close").click();
      await fs.unlink(seedPath);

      await page.getByTestId("destination-discover").click();
      await page.getByTestId("screen-discover").waitFor({ state: "visible" });
      await page.getByTestId("discover-entry-s-1").first().waitFor({ state: "visible" });
      await snap(page, W.discover, "discover");

      // Ficha de s-1 y lector del capítulo 1 en vertical (estado base del diseño).
      await page.getByTestId("discover-entry-s-1").first().click();
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      await page.getByTestId("series-favorite").waitFor({ state: "visible" });
      await snap(page, W.series, "series");
      await page.getByTestId("series-chapter-ch-1").click();
      await page.getByTestId("screen-reader").waitFor({ state: "visible" });
      await page.getByTestId("reader-vertical").waitFor({ state: "visible" });
      await page.getByTestId("reader-image-0").waitFor({ state: "visible" });
      await snap(page, W.reader, "reader");

      // Capturas de Inicio (con «Continuar» gracias al progreso sembrado) y
      // Biblioteca. El lector no tiene barra de navegación: se sale con «Cerrar».
      await page.getByTestId("reader-close").click();
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      await page.getByTestId("destination-home").click();
      await page.getByTestId("screen-home").waitFor({ state: "visible" });
      await page.getByTestId("home-continue-s-1").waitFor({ state: "visible" });
      await page.getByTestId("home-recent-s-1").waitFor({ state: "visible" });
      await snap(page, W.home, "home");

      await page.getByTestId("destination-library").click();
      await page.getByTestId("library-grid").waitFor({ state: "visible" });
      await page.getByTestId("library-card-s-1").waitFor({ state: "visible" });
      await page.getByTestId("library-card-s-2").waitFor({ state: "visible" });
      await snap(page, W.library, "library");

      await page.getByTestId("destination-settings").click();
      await page.getByTestId("screen-settings").waitFor({ state: "visible" });
      await page.getByTestId("settings-nsfw").waitFor({ state: "visible" });
      await snap(page, W.settings, "settings");

      // Diálogo bloqueante (FB2): exportar respaldo real, reimportarlo y elegir
      // «Reemplazar» → hoja de confirmación explícita.
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByTestId("settings-backup-export").click(),
      ]);
      const backupPath = path.join(os.tmpdir(), download.suggestedFilename());
      await download.saveAs(backupPath);
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByTestId("settings-backup-import").click(),
      ]);
      await chooser.setFiles(backupPath);
      await page.getByTestId("backup-mode-dialog").waitFor({ state: "visible" });
      await page.getByTestId("backup-replace").click();
      await page.getByTestId("backup-replace-dialog").waitFor({ state: "visible" });
      await snap(page, W.components, "dialog-replace");
      await page.getByTestId("backup-replace-cancel").click();
      await page
        .getByTestId("backup-cancel")
        .waitFor({ state: "visible" })
        .catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
      await page
        .getByTestId("backup-mode-dialog")
        .count()
        .then((n) => {
          if (n > 0) return page.getByTestId("backup-cancel").click();
        });
      await fs.unlink(backupPath);

      // Entrada en `log` con un respaldo inválido → Diagnóstico con eventos.
      const badPath = path.join(os.tmpdir(), "respaldo-malo-f28.json");
      await fs.writeFile(badPath, "esto no es un respaldo", "utf8");
      const [badChooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        page.getByTestId("settings-backup-import").click(),
      ]);
      await badChooser.setFiles(badPath);
      await page.getByTestId("backup-mode-dialog").waitFor({ state: "visible" });
      await page.getByTestId("backup-merge").click();
      await page.getByTestId("backup-error-dialog").waitFor({ state: "visible" });
      await page.getByTestId("backup-error-close").click();
      await fs.unlink(badPath);

      await page.getByTestId("settings-diagnostics").click();
      await page.getByTestId("screen-diagnostics").waitFor({ state: "visible" });
      await page.getByTestId("diagnostics-list").waitFor({ state: "visible" });
      await snap(page, W.components, "diagnostics-list");
      await page.getByTestId("diagnostics-copy").click();
      await page.getByTestId("diagnostics-toast").waitFor({ state: "visible" });
      await snap(page, W.components, "toast");
      await page.getByTestId("diagnostics-clear").click();
      await page.getByTestId("diagnostics-confirm").waitFor({ state: "visible" });
      await snap(page, W.components, "diagnostics-confirm");
      await page.getByTestId("diagnostics-confirm-submit").click();
      await page.getByTestId("diagnostics-empty").waitFor({ state: "visible" });
      await snap(page, W.components, "diagnostics-empty");

      // Banner inline de error (FB2): falla la carga del capítulo entero.
      await page.getByTestId("diagnostics-back").click();
      await page.getByTestId("screen-settings").waitFor({ state: "visible" });
      await page.getByTestId("destination-discover").click();
      await page.getByTestId("discover-entry-s-1").first().waitFor({ state: "visible" });
      await page.getByTestId("discover-entry-s-1").first().click();
      await page.getByTestId("screen-series").waitFor({ state: "visible" });
      state.breakPages = true;
      await page.getByTestId("series-chapter-ch-1").click();
      await page.getByTestId("reader-error-banner").waitFor({ state: "visible", timeout: 20000 });
      await snap(page, W.components, "error-banner");
      state.breakPages = false;

      assert.deepEqual(
        state.errors,
        [],
        `errores de consola/página (contexto con datos): ${state.errors}`,
      );
      assert.deepEqual(
        state.external,
        [],
        `peticiones externas no interceptadas: ${state.external}`,
      );
      await context.close();
      console.log("OK contexto con datos");
    }

    // ---- Contexto B: limpio, estados vacíos.
    {
      const state = { errors: [], external: [], index, zip, breakPages: false };
      const context = await browser.newContext({ viewport: { width: 426, height: 900 } });
      await installFakeExtension(context);
      const page = await context.newPage();
      page.setDefaultTimeout(30000);
      await wireNetwork(context, page, state);

      await page.goto(`${baseURL}/`);
      await page.getByTestId("home-empty").waitFor({ state: "visible" });
      await snap(page, W.empty, "empty-home");

      await page.goto(`${baseURL}/library`);
      await page.getByTestId("library-empty").waitFor({ state: "visible" });
      await snap(page, W.empty, "empty-library");

      await page.goto(`${baseURL}/discover`);
      await page.getByTestId("discover-empty").waitFor({ state: "visible" });
      await snap(page, W.empty, "empty-discover");

      await page.goto(`${baseURL}/diagnostics`);
      await page.getByTestId("diagnostics-empty").waitFor({ state: "visible" });
      await snap(page, [1600], "empty-diagnostics");

      assert.deepEqual(
        state.errors,
        [],
        `errores de consola/página (contexto vacío): ${state.errors}`,
      );
      assert.deepEqual(
        state.external,
        [],
        `peticiones externas no interceptadas (vacío): ${state.external}`,
      );
      await context.close();
      console.log("OK contexto vacío");
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
