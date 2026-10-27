import type { MediaKind } from "@ryuunest/core";

import { t } from "../i18n";

/**
 * F15 — etiqueta visible de un tipo de obra (D-13, P-60): el identificador de
 * API no se traduce; su etiqueta vive en el catálogo. Compartida por
 * Biblioteca (F14) y Descubrir (F15) para no duplicar el mapa.
 */
const KIND_KEYS: Record<MediaKind, string> = {
  manga: "kind.manga",
  manhua: "kind.manhua",
  manhwa: "kind.manhwa",
  comic: "kind.comic",
};

export function kindLabel(kind: MediaKind): string {
  return t(KIND_KEYS[kind]);
}
