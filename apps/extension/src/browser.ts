/**
 * `browser` (Firefox, API con promesas) si existe; si no, `chrome` (Chrome y
 * Edge MV3, que también devuelven promesas). Una sola referencia para los dos.
 */
export const ext: typeof chrome =
  (globalThis as unknown as { browser?: typeof chrome }).browser ?? chrome;
