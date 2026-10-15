/**
 * Utilidades de bytes, sin dependencias de plataforma.
 *
 * El puerto `Storage` provisional es de clave–valor con valores de **texto** (T07), así
 * que los archivos binarios de un paquete se guardan en hexadecimal. La codificación
 * UTF-8 se hace a mano porque el núcleo no declara `TextEncoder`/`TextDecoder`: no están
 * garantizados en todos los entornos objetivo (Hermes, navegador, Node).
 */

/** Convierte bytes a una cadena hexadecimal en minúsculas. */
export function toHex(data: Uint8Array): string {
  let out = "";
  for (const byte of data) {
    out += byte.toString(16).padStart(2, "0");
  }
  return out;
}

/** Convierte una cadena hexadecimal (pares) a bytes. */
export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) {
    throw new Error("Hexadecimal no válido");
  }

  const out = new Uint8Array(hex.length / 2);
  for (let index = 0; index < out.length; index += 1) {
    out[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

/** Codifica texto a UTF-8. */
export function utf8Encode(text: string): Uint8Array {
  const bytes: number[] = [];

  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f),
      );
    }
  }

  return new Uint8Array(bytes);
}

/** Decodifica UTF-8. Los bytes inválidos se sustituyen por U+FFFD. */
export function utf8Decode(data: Uint8Array): string {
  let out = "";
  let index = 0;

  while (index < data.length) {
    const first = data[index];
    if (first === undefined) {
      break;
    }
    index += 1;

    let code: number;
    let extra: number;
    if (first < 0x80) {
      code = first;
      extra = 0;
    } else if ((first & 0xe0) === 0xc0) {
      code = first & 0x1f;
      extra = 1;
    } else if ((first & 0xf0) === 0xe0) {
      code = first & 0x0f;
      extra = 2;
    } else if ((first & 0xf8) === 0xf0) {
      code = first & 0x07;
      extra = 3;
    } else {
      out += "\uFFFD";
      continue;
    }

    let valid = true;
    for (let continuation = 0; continuation < extra; continuation += 1) {
      const next = data[index];
      if (next === undefined || (next & 0xc0) !== 0x80) {
        valid = false;
        break;
      }
      index += 1;
      code = (code << 6) | (next & 0x3f);
    }

    out += valid ? String.fromCodePoint(code) : "\uFFFD";
  }

  return out;
}
