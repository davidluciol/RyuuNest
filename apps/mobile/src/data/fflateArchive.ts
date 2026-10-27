import type { Archive, ArchiveEntry } from "@ryuunest/core";
import { unzipSync } from "fflate";

/**
 * F16 — adaptador del puerto `Archive` (SPEC §5.3) sobre `fflate`. Solo
 * descomprime; las rutas y los topes los comprueba `PackageInstaller` (T13).
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
