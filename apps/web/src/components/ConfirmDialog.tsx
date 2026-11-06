import { useEffect, useState } from "react";

import { confirmPresentation } from "@ryuunest/mobile-src/components/confirmSheetStyles";

import { Trash2 } from "../icons";
import Button from "./Button";
import "./confirmDialog.css";
import { t } from "@ryuunest/i18n";

/**
 * F34.2 — confirmación de una acción con consecuencias (reemplazar el respaldo, desinstalar,
 * quitar un repositorio, borrar el registro). Un solo patrón, igual que `ConfirmSheet` en móvil
 * (`confirmar_accion_dragon_night`): hoja anclada abajo en pantallas estrechas y diálogo centrado
 * en las anchas (la misma regla pura que móvil, `confirmPresentation`). La acción va en amarillo
 * (`caution`): avisa sin asustar.
 */

function useViewportWidth(): number {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

export interface ConfirmDialogProps {
  title: string;
  /** Consecuencia de la acción, en lenguaje simple. */
  message: string;
  /** Nombre del elemento afectado (módulo, repositorio, archivo). */
  subject?: string | undefined;
  confirmLabel: string;
  cancelLabel?: string | undefined;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean | undefined;
  error?: string | null | undefined;
  testID?: string | undefined;
  confirmTestID?: string | undefined;
  cancelTestID?: string | undefined;
}

export default function ConfirmDialog({
  title,
  message,
  subject,
  confirmLabel,
  cancelLabel = t("confirm.cancel"),
  onConfirm,
  onCancel,
  busy = false,
  error = null,
  testID,
  confirmTestID,
  cancelTestID,
}: ConfirmDialogProps) {
  const presentation = confirmPresentation(useViewportWidth());
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className={`confirm-overlay confirm-${presentation}`} onClick={() => !busy && onCancel()}>
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        data-testid={testID}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="confirm-grab" aria-hidden />
        <h2 id="confirm-title" className="t-headline-sm confirm-title">
          {title}
        </h2>
        {subject !== undefined && <span className="t-label-lg confirm-subject">{subject}</span>}
        <p id="confirm-message" className="t-body-md confirm-message">
          {message}
        </p>
        {error !== null && (
          <p className="t-body-sm field-error" role="alert">
            {error}
          </p>
        )}
        <div className="confirm-actions">
          <Button
            variant="caution"
            label={confirmLabel}
            icon={<Trash2 size={16} aria-hidden />}
            onClick={onConfirm}
            disabled={busy}
            testID={confirmTestID}
          />
          <Button variant="secondary" label={cancelLabel} onClick={onCancel} disabled={busy} testID={cancelTestID} />
        </div>
      </div>
    </div>
  );
}
