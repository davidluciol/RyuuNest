import { t } from "@ryuunest/i18n";

import EmptyState from "../components/EmptyState";

/**
 * F25 — pantalla en estado vacío real (sin datos de ejemplo, P-113): la raíz
 * lleva el marcador estable `screen-<id>` que esperan los e2e.
 */
export interface EmptyScreenProps {
  readonly screenId: string;
  readonly titleKey: string;
  readonly messageKey?: string | undefined;
  readonly actionKey: string;
  readonly onAction?: (() => void) | undefined;
}

export default function EmptyScreen({ screenId, titleKey, messageKey, actionKey, onAction }: EmptyScreenProps) {
  return (
    <div className="screen" data-testid={`screen-${screenId}`}>
      <EmptyState
        title={t(titleKey)}
        message={messageKey === undefined ? undefined : t(messageKey)}
        actionLabel={t(actionKey)}
        onAction={onAction}
      />
    </div>
  );
}
