import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { t } from "@ryuunest/i18n";
import type { ReaderMode } from "@ryuunest/core";

import Button from "../../components/Button";
import LoadingState from "../../components/LoadingState";
import { ArrowLeft, BookOpen, GalleryVertical } from "../../icons";
import { readerPath } from "../../routes";
import { useServices } from "../../services/ServicesContext";
import "./reader.css";
import { type ReaderPageImage } from "./readerData";
import { useReader, type ReaderReadyView } from "./useReader";

/**
 * F25 — lector web a pantalla completa (`/reader/:moduleId/:seriesId/:chapterId?release=`):
 * vertical continuo (ventana del núcleo) y paginado; barras al tocar; progreso
 * con retraso (RF-20) y reabrir en la página exacta; fallo de capítulo → banner
 * inline estático con reintentar y volver (F31); imagen fallida → reintento
 * individual y registro en `log` (RF-23). Sin animaciones (Regla 4).
 */
export default function ReaderScreen() {
  const { moduleId = "", seriesId = "", chapterId = "" } = useParams();
  const [searchParams] = useSearchParams();
  const services = useServices();
  const navigate = useNavigate();
  const { view, actions } = useReader(
    { moduleId, seriesId, chapterId, releaseId: searchParams.get("release") ?? undefined },
    services,
  );

  return (
    <div className="reader-screen" data-testid="screen-reader">
      {view.status === "loading" && <LoadingState label={t("reader.loading.title")} testID="reader-loading" />}

      {view.status === "error" && (
        <div className="reader-error-banner" data-testid="reader-error-banner" role="alert">
          <p className="t-headline-sm">{t("reader.error.title")}</p>
          <div className="reader-error-actions">
            <Button label={t("actions.retry")} onClick={actions.retry} testID="reader-retry" />
            <Button variant="secondary" label={t("actions.back")} onClick={() => navigate(-1)} testID="reader-back" />
          </div>
        </div>
      )}

      {view.status === "ready" && (
        <ReaderReady
          ready={view.ready}
          actions={actions}
          onOpenChapter={(nextChapterId, releaseId) =>
            navigate(readerPath(moduleId, seriesId, nextChapterId, releaseId ?? undefined), { replace: true })
          }
          onClose={() => navigate(-1)}
        />
      )}
    </div>
  );
}

function ReaderReady({
  ready,
  actions,
  onOpenChapter,
  onClose,
}: {
  ready: ReaderReadyView;
  actions: ReturnType<typeof useReader>["actions"];
  onOpenChapter: (chapterId: string, releaseId: string | null) => void;
  onClose: () => void;
}) {
  const { snapshot, images, seriesTitle, chapters } = ready;
  const [showBars, setShowBars] = useState(true);
  const mode: ReaderMode = snapshot.mode ?? "vertical";
  const pageTotal = snapshot.pageTotal ?? images.length;
  const current = Math.min(snapshot.pageIndex + 1, Math.max(pageTotal, 1));

  return (
    <div className="reader-canvas" onClick={() => setShowBars((value) => !value)}>
      {showBars && (
        <header className="reader-topbar" data-testid="reader-topbar" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="secondary"
            label={t("reader.close")}
            icon={<ArrowLeft size={18} aria-hidden />}
            onClick={onClose}
            testID="reader-close"
          />
          <div className="reader-titles">
            <span className="t-body-md">{seriesTitle}</span>
            <span className="t-body-sm reader-chapter-title">
              {t("reader.chapter.short", { number: ready.chapters.find((c) => c.id === snapshot.chapter?.chapterId)?.number ?? 0 })}
            </span>
          </div>
          <span className="t-body-sm reader-indicator" data-testid="reader-indicator">
            {t("reader.page.indicator", { current, total: pageTotal })}
          </span>
          <Button
            variant="secondary"
            label={t("reader.mode.open")}
            icon={mode === "vertical" ? <GalleryVertical size={18} aria-hidden /> : <BookOpen size={18} aria-hidden />}
            onClick={() => actions.setMode(mode === "vertical" ? "paged-rtl" : "vertical")}
            testID="reader-mode"
          />
        </header>
      )}

      {mode === "vertical" ? (
        <VerticalCanvas images={images} snapshot={snapshot} onVisiblePage={actions.goToPage} />
      ) : (
        <PagedCanvas
          images={images}
          snapshot={snapshot}
          onNext={actions.next}
          onPrevious={actions.previous}
          onToggleBars={() => setShowBars((value) => !value)}
        />
      )}

      {snapshot.finished && (
        <div className="reader-endcard" data-testid="reader-endcard">
          <p className="t-headline-sm">
            {t("reader.end.title", { number: ready.chapters.find((c) => c.id === snapshot.chapter?.chapterId)?.number ?? 0 })}
          </p>
          {snapshot.nextChapter !== null ? (
            <Button
              label={t("reader.end.next", { number: chapters.find((c) => c.id === snapshot.nextChapter?.chapterId)?.number ?? 0 })}
              onClick={() => onOpenChapter(snapshot.nextChapter?.chapterId ?? "", snapshot.nextChapter?.releaseId ?? null)}
              testID="reader-next-chapter"
            />
          ) : (
            <p className="t-body-md reader-end-last">{t("reader.end.last")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function VerticalCanvas({
  images,
  snapshot,
  onVisiblePage,
}: {
  images: ReaderPageImage[];
  snapshot: ReaderReadyView["snapshot"];
  onVisiblePage: (index: number) => void;
}) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const window_ = snapshot.window;
  const from = window_?.from ?? 0;
  // `PageWindow.to` es inclusivo (ReaderState): la ventana es [from, to].
  const to = Math.min((window_?.to ?? images.length - 1) + 1, images.length);

  useEffect(() => {
    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      (entries) => {
        // La página "visible" es la que más cerca queda del centro del viewport:
        // así no importa que varias páginas intersecten la banda a la vez.
        let best: number | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        const viewportCenter = window.innerHeight / 2;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number((entry.target as HTMLElement).dataset.pageIndex);
          if (Number.isNaN(index)) continue;
          const center = entry.boundingClientRect.top + entry.boundingClientRect.height / 2;
          const distance = Math.abs(center - viewportCenter);
          if (distance < bestDistance) {
            bestDistance = distance;
            best = index;
          }
        }
        if (best !== null) onVisiblePage(best);
      },
      { rootMargin: "45% 0px 45% 0px" },
    );
    observerRef.current = observer;
    for (const el of document.querySelectorAll<HTMLElement>(".reader-page")) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [from, to, onVisiblePage, images.length]);

  return (
    <div className="reader-vertical" data-testid="reader-vertical">
      {images.slice(from, to).map((image, offset) => (
        <ReaderImageView key={`${from + offset}`} image={image} index={from + offset} />
      ))}
    </div>
  );
}

function PagedCanvas({
  images,
  snapshot,
  onNext,
  onPrevious,
  onToggleBars,
}: {
  images: ReaderPageImage[];
  snapshot: ReaderReadyView["snapshot"];
  onNext: () => void;
  onPrevious: () => void;
  onToggleBars: () => void;
}) {
  const image = images[snapshot.pageIndex];
  return (
    <div className="reader-paged" data-testid="reader-paged">
      <button type="button" className="reader-zone reader-zone-left" aria-label={t("reader.page.previous")} onClick={(e) => { e.stopPropagation(); onPrevious(); }} />
      <div
        className="reader-page-wrap"
        onClick={(e) => {
          e.stopPropagation();
          // Tocar el centro muestra/oculta barras, salvo si el toque cayó en un control.
          if ((e.target as HTMLElement).closest("button, a, input")) return;
          onToggleBars();
        }}
      >
        {image !== undefined && <ReaderImageView image={image} index={snapshot.pageIndex} />}
      </div>
      <button type="button" className="reader-zone reader-zone-right" aria-label={t("reader.page.next")} onClick={(e) => { e.stopPropagation(); onNext(); }} />
    </div>
  );
}

/** Imagen del lector: con cabeceras va por fetch→blob (CORS lo permite o no, P-111); si no, <img> directo. */
function ReaderImageView({ image, index }: { image: ReaderPageImage; index: number }) {
  const services = useServices();
  const [src, setSrc] = useState<string | null>(image.headers === undefined ? image.url : null);
  const [failed, setFailed] = useState(false);
  const [nonce, setNonce] = useState(0);
  const reported = useRef(false);

  useEffect(() => {
    const headers = image.headers;
    if (headers === undefined) {
      setSrc(image.url);
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(image.url, { headers });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl);
    };
  }, [image.url, image.headers, nonce]);


  if (failed) {
    if (!reported.current) {
      reported.current = true;
      // RF-23 + F31: cada imagen fallida queda registrada (saneada) en `log`.
      services.reporter?.report("error", "reader.image.LOAD", "imagen fallida", {
        url: image.url,
        page: index + 1,
      });
    }
    return (
      <div className="reader-page reader-page-error" data-page-index={index} data-testid={`reader-image-error-${index}`}>
        <p className="t-body-md">{t("reader.image.error", { number: index + 1 })}</p>
        <Button label={t("actions.retry")} onClick={() => { setFailed(false); setNonce((v) => v + 1); }} testID={`reader-image-retry-${index}`} />
      </div>
    );
  }

  return (
    <div className="reader-page" data-page-index={index}>
      {src !== null && (
        <img
          src={src}
          alt={t("reader.page.label", { number: index + 1 })}
          onError={() => setFailed(true)}
          data-testid={`reader-image-${index}`}
        />
      )}
    </div>
  );
}
