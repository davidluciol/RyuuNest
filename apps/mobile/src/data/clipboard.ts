/**
 * F30 — portapapeles en web (galería, Playwright, cliente web). En el
 * dispositivo lo reemplaza `clipboard.native.ts` con `expo-clipboard` (P-86,
 * autorizado para F30). Sin red ni dependencias.
 */
export async function copyText(text: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard === undefined) {
    throw new Error("Este navegador no permite copiar al portapapeles");
  }
  await navigator.clipboard.writeText(text);
}
