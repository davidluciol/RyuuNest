import { t } from "@ryuunest/i18n";

import { X } from "../icons";
import Button from "./Button";
import "./banner.css";

/**
 * F27 — aviso persistente y accionable (P-72: banner inline, el equivalente web
 * del `ErrorBanner` móvil): una franja pegada arriba que no tapa el contenido, con
 * un mensaje que se parte en varias líneas (nunca se recorta con «…», DESIGN_RULES
 * T7), una acción opcional y cerrar. La acción es
 * secundaria para no competir con el botón primario de la pantalla (V3). El
 * tono no es solo color: el mensaje dice lo que pasa.
 */
export interface BannerProps {
  tone?: "warning" | "error" | undefined;
  message: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
  onClose?: (() => void) | undefined;
  testID?: string | undefined;
}

export default function Banner({
  tone = "warning",
  message,
  actionLabel,
  onAction,
  onClose,
  testID,
}: BannerProps) {
  return (
    <div
      className={`banner banner-${tone}`}
      role={tone === "error" ? "alert" : "status"}
      data-testid={testID}
    >
      <p className="t-body-md banner-message">{message}</p>
      <div className="banner-actions">
        {actionLabel !== undefined && onAction !== undefined && (
          <Button
            variant="secondary"
            label={actionLabel}
            onClick={onAction}
            testID={testID === undefined ? undefined : `${testID}-action`}
          />
        )}
        {onClose !== undefined && (
          <button
            type="button"
            className="banner-close"
            onClick={onClose}
            aria-label={t("actions.close")}
            data-testid={testID === undefined ? undefined : `${testID}-close`}
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
