import Button, { type ButtonVariant } from "@ryuunest/web/components/Button";

import "./domainRow.css";

/**
 * F26 — fila de un dominio en la página de opciones: el host completo (se parte,
 * no se recorta con «…», DESIGN_RULES T7) y una acción. Sirve para los
 * pendientes («Autorizar») y para los autorizados («Quitar permiso»).
 */
export interface DomainRowProps {
  host: string;
  kind: "pending" | "authorized";
  actionLabel: string;
  actionVariant?: ButtonVariant | undefined;
  onAction: () => void;
  disabled?: boolean | undefined;
}

export default function DomainRow({
  host,
  kind,
  actionLabel,
  actionVariant = "secondary",
  onAction,
  disabled,
}: DomainRowProps) {
  return (
    <li className="domain-row" data-testid={`domain-row-${kind}-${host}`}>
      <span className="t-body-md domain-host">{host}</span>
      <Button
        variant={actionVariant}
        label={actionLabel}
        ariaLabel={`${actionLabel} ${host}`}
        onClick={onAction}
        disabled={disabled}
        testID={`domain-action-${kind}-${host}`}
      />
    </li>
  );
}
