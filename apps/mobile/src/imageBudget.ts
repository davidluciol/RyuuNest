/**
 * T05 — presupuesto de imágenes en memoria (SPEC §9).
 *
 * Lógica pura que usa el panel de calibración de `apps/mobile`: cuántos bytes ocupa una
 * imagen decodificada al tamaño de pantalla y cuántas caben en un presupuesto. El tope
 * final lo fija una medición manual en el dispositivo (`MEMORY.md` P-45); aquí está lo
 * que se puede comprobar con pruebas.
 */

/** Tamaño de un píxel decodificado en RGBA8 (4 bytes). */
const BYTES_PER_PIXEL = 4;

/** Megabyte binario (2^20), como los que reporta `dumpsys meminfo`. */
const BYTES_PER_MB = 1_048_576;

/** Bytes que ocupa la imagen `width × height` una vez decodificada en memoria. */
export function decodedBytes(width: number, height: number): number {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  return safeWidth * safeHeight * BYTES_PER_PIXEL;
}

/** Convierte bytes a megabytes con un decimal (para mostrarlos en el panel). */
export function toMB(bytes: number): number {
  return Math.round((bytes / BYTES_PER_MB) * 10) / 10;
}

/** Cuántas imágenes de `width × height` caben en `budgetMB` megabytes. */
export function capFor(budgetMB: number, width: number, height: number): number {
  if (budgetMB <= 0) {
    return 0;
  }
  const perImage = decodedBytes(width, height);
  if (perImage === 0) {
    return 0;
  }
  return Math.floor((budgetMB * BYTES_PER_MB) / perImage);
}

/** Mantiene el contador del panel dentro de `[min, max]`; los no finitos caen al mínimo. */
export function clampCount(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
