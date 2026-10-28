// single-use: vista del modo paginado; solo existe dentro del lector (F18).
import { View } from "react-native";

import ReaderPageImage from "./ReaderPageImage";
import type { ReaderImage } from "./readingSource";

/**
 * F18 — modo paginado (RF-18): una página a la vez, ajustada a la columna de lectura. El núcleo
 * declara la ventana (la actual y las siguientes, SPEC §9); aquí solo hay una imagen montada.
 */

export interface ReaderPagedProps {
  image: ReaderImage;
  pageIndex: number;
  width: number;
  height: number;
}

export default function ReaderPaged({ image, pageIndex, width, height }: ReaderPagedProps) {
  return (
    <View testID="reader-paged" style={{ width, height }}>
      <ReaderPageImage
        image={image}
        width={width}
        height={height}
        fit="contain"
        pageNumber={pageIndex + 1}
        testID={`reader-page-${pageIndex}`}
      />
    </View>
  );
}
