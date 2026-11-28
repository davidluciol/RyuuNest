import { useEffect, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { useKeepAwake } from "expo-keep-awake";
import type { ReaderMode } from "@ryuunest/core";
import { spacing } from "@ryuunest/ui-tokens";

import { t } from "../../i18n";
import {
  AUTO_NEXT_DELAY_MS,
  CONTROLS_HIDE_MS,
  columnWidth,
  swipeActionFor,
  tapActionFor,
  tapZoneAt,
} from "../../reader/readerLayout";
import { ReaderBottomBar, ReaderTopBar } from "./ReaderBars";
import ReaderEndCard from "./ReaderEndCard";
import ConfirmSheet from "../../components/ConfirmSheet";
import { previousUnread } from "../../reader/readingOrder";
import ReaderPaged from "./ReaderPaged";
import type { PageReport } from "./ReaderPageImage";
import { ReaderChaptersSheet, ReaderModeSheet } from "./ReaderSheets";
import ReaderVertical, { type ReaderVerticalHandle } from "./ReaderVertical";
import { FALLBACK_READER_MODE, modeLabel } from "./readerModes";
import { readerCanvasStyle } from "./readerStyles";
import type { ReaderActions, ReaderReady } from "./useReader";
import type { ReaderPreload } from "./useReaderPrefetch";
import Badge from "../../components/Badge";
import ZoomableView from "./ZoomableView";
import FocusPressable from "../../components/FocusPressable";

/**
 * F18 — pantalla del lector (RF-18 a RF-22): lienzo con el contenido y nada más. En paginado el
 * centro muestra u oculta los controles y las laterales o el deslizamiento cambian de página
 * (invertidos en D→I). F51: en webtoon solo se desliza y se pellizca; mantener presionado
 * muestra las barras, que se ocultan solas a los 3 s, y al ver la tarjeta de fin se abre el
 * siguiente capítulo a los 3 s. Sin animaciones. Recibe la vista ya cargada (`useReader`).
 */

/** Espacio al final de la lista vertical para que la tarjeta de fin no quede bajo la barra. */
const FOOTER_CLEARANCE = spacing["2xl"] * 4;

export interface ReaderScreenProps {
  ready: ReaderReady;
  /** F51/R2 — avance del lote de la página actual y la cola de carga de las páginas. */
  preload: ReaderPreload;
  actions: ReaderActions;
  onClose: () => void;
  onOpenChapter: (chapterId: string, releaseId: string | null) => void;
  /** F103: «Mandar reporte» desde el error de una página. */
  onReportPage?: (failure: PageReport) => void;
}

type Sheet = "mode" | "chapters" | "previous" | null;

export default function ReaderScreen({
  ready,
  preload,
  actions,
  onClose,
  onOpenChapter,
  onReportPage,
}: ReaderScreenProps) {
  const { snapshot, images, chapter, next } = ready;
  const mode: ReaderMode = snapshot.mode ?? FALLBACK_READER_MODE;
  const total = snapshot.pageTotal ?? images.length;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [controls, setControls] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [endCard, setEndCard] = useState(false);
  const [verticalAtEnd, setVerticalAtEnd] = useState(false);
  const vertical = useRef<ReaderVerticalHandle>(null);
  const column = columnWidth(size.width);
  const atEnd = mode === "vertical" ? verticalAtEnd : endCard;
  const autoNext = atEnd && next !== null && sheet === null;
  const pendingPrevious = useMemo(
    () => previousUnread(ready.chapters, chapter.id),
    [ready.chapters, chapter.id],
  );
  // #181: al terminar, se pregunta una vez por capítulo si marcar los anteriores sin leer.
  const askedPrevious = useRef<string | null>(null);
  useEffect(() => {
    if (!atEnd || pendingPrevious.length === 0 || askedPrevious.current === chapter.id) return;
    askedPrevious.current = chapter.id;
    setSheet("previous");
  }, [atEnd, pendingPrevious, chapter.id]);

  // RF-23: la pantalla no se apaga mientras se lee.
  useKeepAwake("reader");

  // Moverse de página, de modo o de capítulo cierra la tarjeta de fin del modo paginado.
  useEffect(() => setEndCard(false), [snapshot.pageIndex, chapter.id, mode]);
  useEffect(() => setVerticalAtEnd(false), [chapter.id, mode]);

  // F51: las barras se ocultan solas; pasar de página reinicia la cuenta y una hoja abierta la pausa.
  useEffect(() => {
    if (!controls || sheet !== null) return;
    const timer = setTimeout(() => setControls(false), CONTROLS_HIDE_MS);
    return () => clearTimeout(timer);
  }, [controls, sheet, snapshot.pageIndex]);

  // F51: con la tarjeta de fin a la vista, se abre el siguiente capítulo; alejarse lo cancela.
  // Ref: un callback nuevo en cada render no debe reiniciar la cuenta.
  const openChapterRef = useRef(onOpenChapter);
  openChapterRef.current = onOpenChapter;
  const nextId = next?.id ?? null;
  const nextReleaseId = next?.releaseId ?? null;
  useEffect(() => {
    if (!autoNext || nextId === null) return;
    const timer = setTimeout(
      () => openChapterRef.current(nextId, nextReleaseId),
      AUTO_NEXT_DELAY_MS,
    );
    return () => clearTimeout(timer);
  }, [autoNext, nextId, nextReleaseId]);

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
    const action = tapActionFor(tapZoneAt(pageX, size.width), mode, controls);
    if (action === "toggleControls") setControls((visible) => !visible);
    else if (action === "next") goNext();
    else if (action === "previous") goPrevious();
  };

  const showControls = () => setControls(true);

  const onSwipe = (dx: number, dy: number) => {
    const action = swipeActionFor(dx, dy, mode);
    if (action === "next") goNext();
    else if (action === "previous") goPrevious();
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
      autoNextSeconds={autoNext ? AUTO_NEXT_DELAY_MS / 1000 : null}
    />
  );

  return (
    <View testID="screen-reader" style={readerCanvasStyle()}>
      <ZoomableView
        resetKey={mode === "vertical" ? chapter.id : snapshot.pageIndex}
        onSwipe={mode === "vertical" ? undefined : onSwipe}
      >
        <FocusPressable
          testID="reader-canvas"
          disabled={mode === "vertical"}
          focusable={false}
          accessible={false}
          style={readerCanvasStyle()}
          onLayout={onLayout}
          onPress={(event) => onCanvasPress(event.nativeEvent.pageX)}
          onLongPress={showControls}
        >
          <View style={{ flex: 1, alignItems: "center" }}>
            {size.width === 0 ? null : mode === "vertical" ? (
              <ReaderVertical
                ref={vertical}
                images={images}
                queue={preload.queue}
                width={column}
                window={snapshot.window}
                initialPage={snapshot.pageIndex}
                onPageChange={actions.goToPage}
                footer={endCardView}
                footerClearance={controls ? FOOTER_CLEARANCE : 0}
                onEndChange={setVerticalAtEnd}
                onPress={onCanvasPress}
                onLongPress={showControls}
                {...(onReportPage === undefined ? {} : { onReportPage })}
              />
            ) : endCard ? (
              <View style={{ flex: 1, justifyContent: "center" }}>{endCardView}</View>
            ) : (
              <ReaderPaged
                queue={preload.queue}
                image={images[snapshot.pageIndex] as (typeof images)[number]}
                pageIndex={snapshot.pageIndex}
                width={column}
                height={size.height}
                {...(onReportPage === undefined ? {} : { onReportPage })}
              />
            )}
          </View>
        </FocusPressable>
      </ZoomableView>

      {preload.progress === null ? null : (
        <View
          testID="reader-loading-batch"
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: FOOTER_CLEARANCE,
            alignItems: "center",
          }}
        >
          <Badge label={t("reader.loading.batch", preload.progress)} />
        </View>
      )}

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
      <ConfirmSheet
        visible={sheet === "previous"}
        animated={false}
        title={t("reader.markPrevious.title")}
        message={
          pendingPrevious.length === 1
            ? t("reader.markPrevious.message.one")
            : t("reader.markPrevious.message.other", { count: pendingPrevious.length })
        }
        confirmLabel={t("reader.markPrevious.confirm")}
        confirmIcon={null}
        cancelLabel={t("reader.markPrevious.cancel")}
        onConfirm={() => {
          setSheet(null);
          actions.markRead(pendingPrevious);
        }}
        onCancel={() => setSheet(null)}
        testID="reader-mark-previous"
        confirmTestID="reader-mark-previous-confirm"
        cancelTestID="reader-mark-previous-cancel"
      />
    </View>
  );
}
