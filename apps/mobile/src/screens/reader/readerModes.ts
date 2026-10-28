import type { ReaderMode } from "@ryuunest/core";

import { t } from "../../i18n";

/** F18 — los tres modos de lectura del contrato (RF-18), en el orden de la hoja de modo. */
export const READER_MODES: readonly ReaderMode[] = ["vertical", "paged-rtl", "paged-ltr"];

/** Modo con el que se abre una serie cuando ni la preferencia ni el tipo de obra deciden (F20). */
export const FALLBACK_READER_MODE: ReaderMode = "vertical";

export function modeLabel(mode: ReaderMode): string {
  switch (mode) {
    case "vertical":
      return t("reader.mode.vertical");
    case "paged-rtl":
      return t("reader.mode.pagedRtl");
    case "paged-ltr":
      return t("reader.mode.pagedLtr");
  }
}

export function modeHint(mode: ReaderMode): string {
  switch (mode) {
    case "vertical":
      return t("reader.mode.vertical.hint");
    case "paged-rtl":
      return t("reader.mode.pagedRtl.hint");
    case "paged-ltr":
      return t("reader.mode.pagedLtr.hint");
  }
}
