import Button from "./Button";
import DragonMarker from "./DragonMarker";
import "./errorState.css";
import { defaultTheme } from "@ryuunest/ui-tokens";

/**
 * F25 — estado de error a pantalla completa (P-72): dragón, título, mensaje y
 * reintento. El error visible se registra en `log` desde quien lo produce.
 */
export interface ErrorStateProps {
  title: string;
  message?: string | undefined;
  actionLabel: string;
  onAction?: (() => void) | undefined;
  testID?: string | undefined;
}

export default function ErrorState({ title, message, actionLabel, onAction, testID }: ErrorStateProps) {
  return (
    <div className="error-state" data-testid={testID} role="alert">
      <DragonMarker size={96} color={defaultTheme.colors.error} />
      <p className="t-headline-sm error-title">{title}</p>
      {message ? <p className="t-body-md error-message">{message}</p> : null}
      <Button label={actionLabel} onClick={onAction} testID={testID === undefined ? undefined : `${testID}-retry`} />
    </div>
  );
}
