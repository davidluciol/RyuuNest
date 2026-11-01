import { t } from "@ryuunest/i18n";
import { defaultTheme } from "@ryuunest/ui-tokens";
import type { LibraryEntry } from "@ryuunest/core";

import DragonMarker from "./DragonMarker";
import "./coverCard.css";

/**
 * F25 — tarjeta de portada web (2:3): imagen del módulo o marcador si no hay;
 * título a 2 líneas y barra de progreso (RF-41) cuando la serie tiene.
 */
export default function CoverCard({
  entry,
  onClick,
  testID,
}: {
  entry: LibraryEntry;
  onClick?: (() => void) | undefined;
  testID?: string | undefined;
}) {
  const percent =
    entry.progress !== null && entry.progress.pageTotal !== null && entry.progress.pageTotal > 0
      ? Math.round((entry.progress.pageIndex / entry.progress.pageTotal) * 100)
      : null;

  return (
    <button type="button" className="cover-card" onClick={onClick} data-testid={testID}>
      <span className="cover-card-cover">
        {entry.coverUrl !== null ? (
          <img src={entry.coverUrl} alt="" loading="lazy" />
        ) : (
          <span className="cover-card-placeholder">
            <DragonMarker size={48} color={defaultTheme.colors.accent} />
          </span>
        )}
      </span>
      <span className="t-body-sm cover-card-title">{entry.title}</span>
      {percent !== null && (
        <span className="cover-card-progress" aria-label={t("reader.progress.percent", { percent })}>
          <span className="cover-card-progress-fill" style={{ width: `${percent}%` }} />
        </span>
      )}
    </button>
  );
}
