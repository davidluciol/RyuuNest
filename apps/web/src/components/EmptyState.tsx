import { defaultTheme } from "@ryuunest/ui-tokens";

import Button from "./Button";
import DragonMarker from "./DragonMarker";
import "./emptyState.css";

/**
 * F24 — estado vacío web (SPEC §11.12): dragón mediano, título en Manrope,
 * mensaje atenuado y **una acción siguiente**. Sin tarjetas-mascota. Los textos
 * llegan ya traducidos por props (las cadenas viven en el catálogo, F10/P-112).
 */
export interface EmptyStateProps {
  title: string;
  /** Texto de apoyo opcional bajo el título. */
  message?: string | undefined;
  /** Etiqueta de la acción siguiente (obligatoria: todo vacío lleva una). */
  actionLabel: string;
  onAction?: (() => void) | undefined;
  testID?: string | undefined;
}

export default function EmptyState({ title, message, actionLabel, onAction, testID }: EmptyStateProps) {
  return (
    <div className="empty-state" data-testid={testID}>
      <DragonMarker size={96} color={defaultTheme.colors.accent} />
      <p className="t-headline-sm empty-title">{title}</p>
      {message ? <p className="t-body-md empty-message">{message}</p> : null}
      <Button label={actionLabel} onClick={onAction} />
    </div>
  );
}
