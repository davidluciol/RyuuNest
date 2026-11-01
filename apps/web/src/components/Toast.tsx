import { useEffect } from "react";

import { X } from "../icons";
import "./toast.css";
import { t } from "@ryuunest/i18n";

/**
 * F25 — aviso transitorio (P-72): una línea, se cierra solo a los 4 s y no
 * bloquea. Para errores de acciones puntuales (F31: también se registran en
 * `log` desde quien los produce).
 */
export interface ToastProps {
  message: string;
  onClose?: (() => void) | undefined;
  testID?: string | undefined;
}

export default function Toast({ message, onClose, testID }: ToastProps) {
  useEffect(() => {
    if (onClose === undefined) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast" role="status" data-testid={testID}>
      <span className="t-body-md toast-message">{message}</span>
      {onClose !== undefined && (
        <button type="button" className="toast-close" onClick={onClose} aria-label={t("actions.close")}>
          <X size={16} aria-hidden />
        </button>
      )}
    </div>
  );
}
