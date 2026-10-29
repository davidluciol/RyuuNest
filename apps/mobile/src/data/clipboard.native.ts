import * as Clipboard from "expo-clipboard";

/**
 * F30 — portapapeles en el dispositivo con `expo-clipboard` (SDK 57:
 * `setStringAsync`). La web usa `clipboard.ts`.
 */
export async function copyText(text: string): Promise<void> {
  await Clipboard.setStringAsync(text);
}
