import { readFileSync } from "node:fs";

/**
 * Utilidad de prueba: lee la tabla `name` de un TTF/OTF y extrae los nombres
 * embebidos y el peso real. Suficiente para la puerta de F03 (un archivo por
 * peso, sin sintéticos); no es un parser de fuentes completo.
 */

export interface TtfNames {
  readonly family: string;
  readonly subfamily: string;
  readonly postScriptName: string;
  readonly weight: number;
}

const WEIGHTS: Readonly<Record<string, number>> = {
  Thin: 100,
  ExtraLight: 200,
  Ultralight: 200,
  Light: 300,
  Regular: 400,
  Normal: 400,
  Medium: 500,
  SemiBold: 600,
  Semibold: 600,
  Demibold: 600,
  Bold: 700,
  ExtraBold: 800,
  Extrabold: 800,
  Ultrabold: 800,
  Black: 900,
  Heavy: 900,
};

/** Lee la tabla `name` (cabecera: version, count, stringOffset; registros de 12 B). */
export function readTtfNames(absPath: string): TtfNames {
  const data = readFileSync(absPath);
  const numTables = data.readUInt16BE(4);
  let nameOffset = -1;
  for (let i = 0; i < numTables; i++) {
    const p = 12 + i * 16;
    if (data.toString("latin1", p, p + 4) === "name") {
      nameOffset = data.readUInt32BE(p + 8);
      break;
    }
  }
  if (nameOffset < 0) {
    throw new Error(`${absPath} no tiene tabla name`);
  }
  const count = data.readUInt16BE(nameOffset + 2);
  const stringOffset = data.readUInt16BE(nameOffset + 4);
  const strings = nameOffset + stringOffset;
  const found = new Map<number, string>();
  let mac: Map<number, string> | undefined;
  for (let i = 0; i < count; i++) {
    const p = nameOffset + 6 + i * 12;
    const pid = data.readUInt16BE(p);
    const nameId = data.readUInt16BE(p + 6);
    const length = data.readUInt16BE(p + 8);
    const offset = data.readUInt16BE(p + 10);
    if (![1, 2, 6].includes(nameId)) continue;
    const raw = data.subarray(strings + offset, strings + offset + length);
    let value: string;
    if (pid === 3) {
      // Plataforma Windows: UTF-16 BE. Se intercambian los bytes ANTES de
      // decodificar como el UTF-16 LE de Node.
      value = raw.swap16().toString("utf16le");
    } else if (pid === 1) {
      // Plataforma Mac: Latin-1 plano, sin intercambio.
      value = raw.toString("latin1");
    } else {
      continue;
    }
    if (pid === 3) {
      if (!found.has(nameId)) found.set(nameId, value);
    } else {
      mac ??= new Map();
      if (!mac.has(nameId)) mac.set(nameId, value);
    }
  }
  for (const id of [1, 2, 6] as const) {
    if (!found.has(id)) {
      const macValue = mac?.get(id);
      if (macValue !== undefined) found.set(id, macValue);
    }
  }
  const family = found.get(1) ?? "";
  const subfamily = found.get(2) ?? "";
  const postScriptName = found.get(6) ?? "";
  const weight = weightFrom(family, subfamily);
  return { family, subfamily, postScriptName, weight };
}

/**
 * El peso se lee del nombre embebido, que no sigue un esquema único entre
 * familias: `Manrope` + subfamilia `Bold` → 700; familias con el peso integrado
 * (`Inter Medium` + subfamilia neutra) → 500.
 */
function weightFrom(family: string, subfamily: string): number {
  const neutral = /^(Regular|Normal)$/i;
  const words = Object.keys(WEIGHTS).sort((a, b) => b.length - a.length);
  if (!neutral.test(subfamily)) {
    for (const word of words) {
      if (subfamily.includes(word)) return WEIGHTS[word] ?? 400;
    }
  }
  for (const word of words) {
    if (family.includes(word)) return WEIGHTS[word] ?? 400;
  }
  return 400;
}
