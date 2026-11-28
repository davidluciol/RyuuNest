// single-use: lista del modo vertical continuo; solo existe dentro del lector (F18).
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import type { PageWindow } from "@ryuunest/core";

import type { PageQueue } from "../../reader/pageQueue";
import {
  anchorDelta,
  createScrollAnchor,
  visiblePage,
  pageHeightFor,
  pageHeights,
  pageOffset,
  shouldMountImage,
} from "../../reader/verticalLayout";
import { isAtScrollEnd } from "../../reader/readerLayout";
import FocusPressable from "../../components/FocusPressable";
import ReaderPageImage from "./ReaderPageImage";
import type { ReaderImage } from "./readingSource";

/**
 * F18 — modo vertical continuo (RF-18, SPEC §9). Cada página ocupa su altura (conocida al cargar,
 * estimada antes) y solo se decodifican las imágenes dentro de `window`, la ventana que declara el
 * núcleo; las demás muestran su número y estado (R2) con el mismo alto, así que la memoria no
 * crece con el capítulo. Las filas están memoizadas: cargar una página o pasar de página no vuelve
 * a pintar las demás.
 */

export interface ReaderVerticalHandle {
  scrollToPage: (index: number) => void;
  scrollToEnd: () => void;
}

export interface ReaderVerticalProps {
  images: readonly ReaderImage[];
  /** R1 — cola de carga; cada página lee de ella su estado. */
  queue: PageQueue | null;
  width: number;
  window: PageWindow | null;
  /** Página con la que se abre (la guardada, RF-20). */
  initialPage: number;
  onPageChange: (index: number) => void;
  /** Tarjeta de fin de capítulo al final de la lista (RF-21). */
  footer: React.ReactNode;
  /** Espacio bajo el pie para que no lo tape la barra inferior cuando está visible. */
  footerClearance: number;
  /** F51 — avisa cuando el final de la lista (la tarjeta de fin) entra o sale de la vista. */
  onEndChange: (atEnd: boolean) => void;
  /**
   * F51 — tocar y mantener. Se atienden aquí, dentro del ScrollView: un Pressable que lo envuelve
   * le roba el arrastre en Android en cuanto JS le concede el respondedor (P-193).
   */
  onPress: (pageX: number) => void;
  onLongPress: () => void;
}

const ReaderVertical = forwardRef<ReaderVerticalHandle, ReaderVerticalProps>(
  function ReaderVertical(
    {
      images,
      queue,
      width,
      window,
      initialPage,
      onPageChange,
      footer,
      footerClearance,
      onEndChange,
      onPress,
      onLongPress,
    },
    ref,
  ) {
    const atEnd = useRef(false);
    const scrollRef = useRef<ScrollView>(null);
    const offsetY = useRef(0);
    const currentPage = useRef(initialPage);
    const placed = useRef(false);
    const [aspects, setAspects] = useState<Record<number, number>>({});
    const aspectsRef = useRef(aspects);
    const anchor = useRef(createScrollAnchor());
    const heights = useMemo(
      () => pageHeights(width, images.length, aspects),
      [width, images.length, aspects],
    );
    const heightsRef = useRef(heights);
    heightsRef.current = heights;

    useImperativeHandle(
      ref,
      () => ({
        scrollToPage: (index) => {
          const clamped = Math.max(0, Math.min(index, images.length - 1));
          offsetY.current = pageOffset(heightsRef.current, clamped);
          scrollRef.current?.scrollTo({ y: offsetY.current, animated: false });
        },
        scrollToEnd: () => scrollRef.current?.scrollToEnd({ animated: false }),
      }),
      [images.length],
    );

    // Se coloca una vez en la página guardada, cuando ya hay contenido con su altura.
    const placeInitialPage = useCallback(() => {
      if (placed.current || width <= 0) return;
      placed.current = true;
      offsetY.current = pageOffset(heightsRef.current, initialPage);
      scrollRef.current?.scrollTo({ y: offsetY.current, animated: false });
    }, [width, initialPage]);

    useEffect(() => {
      placeInitialPage();
    }, [placeInitialPage]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const y = contentOffset.y;
      offsetY.current = y;
      const end = isAtScrollEnd(y, layoutMeasurement.height, contentSize.height);
      if (end !== atEnd.current) {
        atEnd.current = end;
        onEndChange(end);
      }
      const page = visiblePage(heightsRef.current, y, end);
      if (page !== null && page !== currentPage.current) {
        currentPage.current = page;
        onPageChange(page);
      }
    };

    // Estable entre renders para que las filas memoizadas no se vuelvan a pintar.
    const onAspect = useCallback(
      (index: number, aspect: number) => {
        if (aspectsRef.current[index] === aspect) return;
        const delta = anchorDelta({
          changedIndex: index,
          currentPage: currentPage.current,
          previousHeight: heightsRef.current[index] ?? 0,
          nextHeight: pageHeightFor(width, aspect),
        });
        aspectsRef.current = { ...aspectsRef.current, [index]: aspect };
        setAspects(aspectsRef.current);
        if (delta === 0) return;
        anchor.current.add(delta);
        requestAnimationFrame(() => {
          const pending = anchor.current.take();
          if (pending === 0) return;
          offsetY.current += pending;
          scrollRef.current?.scrollTo({ y: offsetY.current, animated: false });
        });
      },
      [width],
    );

    return (
      <ScrollView
        ref={scrollRef}
        testID="reader-vertical"
        onScroll={onScroll}
        onContentSizeChange={placeInitialPage}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerClearance }}
      >
        <FocusPressable
          focusable={false}
          accessible={false}
          style={{ alignItems: "center" }}
          onPress={(event) => onPress(event.nativeEvent.pageX)}
          onLongPress={onLongPress}
        >
          {images.map((image, index) => (
            <View key={`${index}:${image.url}`} style={{ width, height: heights[index] }}>
              <ReaderPageImage
                image={image}
                index={index}
                queue={queue}
                decode={shouldMountImage(index, window)}
                width={width}
                height={heights[index] ?? 0}
                fit="fill"
                testID={`reader-page-${index}`}
                onAspect={onAspect}
              />
            </View>
          ))}
          {footer}
        </FocusPressable>
      </ScrollView>
    );
  },
);

export default ReaderVertical;
