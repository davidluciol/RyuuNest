// single-use: hojas de modo y de capítulo del lector (RF-22); solo existen dentro de él.
import type { ReaderMode } from "@ryuunest/core";
import { dragonNightColors, spacing } from "@ryuunest/ui-tokens";

import ChapterRow from "../../components/ChapterRow";
import SettingsRow from "../../components/SettingsRow";
import SheetModal from "../../components/SheetModal";
import { Check } from "../../icons";
import { t } from "../../i18n";
import { READER_MODES, modeHint, modeLabel } from "./readerModes";
import type { ReaderChapterItem } from "./useReader";

/**
 * F18 — hojas del lector (sin diseño en Stitch, `SPEC` §11.5: «Selector de capítulo y de modo en
 * el lector → barras del lector de DESIGN.md»). Se componen con las piezas compartidas
 * (`SheetModal`, `SettingsRow`, `ChapterRow`) y aparecen sin animación.
 */

const colors = dragonNightColors;

export interface ReaderModeSheetProps {
  visible: boolean;
  mode: ReaderMode;
  onSelect: (mode: ReaderMode) => void;
  onClose: () => void;
}

export function ReaderModeSheet({ visible, mode, onSelect, onClose }: ReaderModeSheetProps) {
  return (
    <SheetModal visible={visible} title={t("reader.mode.open")} onClose={onClose} animated={false}>
      {READER_MODES.map((option) => (
        <SettingsRow
          key={option}
          label={modeLabel(option)}
          hint={modeHint(option)}
          onPress={() => onSelect(option)}
          right={option === mode ? <Check size={spacing.lg} color={colors.accent} /> : undefined}
        />
      ))}
    </SheetModal>
  );
}

export interface ReaderChaptersSheetProps {
  visible: boolean;
  chapters: readonly ReaderChapterItem[];
  currentId: string;
  onSelect: (chapter: ReaderChapterItem) => void;
  onClose: () => void;
}

export function ReaderChaptersSheet({
  visible,
  chapters,
  currentId,
  onSelect,
  onClose,
}: ReaderChaptersSheetProps) {
  return (
    <SheetModal
      visible={visible}
      title={t("reader.chapters.title")}
      onClose={onClose}
      animated={false}
    >
      {chapters.map((chapter) => (
        <ChapterRow
          key={chapter.id}
          title={`${t("series.chapter", { number: chapter.number ?? "" })}: ${chapter.title}`}
          state={chapter.state}
          {...(chapter.id === currentId ? { hint: t("reader.chapters.current") } : {})}
          onPress={() => onSelect(chapter)}
        />
      ))}
    </SheetModal>
  );
}
