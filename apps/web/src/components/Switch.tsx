import "./switch.css";

/** F25 — interruptor web (área táctil mínima 48 px, RNF-7; estado no solo por color). */
export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean | undefined;
  hint?: string | undefined;
  /** Tono del texto secundario: `warning` cuando el ajuste no se puede activar. */
  hintTone?: "default" | "warning" | undefined;
  testID?: string | undefined;
}

export default function Switch({ checked, onChange, label, disabled, hint, hintTone = "default", testID }: SwitchProps) {
  return (
    <label className={`switch-row${disabled === true ? " switch-disabled" : ""}`}>
      <input
        type="checkbox"
        role="switch"
        className="switch-input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        data-testid={testID}
      />
      <span className="switch-track" aria-hidden>
        <span className="switch-thumb" />
      </span>
      <span className="switch-texts">
        <span className="t-body-md switch-label">{label}</span>
        {hint !== undefined && <span className={`t-body-sm switch-hint${hintTone === "warning" ? " switch-hint-warning" : ""}`}>{hint}</span>}
      </span>
    </label>
  );
}
