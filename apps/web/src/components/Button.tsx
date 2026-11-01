import "./button.css";

/**
 * F24 — botón web (DOM) con las mismas variantes que el móvil (SPEC §11.10):
 * primario / secundario / destructivo. Un primario por pantalla; el relleno
 * `accent`/`progress` lleva texto en `bg` (inversión, SPEC §11.9). Los estilos
 * viven en `button.css` con variables de tokens; aquí no hay literales (AC-13).
 */
export type ButtonVariant = "primary" | "secondary" | "destructive";

export interface ButtonProps {
  variant?: ButtonVariant | undefined;
  /** Texto del botón. */
  label: string;
  onClick?: (() => void) | undefined;
  disabled?: boolean | undefined;
  /** Icono Lucide a la izquierda; hereda el color del texto. */
  icon?: React.ReactNode;
  /** Icono Lucide a la derecha. */
  trailingIcon?: React.ReactNode;
  /** Etiqueta accesible cuando el label visual no basta. */
  ariaLabel?: string | undefined;
  /** Identificador para pruebas (e2e de Playwright). */
  testID?: string | undefined;
  type?: "button" | "submit" | undefined;
}

export default function Button({
  variant = "primary",
  label,
  onClick,
  disabled = false,
  icon,
  trailingIcon,
  ariaLabel,
  testID,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      data-testid={testID}
    >
      {icon}
      <span className="t-body-md btn-label">{label}</span>
      {trailingIcon}
    </button>
  );
}
