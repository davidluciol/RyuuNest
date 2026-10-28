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
}

export default function ZoomableView({ children, resetKey }: ZoomableViewProps) {
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
        onMoveShouldSetPanResponderCapture: (event) => event.nativeEvent.touches.length >= 2,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (event) => {
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
          setZoom(pinchZoom(gesture.current.start, gesture.current.touches, current, viewport.current));
        },
        onPanResponderRelease: () => {
          gesture.current = null;
          setZoom((current) => settleZoom(current));
        },
        onPanResponderTerminate: () => {
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
