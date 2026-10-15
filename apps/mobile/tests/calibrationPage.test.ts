import { unzlibSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildCalibrationPng } from "../src/calibrationPage.js";

/**
 * T05: la imagen que el panel del tope de imágenes sostiene en memoria. Se prueba que el
 * builder produzca un PNG bien formado (firma, cabecera y datos descomprimibles), para
 * que la medición no dependa de un archivo roto.
 */

const WIDTH = 64;
const HEIGHT = 32;
const BYTES_PER_ROW = WIDTH * 4 + 1; // byte de filtro + RGBA

function readChunks(png: Uint8Array): { type: string; data: Uint8Array }[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks: { type: string; data: Uint8Array }[] = [];
  let offset = 8;

  while (offset + 12 <= png.byteLength) {
    const length = view.getUint32(offset);
    const start = offset + 4;
    const type = String.fromCharCode(...png.subarray(start, start + 4));
    chunks.push({ type, data: png.subarray(start + 4, start + 4 + length) });
    offset += 12 + length;
  }

  return chunks;
}

describe("buildCalibrationPng", () => {
  it("empieza con la firma PNG", () => {
    const png = buildCalibrationPng(WIDTH, HEIGHT);
    expect(Array.from(png.subarray(0, 8))).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
  });

  it("declara las dimensiones y el formato RGBA8", () => {
    const header = readChunks(buildCalibrationPng(WIDTH, HEIGHT)).find(
      (chunk) => chunk.type === "IHDR",
    );
    if (header === undefined) {
      throw new Error("Falta el trozo IHDR");
    }

    const view = new DataView(header.data.buffer, header.data.byteOffset, header.data.byteLength);
    expect(view.getUint32(0)).toBe(WIDTH);
    expect(view.getUint32(4)).toBe(HEIGHT);
    expect(header.data[8]).toBe(8); // bits por canal
    expect(header.data[9]).toBe(6); // RGBA
  });

  it("el IDAT se descomprime al tamaño esperado de filas", () => {
    const idat = readChunks(buildCalibrationPng(WIDTH, HEIGHT)).find(
      (chunk) => chunk.type === "IDAT",
    );
    if (idat === undefined) {
      throw new Error("Falta el trozo IDAT");
    }

    const raw = unzlibSync(idat.data);
    expect(raw.length).toBe(BYTES_PER_ROW * HEIGHT);
    expect(raw[0]).toBe(0); // filtro: ninguno
    expect(raw[4]).toBe(255); // alfa del primer píxel
  });

  it("termina con IEND y es determinista", () => {
    const chunks = readChunks(buildCalibrationPng(WIDTH, HEIGHT));
    expect(chunks.at(-1)?.type).toBe("IEND");
    expect(buildCalibrationPng(WIDTH, HEIGHT)).toEqual(buildCalibrationPng(WIDTH, HEIGHT));
  });
});
