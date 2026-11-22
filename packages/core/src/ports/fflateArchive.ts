import { unzipSync } from "fflate";

import { ModuleError } from "../contract/errors.js";
import type { Archive, ArchiveEntry, UnzipLimits } from "./archive.js";

/**
 * F16/F24 — adaptador del puerto `Archive` (SPEC §5.3) sobre `fflate` (JS puro,
 * compartido por móvil y web). Las rutas y los topes sobre lo descomprimido los
 * comprueba `PackageInstaller` (T13).
 *
 * T33: `fflate` reserva para cada entrada el tamaño que **declara** el directorio central
 * (y no escribe más allá), así que sumar esos tamaños en `filter` acota la memoria antes de
 * descomprimir nada.
 */
export function createFflateArchive(): Archive {
  return {
    async unzip(data: Uint8Array, limits?: UnzipLimits): Promise<ArchiveEntry[]> {
      let files = 0;
      let declaredBytes = 0;
      const entries = unzipSync(data, {
        filter: ({ name, originalSize }) => {
          if (name.endsWith("/")) return false;
          files += 1;
          declaredBytes += originalSize;
          if (limits !== undefined && files > limits.files) {
            throw new ModuleError(
              "UNSUPPORTED",
              `El paquete trae más de ${limits.files} archivos, el tope`,
            );
          }
          if (limits !== undefined && declaredBytes > limits.unpackedBytes) {
            throw new ModuleError(
              "UNSUPPORTED",
              `El contenido descomprimido supera el tope de ${limits.unpackedBytes} bytes (bomba de compresión)`,
            );
          }
          return true;
        },
      });
      return Object.entries(entries).map(([path, bytes]) => ({ path, data: bytes }));
    },
  };
}
