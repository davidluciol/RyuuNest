// single-use: zoom del lienzo del lector; solo existe dentro de él (F19).
import { useEffect, useMemo, useRef, useState } from "react";
import { PanResponder, View, type LayoutChangeEvent } from "react-native";

import {
  NO_ZOOM,
  pinchZoom,
  settleZoom,
  type Point,
  type Viewport,
  type Zoom,
} from "../../reader/zoomMath";

/**
 * F19 — zoom con pellizco (RF-23). Solo captura el gesto cuando hay **dos dedos**: con uno, los
 * toques (zonas táctiles) y el desplazamiento siguen siendo de quien está debajo. Dos dedos
 * amplían y desplazan; al soltar, un zoom imperceptible se deshace. Solo `transform`, sin
 * animación (el lector no anima).
 *
 * Tiene que ir **por fuera** de quien responde a los toques (el lienzo): el sistema de
 * respondedores solo deja que un ancestro le robe el gesto al respondedor actual.
 */

export interface ZoomableViewProps {
  children: React.ReactNode;
  /** Cuando cambia, el zoom vuelve a 1 (por ejemplo, al pasar de página en paginado). */
  resetKey: string | number;
  /**
   * F51 — deslizar con un dedo (paginado). Solo sin zoom y con gesto horizontal; recibe el
   * recorrido al soltar. Sin esta prop, un dedo sigue siendo de quien está debajo.
   */
  onSwipe?: (dx: number, dy: number) => void;
}

/** Recorrido horizontal a partir del cual un dedo se considera deslizamiento y no toque. */
const SWIPE_CAPTURE_DISTANCE = 12;

export default function ZoomableView({ children, resetKey, onSwipe }: ZoomableViewProps) {
  const onSwipeRef = useRef(onSwipe);
  onSwipeRef.current = onSwipe;
  const swiping = useRef(false);
  const [zoom, setZoom] = useState<Zoom>(NO_ZOOM);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const viewport = useRef<Viewport>({ width: 0, height: 0 });
  const gesture = useRef<{ start: Zoom; touches: [Point, Point] } | null>(null);

  useEffect(() => setZoom(NO_ZOOM), [resetKey]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length >= 2,
        onMoveShouldSetPanResponderCapture: (event, state) => {
          if (event.nativeEvent.touches.length >= 2) return true;
          swiping.current =
            onSwipeRef.current !== undefined &&
            zoomRef.current.scale === 1 &&
            Math.abs(state.dx) > SWIPE_CAPTURE_DISTANCE &&
            Math.abs(state.dx) > Math.abs(state.dy);
          return swiping.current;
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (event) => {
          if (swiping.current) return;
          const touches = event.nativeEvent.touches;
          const first = touches[0];
          const second = touches[1];
          if (first === undefined || second === undefined) {
            gesture.current = null;
            return;
          }
          const current: [Point, Point] = [
            { x: first.pageX, y: first.pageY },
            { x: second.pageX, y: second.pageY },
          ];
          if (gesture.current === null) {
            gesture.current = { start: zoomRef.current, touches: current };
            return;
          }
          setZoom(
            pinchZoom(gesture.current.start, gesture.current.touches, current, viewport.current),
          );
        },
        onPanResponderRelease: (_event, state) => {
          if (swiping.current) {
            swiping.current = false;
            onSwipeRef.current?.(state.dx, state.dy);
            return;
          }
          gesture.current = null;
          setZoom((current) => settleZoom(current));
        },
        onPanResponderTerminate: () => {
          swiping.current = false;
          gesture.current = null;
          setZoom((current) => settleZoom(current));
        },
      }),
    [],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    viewport.current = { width, height };
  };

  return (
    <View style={{ flex: 1, overflow: "hidden" }} onLayout={onLayout} {...responder.panHandlers}>
      <View
        testID="reader-zoom"
        style={{
          flex: 1,
          transform: [{ translateX: zoom.x }, { translateY: zoom.y }, { scale: zoom.scale }],
        }}
      >
        {children}
      </View>
    </View>
  );
}
