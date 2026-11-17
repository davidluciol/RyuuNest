import type { ImageSourcePropType } from "react-native";

/**
 * F47 — fuente de imagen de una portada guardada: `{ uri, headers }` para `expo-image`.
 * Sin URL no hay portada; sin cabeceras, solo la URI.
 */
export function coverSource(
  url: string | null,
  headers: Record<string, string> | null,
): ImageSourcePropType | undefined {
  if (url === null) return undefined;
  return headers === null ? { uri: url } : { uri: url, headers };
}
