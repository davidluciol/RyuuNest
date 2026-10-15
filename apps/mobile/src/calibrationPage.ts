import { zlibSync } from "fflate";

/**
 * T05 — construcción de `assets/pagina-calibracion.png`.
 *
 * PNG de `width × height` con un degradado, en RGBA8. Es la imagen que el panel del tope
 * de imágenes sostiene en memoria (SPEC §9): se genera en tiempo de desarrollo con
 * `scripts/generate-pagina-calibracion.mjs` y el builder está probado en
 * `tests/calibrationPage.test.ts`.
 */

const SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Tabla CRC-32 (polinomio 0xEDB88320), construida perezosamente. */
let crcTable: Uint32Array | undefined;

function crc32(bytes: Uint8Array): number {
  if (crcTable === undefined) {
    const table = new Uint32Array(256);
    for (let index = 0; index < 256; index += 1) {
      let value = index;
      for (let bit = 0; bit < 8; bit += 1) {
        value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
      }
      table[index] = value >>> 0;
    }
    crcTable = table;
  }

  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** Trozo PNG: longitud (4) + tipo (4) + datos + CRC-32 (4). */
function chunk(type: string, data: Uint8Array): Uint8Array {
  const body = new Uint8Array(4 + data.length);
  for (let index = 0; index < 4; index += 1) {
    body[index] = type.charCodeAt(index);
  }
  body.set(data, 4);

  const out = new Uint8Array(4 + body.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set(body, 4);
  view.setUint32(4 + body.length, crc32(body));
  return out;
}

function header(width: number, height: number): Uint8Array {
  const data = new Uint8Array(13);
  const view = new DataView(data.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  data[8] = 8; // bits por canal
  data[9] = 6; // color RGBA
  data[10] = 0; // método de compresión
  data[11] = 0; // filtro
  data[12] = 0; // sin entrelazar
  return data;
}

/** Fila a fila: byte de filtro (0 = ninguno) + RGBA de cada píxel. */
function rawPixels(width: number, height: number): Uint8Array {
  const stride = width * 4 + 1;
  const raw = new Uint8Array(stride * height);
  const columns = Math.max(1, width - 1);
  const rows = Math.max(1, height - 1);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * stride;
    for (let x = 0; x < width; x += 1) {
      const offset = rowStart + 1 + x * 4;
      raw[offset] = Math.round((x / columns) * 255);
      raw[offset + 1] = Math.round((y / rows) * 255);
      raw[offset + 2] = 96;
      raw[offset + 3] = 255;
    }
  }

  return raw;
}

/** Devuelve los bytes del PNG `width × height` listos para escribirse en disco. */
export function buildCalibrationPng(width: number, height: number): Uint8Array {
  const parts = [
    SIGNATURE,
    chunk("IHDR", header(width, height)),
    chunk("IDAT", zlibSync(rawPixels(width, height), { level: 9 })),
    chunk("IEND", new Uint8Array(0)),
  ];

  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    png.set(part, offset);
    offset += part.length;
  }
  return png;
}
