// single-use: vista del modo paginado; solo existe dentro del lector (F18).
import { View } from "react-native";

import type { PageQueue } from "../../reader/pageQueue";
import ReaderPageImage, { type PageReport } from "./ReaderPageImage";
import type { ReaderImage } from "./readingSource";

/**
 * F18 — modo paginado (RF-18): una página a la vez, ajustada a la columna de lectura. El núcleo
 * declara la ventana (la actual y las siguientes, SPEC §9); aquí solo hay una imagen montada y
 * la cola (R1) baja las siguientes a disco.
 */

export interface ReaderPagedProps {
  image: ReaderImage;
  queue: PageQueue | null;
  pageIndex: number;
  width: number;
  height: number;
  /** F103: «Mandar reporte» desde el error de la página. */
  onReportPage?: (failure: PageReport) => void;
}

export default function ReaderPaged({
  image,
  queue,
  pageIndex,
  width,
  height,
  onReportPage,
}: ReaderPagedProps) {
  return (
    <View testID="reader-paged" style={{ width, height }}>
      {/* La clave por página e imagen evita que el error de una pase a otra (o a otro capítulo). */}
      <ReaderPageImage
        key={`${pageIndex}:${image.url}`}
        image={image}
        index={pageIndex}
        queue={queue}
        decode
        width={width}
        height={height}
        fit="contain"
        testID={`reader-page-${pageIndex}`}
        {...(onReportPage === undefined ? {} : { onReport: onReportPage })}
      />
    </View>
  );
}
