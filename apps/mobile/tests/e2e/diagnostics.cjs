// F30 — Ajustes → Diagnóstico (web): la fila de Ajustes abre la pantalla con
// los eventos de ejemplo; se elige el formato, se exporta (descarga real),
// se copia al portapapeles, se confirma antes de borrar y el vacío ofrece
// volver. Sin desbordamiento, errores de consola ni peticiones externas.
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/diagnostics.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.DIAGNOSTICS_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF30");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1400 },
        acceptDownloads: true,
        permissions: ["clipboard-read", "clipboard-write"],
      });
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
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
      const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "ryuunest-diag-"));
      const exportFile = async (button) => {
        const [download] = await Promise.all([
          page.waitForEvent("download"),
          page.getByTestId("diagnostics-export").click(),
        ]);
        const target = path.join(downloadDir, download.suggestedFilename());
        await download.saveAs(target);
        return { name: download.suggestedFilename(), text: await fs.readFile(target, "utf8") };
      };

      // Entrada desde Ajustes (fila con chevron).
      await page.goto(`${baseURL}/settings`);
      const settings = page.getByTestId("screen-settings");
      await settings.waitFor({ state: "visible" });
      await settings.getByText("Registro de diagnóstico", { exact: true }).scrollIntoViewIfNeeded();
      await shot("ajustes-fila-diagnostico");
      await settings.getByText("Registro de diagnóstico", { exact: true }).click();

      const screen = page.getByTestId("screen-diagnostics");
      await screen.waitFor({ state: "visible" });
      await screen.getByRole("heading", { name: "Diagnóstico" }).waitFor({ state: "visible" });

      // Lista: cuatro eventos, nivel siempre en texto, códigos y fechas.
      for (const id of [1, 2, 3, 4]) {
        await page.getByTestId(`diagnostics-event-${id}`).waitFor({ state: "visible" });
      }
      for (const text of ["Fallo", "Aviso", "Nota", "module.timeout", "reader.image.retry", "backup.import.rejected", "install.completed", "Últimos eventos · 4"]) {
        await screen.getByText(text, { exact: true }).first().waitFor({ state: "visible" });
      }
      const truncated = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid^="diagnostics-event-"] *')]
          .filter((node) => node.children.length === 0 && (node.textContent ?? "").trim().endsWith("…"))
          .map((node) => node.textContent),
      );
      assert.deepEqual(truncated, [], `títulos o datos cortados con «…» @${width}`);
      await shot("diagnostico-lista");

      // Detalle desplegable con contexto y versión.
      await page.getByTestId("diagnostics-event-4").getByRole("button", { name: "Ver detalle" }).click();
      await page.getByTestId("diagnostics-event-4").getByText("versión y plataforma:").waitFor({ state: "visible" });
      await shot("diagnostico-detalle");

      // Áreas táctiles de 48 dp en las tres acciones.
      for (const id of ["diagnostics-export", "diagnostics-copy", "diagnostics-clear"]) {
        const box = await page.getByTestId(id).boundingBox();
        assert.ok(box !== null && box.height >= 48, `${id} mide ${box?.height} (<48) @${width}`);
      }

      // Exportar en texto (por defecto) y en JSON, con descarga real.
      const text = await exportFile();
      assert.match(text.name, /^ryuunest-diagnostico-\d{4}-\d{2}-\d{2}\.txt$/);
      assert.equal(text.text.trim().split("\n").length, 4);
      assert.match(text.text, /\[error\] module\.timeout/);
      await page.getByTestId("diagnostics-toast").getByText("Informe exportado").waitFor({ state: "visible" });

      await screen.getByRole("button", { name: "Datos (JSON)" }).click();
      const json = await exportFile();
      assert.match(json.name, /^ryuunest-diagnostico-\d{4}-\d{2}-\d{2}\.json$/);
      const parsed = JSON.parse(json.text);
      assert.equal(parsed.format, "ryuunest-log");
      assert.equal(parsed.entries.length, 4);

      // Copiar el informe al portapapeles.
      await page.getByTestId("diagnostics-copy").click();
      await page.getByTestId("diagnostics-toast").getByText("Informe copiado").waitFor({ state: "visible" });
      const clipboard = await page.evaluate(() => navigator.clipboard.readText());
      assert.equal(JSON.parse(clipboard).format, "ryuunest-log");

      // Foco visible por teclado (equivale al D-pad).
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement?.tagName ?? "");
      assert.notEqual(focused, "BODY", `el teclado no llega a ningún control @${width}`);

      // Borrar pide confirmación; cancelar conserva todo.
      await page.getByTestId("diagnostics-clear").click();
      const confirm = page.getByTestId("diagnostics-confirm");
      await confirm.waitFor({ state: "visible" });
      await confirm.getByText("¿Borrar el registro?").waitFor({ state: "visible" });
      await confirm.getByText("Se eliminarán los 4 eventos guardados").waitFor({ state: "visible" });
      await shot("diagnostico-confirmar");
      await confirm.getByTestId("diagnostics-confirm-cancel").click();
      await confirm.waitFor({ state: "hidden" });
      await page.getByTestId("diagnostics-event-1").waitFor({ state: "visible" });

      // Confirmar borra y deja el estado vacío con una única acción.
      await page.getByTestId("diagnostics-clear").click();
      await confirm.waitFor({ state: "visible" });
      await confirm.getByTestId("diagnostics-confirm-submit").click();
      const empty = page.getByTestId("diagnostics-empty");
      await empty.waitFor({ state: "visible" });
      await empty.getByText("Sin eventos registrados").waitFor({ state: "visible" });
      await page.getByTestId("diagnostics-toast").getByText("Registro borrado").waitFor({ state: "visible" });
      await shot("diagnostico-vacio");

      // El vacío vuelve a Ajustes.
      await empty.getByText("Volver a Ajustes").click();
      await page.getByTestId("screen-settings").waitFor({ state: "visible" });

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.equal(
        await page.evaluate(() => document.fonts.check('16px "Manrope"') && document.fonts.check('16px "Inter"')),
        true,
        `fuentes locales sin cargar @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);

      await context.close();
    }
    console.log("diagnostics e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
