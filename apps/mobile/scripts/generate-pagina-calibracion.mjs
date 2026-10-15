/**
 * T05: escribe `apps/mobile/assets/pagina-calibracion.png` (1440×3200, degradado).
 *
 * Es la imagen que el panel del tope de imágenes sostiene en memoria para medir cuánto
 * pesa cada imagen decodificada al tamaño de pantalla (SPEC §9). El builder está probado
 * en `tests/calibrationPage.test.ts`; aquí solo se escribe el resultado, así que el asset
 * es reproducible y su procedencia queda en el repositorio.
 *
 * Uso: `node apps/mobile/scripts/generate-pagina-calibracion.mjs`
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildCalibrationPng } from "../src/calibrationPage.ts";

const WIDTH = 1440;
const HEIGHT = 3200;

const output = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "assets",
  "pagina-calibracion.png",
);
const png = buildCalibrationPng(WIDTH, HEIGHT);

writeFileSync(output, png);
console.log(`Escrito ${output} — ${WIDTH}×${HEIGHT}, ${(png.length / 1024).toFixed(1)} KB`);
