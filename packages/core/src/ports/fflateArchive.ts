import { unzipSync } from "fflate";

import type { Archive, ArchiveEntry } from "./archive.js";

/**
 * F16/F24 — adaptador del puerto `Archive` (SPEC §5.3) sobre `fflate` (JS puro,
 * compartido por móvil y web). Solo descomprime; las rutas y los topes los
 * comprueba `PackageInstaller` (T13).
 */
export function createFflateArchive(): Archive {
  return {
    async unzip(data: Uint8Array): Promise<ArchiveEntry[]> {
      const files = unzipSync(data);
      return Object.entries(files)
        .filter(([path]) => !path.endsWith("/"))
        .map(([path, bytes]) => ({ path, data: bytes }));
    },
  };
}
