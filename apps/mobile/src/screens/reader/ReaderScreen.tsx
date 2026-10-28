import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import type { ReaderMode } from "@ryuunest/core";
import { spacing } from "@ryuunest/ui-tokens";

import { t } from "../../i18n";
import { columnWidth, tapActionFor, tapZoneAt } from "../../reader/readerLayout";
import { ReaderBottomBar, ReaderTopBar } from "./ReaderBars";
import ReaderEndCard from "./ReaderEndCard";
import ReaderPaged from "./ReaderPaged";
import { ReaderChaptersSheet, ReaderModeSheet } from "./ReaderSheets";
import ReaderVertical, { type ReaderVerticalHandle } from "./ReaderVertical";
import { FALLBACK_READER_MODE, modeLabel } from "./readerModes";
import { readerCanvasStyle } from "./readerStyles";
import type { ReaderActions, ReaderReady } from "./useReader";

/**
 * F18 — pantalla del lector (RF-18 a RF-22): lienzo con el contenido y nada más; el centro
 * muestra u oculta los controles y las laterales cambian de página (invertidas en D→I). Sin
 * animaciones. Recibe la vista ya cargada (`useReader`) y los callbacks por props.
 */

/** Espacio al final de la lista vertical para que la tarjeta de fin no quede bajo la barra. */
const FOOTER_CLEARANCE = spacing["2xl"] * 4;

export interface ReaderScreenProps {
  ready: ReaderReady;
  actions: ReaderActions;
  onClose: () => void;
  onOpenChapter: (chapterId: string, releaseId: string | null) => void;
}

type Sheet = "mode" | "chapters" | null;

export default function ReaderScreen({ ready, actions, onClose, onOpenChapter }: ReaderScreenProps) {
  const { snapshot, images, chapter, next } = ready;
  const mode: ReaderMode = snapshot.mode ?? FALLBACK_READER_MODE;
  const total = snapshot.pageTotal ?? images.length;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [controls, setControls] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [endCard, setEndCard] = useState(false);
  const vertical = useRef<ReaderVerticalHandle>(null);
  const column = columnWidth(size.width);

  // Moverse de página, de modo o de capítulo cierra la tarjeta de fin del modo paginado.
  useEffect(() => setEndCard(false), [snapshot.pageIndex, chapter.id, mode]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSize({ width, height });
  };

  const goNext = () => {
    if (mode === "vertical") {
      if (snapshot.pageIndex >= total - 1) vertical.current?.scrollToEnd();
      else vertical.current?.scrollToPage(snapshot.pageIndex + 1);
      return;
    }
    if (snapshot.finished) setEndCard(true);
    else actions.next();
  };

  const goPrevious = () => {
    if (endCard) {
      setEndCard(false);
      return;
    }
    if (mode === "vertical") vertical.current?.scrollToPage(snapshot.pageIndex - 1);
    else actions.previous();
  };

  const onCanvasPress = (pageX: number) => {
    const action = tapActionFor(tapZoneAt(pageX, size.width), mode);
    if (action === "toggleControls") setControls((visible) => !visible);
    else if (action === "next") goNext();
    else goPrevious();
  };

  const openNext = () => {
    if (next !== null) onOpenChapter(next.id, next.releaseId);
  };

  const endCardView = (
    <ReaderEndCard
      chapterNumber={chapter.number}
      next={next === null ? null : { number: next.number }}
      width={column}
      onOpenNext={openNext}
    />
  );

  return (
    <View testID="screen-reader" style={readerCanvasStyle()}>
      <Pressable
        testID="reader-canvas"
        accessible={false}
        style={readerCanvasStyle()}
        onLayout={onLayout}
        onPress={(event) => onCanvasPress(event.nativeEvent.pageX)}
      >
        <View style={{ flex: 1, alignItems: "center" }}>
          {size.width === 0 ? null : mode === "vertical" ? (
            <ReaderVertical
              ref={vertical}
              images={images}
              width={column}
              window={snapshot.window}
              initialPage={snapshot.pageIndex}
              onPageChange={actions.goToPage}
              footer={endCardView}
              footerClearance={controls ? FOOTER_CLEARANCE : 0}
            />
          ) : endCard ? (
            <View style={{ flex: 1, justifyContent: "center" }}>{endCardView}</View>
          ) : (
            <ReaderPaged
              image={images[snapshot.pageIndex] as (typeof images)[number]}
              pageIndex={snapshot.pageIndex}
              width={column}
              height={size.height}
            />
          )}
        </View>
      </Pressable>

      {controls ? (
        <ReaderTopBar
          title={ready.seriesTitle}
          subtitle={
            chapter.number === undefined
              ? chapter.title
              : t("series.chapter", { number: chapter.number })
          }
          chapterShort={
            chapter.number === undefined
              ? t("reader.chapters.title")
              : t("reader.chapter.short", { number: chapter.number })
          }
          onClose={onClose}
          onOpenChapters={() => setSheet("chapters")}
        />
      ) : null}
      {controls ? (
        <ReaderBottomBar
          pageIndex={snapshot.pageIndex}
          pageTotal={snapshot.pageTotal}
          modeLabel={modeLabel(mode)}
          next={next === null ? null : { number: next.number }}
          onPrevious={goPrevious}
          onNext={goNext}
          onOpenMode={() => setSheet("mode")}
          onOpenNextChapter={openNext}
        />
      ) : null}

      <ReaderModeSheet
        visible={sheet === "mode"}
        mode={mode}
        onSelect={(selected) => {
          setSheet(null);
          actions.setMode(selected);
        }}
        onClose={() => setSheet(null)}
      />
      <ReaderChaptersSheet
        visible={sheet === "chapters"}
        chapters={ready.chapters}
        currentId={chapter.id}
        onSelect={(selected) => {
          setSheet(null);
          onOpenChapter(selected.id, selected.releaseId);
        }}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}
