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
import {
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import type { PageWindow } from "@ryuunest/core";

import {
  anchorDelta,
  pageAtOffset,
  pageHeights,
  pageOffset,
  shouldMountImage,
} from "../../reader/verticalLayout";
import ReaderPageImage from "./ReaderPageImage";
import type { ReaderImage } from "./readingSource";

/**
 * F18 — modo vertical continuo (RF-18, SPEC §9). Cada página ocupa su altura (conocida al cargar,
 * estimada antes) y solo se montan las imágenes dentro de `window`, la ventana que declara el
 * núcleo; las demás son huecos del mismo alto, así que la memoria no crece con el capítulo.
 */

export interface ReaderVerticalHandle {
  scrollToPage: (index: number) => void;
  scrollToEnd: () => void;
}

export interface ReaderVerticalProps {
  images: readonly ReaderImage[];
  width: number;
  window: PageWindow | null;
  /** Página con la que se abre (la guardada, RF-20). */
  initialPage: number;
  onPageChange: (index: number) => void;
  /** Tarjeta de fin de capítulo al final de la lista (RF-21). */
  footer: React.ReactNode;
  /** Espacio bajo el pie para que no lo tape la barra inferior cuando está visible. */
  footerClearance: number;
}

const ReaderVertical = forwardRef<ReaderVerticalHandle, ReaderVerticalProps>(
  function ReaderVertical(
    { images, width, window, initialPage, onPageChange, footer, footerClearance },
    ref,
  ) {
    const scrollRef = useRef<ScrollView>(null);
    const offsetY = useRef(0);
    const currentPage = useRef(initialPage);
    const placed = useRef(false);
    const [aspects, setAspects] = useState<Record<number, number>>({});
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
          scrollRef.current?.scrollTo({ y: pageOffset(heightsRef.current, clamped), animated: false });
        },
        scrollToEnd: () => scrollRef.current?.scrollToEnd({ animated: false }),
      }),
      [images.length],
    );

    // Se coloca una vez en la página guardada, cuando ya hay contenido con su altura.
    const placeInitialPage = useCallback(() => {
      if (placed.current || width <= 0) return;
      placed.current = true;
      scrollRef.current?.scrollTo({
        y: pageOffset(heightsRef.current, initialPage),
        animated: false,
      });
    }, [width, initialPage]);

    useEffect(() => {
      placeInitialPage();
    }, [placeInitialPage]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      offsetY.current = y;
      const page = pageAtOffset(heightsRef.current, y);
      if (page !== null && page !== currentPage.current) {
        currentPage.current = page;
        onPageChange(page);
      }
    };

    const onAspect = (index: number, aspect: number) => {
      setAspects((previous) => {
        if (previous[index] === aspect) return previous;
        const delta = anchorDelta({
          changedIndex: index,
          currentPage: currentPage.current,
          previousHeight: heightsRef.current[index] ?? 0,
          nextHeight: width / aspect,
        });
        if (delta !== 0) {
          requestAnimationFrame(() =>
            scrollRef.current?.scrollTo({ y: offsetY.current + delta, animated: false }),
          );
        }
        return { ...previous, [index]: aspect };
      });
    };

    return (
      <ScrollView
        ref={scrollRef}
        testID="reader-vertical"
        onScroll={onScroll}
        onContentSizeChange={placeInitialPage}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ alignItems: "center", paddingBottom: footerClearance }}
      >
        {images.map((image, index) => (
          <View key={index} style={{ width, height: heights[index] }}>
            {shouldMountImage(index, window) ? (
              <ReaderPageImage
                image={image}
                width={width}
                height={heights[index] ?? 0}
                fit="fill"
                pageNumber={index + 1}
                testID={`reader-page-${index}`}
                onAspect={(aspect) => onAspect(index, aspect)}
              />
            ) : null}
          </View>
        ))}
        {footer}
      </ScrollView>
    );
  },
);

export default ReaderVertical;
