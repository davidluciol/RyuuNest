// F21 — Respaldo en Ajustes (web): sección «Respaldo» con exportar e
// importar; exportar descarga el JSON, importar abre la hoja de modo
// (fusionar/reemplazar), reemplazar pide confirmación explícita y tras
// importar se abren las sugerencias (nada se instala solo, AC-8).
// Ejecutar con el cliente servido: node apps/mobile/tests/e2e/backup.cjs
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const baseURL = process.env.BACKUP_URL || "http://127.0.0.1:8082";
const output = path.resolve(__dirname, "../../../../docs/capturasF21");

(async () => {
  const browser = await chromium.launch({ headless: true, channel: "chrome" });
  try {
    for (const width of [426, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 1400 },
        acceptDownloads: true,
      });
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
      const shot = async (name) => {
        await page.waitForTimeout(600);
        await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true });
      };

      await page.goto(`${baseURL}/settings`);
      const screen = page.getByTestId("screen-settings");
      await screen.waitFor({ state: "visible" });

      // Sección «Respaldo» con las dos filas (RF-37, RF-38).
      await screen.getByText("Respaldo", { exact: true }).waitFor({ state: "visible" });
      await screen.getByText("Exportar respaldo", { exact: true }).first().waitFor({ state: "visible" });
      await screen.getByText("Importar respaldo", { exact: true }).first().waitFor({ state: "visible" });

      // Exportar: en web descarga el archivo (no hay hoja del sistema).
      const downloadDir = await fs.mkdtemp(path.join(os.tmpdir(), "ryuunest-backup-"));
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        screen.getByTestId("settings-backup-export").click(),
      ]);
      assert.match(download.suggestedFilename(), /^ryuunest-respaldo-\d{4}-\d{2}-\d{2}\.json$/);
      const exportedPath = path.join(downloadDir, download.suggestedFilename());
      await download.saveAs(exportedPath);
      const exportedText = await fs.readFile(exportedPath, "utf8");
      const exportedJson = JSON.parse(exportedText);
      assert.equal(exportedJson.format, "ryuunest-backup");
      assert.equal(exportedJson.version, 1);
      await shot("ajustes-respaldo");

      // Importar: se elige el archivo exportado y se abre la hoja de modo.
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        screen.getByTestId("settings-backup-import").click(),
      ]);
      await chooser.setFiles(exportedPath);
      const modeSheet = page.getByTestId("sheet-backup-import-mode");
      await modeSheet.waitFor({ state: "visible" });
      await modeSheet.getByText("Fusionar", { exact: true }).waitFor({ state: "visible" });
      await modeSheet.getByText("Reemplazar", { exact: true }).waitFor({ state: "visible" });
      await shot("hoja-modo");

      // Reemplazar pasa por la confirmación explícita (destructivo).
      await modeSheet.getByTestId("backup-ask-replace").click();
      const replaceSheet = page.getByTestId("sheet-backup-replace");
      await replaceSheet.waitFor({ state: "visible" });
      await replaceSheet
        .getByText("Se borrará tu biblioteca, progreso y ajustes actuales")
        .waitFor({ state: "visible" });
      await shot("hoja-reemplazar");
      await replaceSheet.getByTestId("backup-apply-replace").click();

      // Tras importar se abren las sugerencias: repo con «Añadir» y módulo
      // con «Ir a Fuentes»; nada se instala solo (AC-8).
      const suggestions = page.getByTestId("sheet-backup-suggestions");
      await suggestions.waitFor({ state: "visible" });
      await suggestions.getByText("Repositorio de ejemplo").waitFor({ state: "visible" });
      await suggestions.getByTestId("backup-confirm-repo-https://repositorio-ejemplo.test/index.json").waitFor({ state: "visible" });
      await suggestions.getByText("m-ejemplo-a").waitFor({ state: "visible" });
      await suggestions.getByText("Ir a Fuentes").waitFor({ state: "visible" });
      await shot("hoja-sugerencias");

      // Confirmar el repo lo registra (en el ejemplo, queda «Añadido»).
      await suggestions
        .getByTestId("backup-confirm-repo-https://repositorio-ejemplo.test/index.json")
        .click();
      await suggestions.getByText("Añadido").waitFor({ state: "visible" });
      await suggestions.getByText("Cerrar").click();
      await page.waitForTimeout(300);

      // Un respaldo inválido se rechaza al aplicarlo, con el diálogo de error
      // (sin tocar datos): la hoja de modo se abre primero y el rechazo llega
      // al elegir «Fusionar».
      const badFile = path.join(downloadDir, "respaldo-invalido.json");
      await fs.writeFile(badFile, "{ no es json", "utf8");
      const [chooser2] = await Promise.all([
        page.waitForEvent("filechooser"),
        screen.getByTestId("settings-backup-import").click(),
      ]);
      await chooser2.setFiles(badFile);
      const modeSheet2 = page.getByTestId("sheet-backup-import-mode");
      await modeSheet2.waitFor({ state: "visible" });
      await modeSheet2.getByTestId("backup-apply-merge").click();
      const errorDialog = page.getByTestId("dialog-backup-import-error");
      await errorDialog.waitFor({ state: "visible" });
      await errorDialog.getByText("No se pudo importar el respaldo").waitFor({ state: "visible" });
      await errorDialog.getByText("NOT_JSON").waitFor({ state: "visible" });
      await shot("dialogo-rechazo");
      await errorDialog.getByText("Cerrar").click();

      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
        false,
        `desbordamiento horizontal @${width}`,
      );
      assert.deepEqual(errors, [], `errores de consola @${width}`);
      assert.deepEqual(external, [], `peticiones externas @${width}`);

      await context.close();
    }
    console.log("backup e2e OK");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
