import { useEffect, type ReactNode } from "react";

import { X } from "../icons";
import "./dialog.css";
import { t } from "@ryuunest/i18n";

/**
 * F25 — diálogo modal web (hoja de nivel 2 en móvil): overlay + tarjeta
 * `elevated` con título y cierre. El foco queda dentro mientras está abierto.
 */
export interface DialogProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  testID?: string | undefined;
}

export default function Dialog({ title, onClose, children, testID }: DialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-testid={testID}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="dialog-header">
          <h2 className="t-headline-sm">{title}</h2>
          <button type="button" className="dialog-close" onClick={onClose} aria-label={t("sources.sheet.close")}>
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}
