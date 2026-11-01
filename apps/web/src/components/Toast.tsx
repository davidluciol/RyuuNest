import { useEffect } from "react";

import { type ErrorSeverity } from "@ryuunest/mobile-src/components/errorNoticeStyles";

import { X } from "../icons";
import "./toast.css";
import { t } from "@ryuunest/i18n";

/**
 * F25 — aviso transitorio (P-72): una línea, se cierra solo a los 4 s y no
 * bloquea. Para errores de acciones puntuales (F31: también se registran en
 * `log` desde quien los produce). El color del borde izquierdo marca la
 * severidad (nunca solo el color: el mensaje también lo dice).
 */
export interface ToastProps {
  message: string;
  severity?: ErrorSeverity | undefined;
  onClose?: (() => void) | undefined;
  testID?: string | undefined;
}

export default function Toast({ message, severity = "error", onClose, testID }: ToastProps) {
  useEffect(() => {
    if (onClose === undefined) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${severity}`} role="status" data-testid={testID}>
      <span className="t-body-md toast-message">{message}</span>
      {onClose !== undefined && (
        <button type="button" className="toast-close" onClick={onClose} aria-label={t("actions.close")}>
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
