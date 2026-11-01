/**
 * Base64 de bytes para cuerpos binarios (SPEC §10: «texto o base64»). Funciona
 * en el navegador, en un worker y en Node 22 (`btoa`/`atob` globales).
 */

/** Trozo máximo por `fromCharCode`: evita desbordar la pila con cuerpos grandes. */
const CHUNK_SIZE = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK_SIZE));
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
