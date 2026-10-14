/** Entrada de un archivo descomprimido. */
export interface ArchiveEntry {
  path: string;
  data: Uint8Array;
}

/**
 * Puerto `Archive` (SPEC §5.3 y §7.1): descompresión `.zip` en JS.
 *
 * Los límites anti-bomba y la comprobación de rutas (zip-slip) los aplica el
 * instalador (T13); este puerto solo descomprime.
 */
export interface Archive {
  unzip(data: Uint8Array): Promise<ArchiveEntry[]>;
}
