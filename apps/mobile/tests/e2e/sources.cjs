// F16 — Fuentes en web: recorre los flujos con el servicio de ejemplo en memoria
// (no hay SQLite en web, P-79): confirmar e instalar, la confirmación reforzada
// de un módulo con código propio, gestionar, actualizar, quitar un repositorio y
// el filtro por tipo. Sin errores de consola ni dominios externos (RNF-5).
// PLAYWRIGHT_MODULE permite reutilizar Playwright del entorno sin añadir dependencias.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/sources.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.SHELL_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF16");

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
      // Las hojas entran con animación: se espera a que terminen antes de fotografiar.
      const shot = async (name, options = {}) => {
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), ...options });
      };
      await page.goto(`${baseURL}/sources`);
      await page.getByTestId("screen-sources").waitFor({ state: "visible" });

      // Cabecera, resumen y datos de ejemplo.
      await page.getByText("2 instalados · 4 disponibles").waitFor({ state: "visible" });
      await page.getByText("Repositorio Comunitario A").waitFor({ state: "visible" });
      await page.getByTestId("module-portal-aurora").waitFor({ state: "visible" });
      await shot("fuentes", { fullPage: true });

      // Filtro por tipo con contador: Cómic deja solo un módulo.
      await page.getByRole("button", { name: "Cómic (1)" }).click();
      await page.getByTestId("module-portal-fresno").waitFor({ state: "visible" });
      assert.equal(await page.getByTestId("module-portal-aurora").count(), 0);
      await page.getByRole("button", { name: "Todos (6)" }).first().click();

      // Instalar un módulo declarativo: la confirmación enseña permisos y huella.
      await page.getByTestId("module-portal-duna").getByRole("button", { name: "Instalar" }).click();
      await page.getByTestId("sheet-install").waitFor({ state: "visible" });
      await page.getByText("Dominios permitidos").waitFor({ state: "visible" });
      await page.getByText("Huella SHA-256").waitFor({ state: "visible" });
      await shot("instalar");
      await page.getByRole("button", { name: "Instalar", exact: true }).last().click();
      await page.getByTestId("sheet-install").waitFor({ state: "detached" });
      await page.getByText("3 instalados · 3 disponibles").waitFor({ state: "visible" });

      // Un módulo con código propio exige mantener pulsado: un toque no instala.
      await page.getByTestId("module-portal-cenit").getByRole("button", { name: "Instalar" }).click();
      await page.getByText(/ejecuta código en tu dispositivo/).waitFor({ state: "visible" });
      const hold = page.getByRole("button", { name: "Mantén pulsado para instalar" });
      await hold.waitFor({ state: "visible" });
      await shot("instalar-script");
      const box = await hold.boundingBox();
      assert.ok(box && box.height >= 48, `área táctil < 48 dp @${width}`);
      await hold.hover();
      await page.mouse.down();
      await page.waitForTimeout(300);
      await page.mouse.up();
      await page.getByText("3 instalados · 3 disponibles").waitFor({ state: "visible" });
      await hold.hover();
      await page.mouse.down();
      await page.waitForTimeout(1500);
      await page.mouse.up();
      await page.getByTestId("sheet-install").waitFor({ state: "detached" });
      await page.getByText("4 instalados · 2 disponibles").waitFor({ state: "visible" });

      // Gestionar: actualizar un módulo con versión nueva.
      await page.getByTestId("module-portal-aurora").getByRole("button", { name: "Gestionar" }).click();
      await page.getByTestId("sheet-manage").waitFor({ state: "visible" });
      await shot("gestionar");
      await page.getByRole("button", { name: "Actualizar a v1.3.0" }).click();
      await page.getByTestId("sheet-update").waitFor({ state: "visible" });
      await page.getByText("v1.2.0 → v1.3.0").waitFor({ state: "visible" });
      await shot("actualizar");
      await page.getByRole("button", { name: "Actualizar", exact: true }).last().click();
      await page.getByTestId("sheet-update").waitFor({ state: "detached" });

      // Desinstalar pide una segunda confirmación.
      await page.getByTestId("module-portal-aurora").getByRole("button", { name: "Gestionar" }).click();
      await page.getByRole("button", { name: "Desinstalar" }).click();
      await page.getByTestId("sheet-uninstall").waitFor({ state: "visible" });
      await shot("desinstalar");
      await page.getByRole("button", { name: "Volver" }).click();
      await page.getByTestId("sheet-manage").waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Desinstalar" }).click();
      await page.getByRole("button", { name: "Desinstalar" }).last().click();
      await page.getByTestId("sheet-uninstall").waitFor({ state: "detached" });
      await page.getByText("3 instalados · 3 disponibles").waitFor({ state: "visible" });

      // Quitar el repositorio conserva los módulos instalados (RF-8).
      await page.getByRole("button", { name: "Quitar repositorio" }).click();
      await page.getByTestId("sheet-remove-repo").waitFor({ state: "visible" });
      await page.getByText(/dejarán de recibir actualizaciones/).waitFor({ state: "visible" });
      await shot("quitar-repositorio");
      await page.getByRole("button", { name: "Quitar", exact: true }).click();
      await page.getByTestId("sheet-remove-repo").waitFor({ state: "detached" });
      await page.getByText("Repositorio Comunitario A").waitFor({ state: "detached" });
      await page.getByText("Sin repositorio").first().waitFor({ state: "visible" });

      // Añadir un repositorio: HTTP se rechaza sin salir de la hoja.
      await page.getByRole("button", { name: "Añadir repositorio" }).first().click();
      await page.getByTestId("sheet-add-repo").waitFor({ state: "visible" });
      await page.getByPlaceholder("https://ejemplo.com/repo/index.json").fill("http://repo.test/x.json");
      await page.getByRole("button", { name: "Añadir", exact: true }).click();
      await page.getByText("El repositorio debe usar HTTPS.").waitFor({ state: "visible" });
      await shot("anadir-repositorio");
      await page.getByPlaceholder("https://ejemplo.com/repo/index.json").fill("https://repo.ejemplo.org/indice.json");
      await page.getByRole("button", { name: "Añadir", exact: true }).click();
      await page.getByTestId("sheet-add-repo").waitFor({ state: "detached" });
      await page.getByText("Repositorio Comunitario A").waitFor({ state: "visible" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);

      await context.close();
    }
    console.log("sources e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
