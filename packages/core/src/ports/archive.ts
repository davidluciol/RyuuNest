/** Entrada de un archivo descomprimido. */
export interface ArchiveEntry {
  path: string;
  data: Uint8Array;
}

/** Topes que el adaptador aplica **antes** de descomprimir (SPEC §7.1). */
export interface UnzipLimits {
  /** Número máximo de archivos. */
  files: number;
  /** Suma máxima de los tamaños descomprimidos que declara el `.zip`, en bytes. */
  unpackedBytes: number;
}

/**
 * Puerto `Archive` (SPEC §5.3 y §7.1): descompresión `.zip` en JS.
 *
 * La comprobación de rutas (zip-slip) y los límites sobre lo ya descomprimido los aplica
 * el instalador (T13). Con `limits`, el adaptador además rechaza el paquete antes de
 * reservar memoria para él (T33: una bomba puede declarar gigas en pocos bytes).
 */
export interface Archive {
  unzip(data: Uint8Array, limits?: UnzipLimits): Promise<ArchiveEntry[]>;
}
